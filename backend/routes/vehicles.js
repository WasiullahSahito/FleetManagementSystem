import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Inspection from '../models/Inspection.js';
import FuelRecord from '../models/FuelRecord.js';
import Maintenance from '../models/Maintenance.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { excelUpload } from '../middleware/excelUpload.js';
import xlsx from 'xlsx';

const router = express.Router();

// Middleware configuration for handling file uploads
const imageUploadFields = [
  { name: 'main', maxCount: 1 },
  { name: 'damageImages' }
];

// GET all vehicles
router.get('/', authenticate, async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ callsign: 1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET a single vehicle by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const inspections = await Inspection.find({ vehicle: req.params.id }).sort({ date: -1 });

    res.json({
      ...vehicle.toObject(),
      inspections,
    });
  } catch (error) {
    console.error('Error fetching single vehicle:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST (Create) a new vehicle
router.post('/', authenticate, upload.fields(imageUploadFields), async (req, res) => {
  try {
    const vehicleData = { ...req.body, images: {}, damagePoints: [] };

    if (req.files && req.files.main) {
      vehicleData.images.main = `uploads/${req.files.main[0].filename}`;
    }

    if (req.body.damagePoints) {
      const points = JSON.parse(req.body.damagePoints);
      const damageImages = req.files.damageImages || [];

      if (points.length !== damageImages.length) {
        return res.status(400).json({ message: "Mismatch between damage point data and uploaded damage images." });
      }

      vehicleData.damagePoints = points.map((point, index) => ({
        ...point,
        imagePath: `uploads/${damageImages[index].filename}`
      }));
    }

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("Error creating vehicle:", error);
    res.status(400).json({ message: error.message });
  }
});

// --- UPDATED ROUTE FOR BULK UPLOAD WITH TDP IMAGE ---
router.post('/bulk-upload', authenticate, excelUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  try {
    // --- NEW: Added tdp.png to the default image paths ---
    const defaultImages = {
      ambulance: 'assets/images/ambulance.png',
      bike: 'assets/images/bike.png',
      mortuary: 'assets/images/mortuary_van.png',
      tdp: 'assets/images/tdp.png'
    };

    const columnMapping = {
      'ownership': 'ownerName', 'model': 'model', 'year': 'year',
      'call sign': 'callsign', 'reg#': 'registrationNo', 'engine no': 'engineNo',
      'chassis no': 'chassisNo', 'name': 'name', 'station': 'registeredCity',
      'engine capacity': 'engineCapacity', 'mileage': 'mileage',
      'transimission': 'transmission', 'transmission': 'transmission',
      'fuel type': 'fuelType', 'status': 'status',
    };

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'The uploaded file is empty.' });
    }

    let skippedCount = 0;
    const processedVehicles = [];

    for (const row of data) {
      const mappedRow = {};

      for (const key in row) {
        const normalizedKey = key.trim().toLowerCase();
        const schemaKey = columnMapping[normalizedKey];
        if (schemaKey) {
          mappedRow[schemaKey] = row[key];
        }
      }

      if (!mappedRow.name || !mappedRow.callsign || !mappedRow.model || !mappedRow.year) {
        skippedCount++;
        continue;
      }

      const vehicleData = {
        name: String(mappedRow.name),
        callsign: String(mappedRow.callsign),
        model: String(mappedRow.model),
        year: Number(mappedRow.year),
        mileage: mappedRow.mileage ? Number(mappedRow.mileage) : 0,
        status: mappedRow.status || 'OnRoad Fleet',
        chassisNo: mappedRow.chassisNo ? String(mappedRow.chassisNo) : undefined,
        engineNo: mappedRow.engineNo ? String(mappedRow.engineNo) : undefined,
        registrationNo: mappedRow.registrationNo ? String(mappedRow.registrationNo) : undefined,
        fuelType: mappedRow.fuelType || 'Petrol',
        transmission: mappedRow.transmission || 'Manual',
        engineCapacity: mappedRow.engineCapacity ? String(mappedRow.engineCapacity) : undefined,
        registeredCity: mappedRow.registeredCity ? String(mappedRow.registeredCity) : undefined,
        ownerName: mappedRow.ownerName ? String(mappedRow.ownerName) : undefined,
      };

      // --- UPDATED: AUTOMATIC IMAGE ASSIGNMENT LOGIC ---
      const vehicleNameLower = vehicleData.name.toLowerCase();
      let mainImagePath = null;

      if (vehicleNameLower.includes('ambulance')) {
        mainImagePath = defaultImages.ambulance;
      } else if (vehicleNameLower.includes('tdp')) { // Check for TDP first
        mainImagePath = defaultImages.tdp;
      } else if (vehicleNameLower.includes('bike')) {
        mainImagePath = defaultImages.bike;
      } else if (vehicleNameLower.includes('mortuary')) {
        mainImagePath = defaultImages.mortuary;
      }

      if (mainImagePath) {
        vehicleData.images = { main: mainImagePath };
      }

      processedVehicles.push(vehicleData);
    }

    if (processedVehicles.length === 0) {
      return res.status(400).json({ message: 'No valid vehicle records found in the file.' });
    }

    const result = await Vehicle.insertMany(processedVehicles, { ordered: false });

    res.status(201).json({
      message: `Bulk upload successful. ${result.length} vehicles were added. ${skippedCount} rows were skipped.`,
      createdCount: result.length,
      skippedCount: skippedCount
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Bulk upload failed due to duplicate callsigns.',
      });
    }
    console.error("Error during vehicle bulk upload:", error);
    res.status(500).json({ message: 'An error occurred during the bulk upload.', error: error.message });
  }
});

// PUT (Update) a vehicle by ID
router.put('/:id', authenticate, upload.fields(imageUploadFields), async (req, res) => {
  try {
    const vehicleToUpdate = await Vehicle.findById(req.params.id);
    if (!vehicleToUpdate) return res.status(404).json({ message: 'Vehicle not found' });

    const updateData = { ...req.body };
    updateData.images = vehicleToUpdate.images || {};

    if (req.files && req.files.main) {
      updateData.images.main = `uploads/${req.files.main[0].filename}`;
    }

    if (req.body.damagePoints) {
      const pointsFromClient = JSON.parse(req.body.damagePoints);
      const newUploadedImages = req.files.damageImages || [];
      let newImageIndex = 0;

      const updatedDamagePoints = pointsFromClient.map(point => {
        if (point.imagePath) { return point; }
        else if (newUploadedImages[newImageIndex]) {
          const newPointWithFile = {
            ...point,
            imagePath: `uploads/${newUploadedImages[newImageIndex].filename}`
          };
          newImageIndex++;
          return newPointWithFile;
        }
        return null;
      }).filter(p => p !== null);

      updateData.damagePoints = updatedDamagePoints;
    }

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.json(vehicle);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE a vehicle by ID
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    await Inspection.deleteMany({ vehicle: req.params.id });
    await FuelRecord.deleteMany({ vehicle: req.params.id });
    await Maintenance.deleteMany({ vehicle: req.params.id });

    res.json({ message: 'Vehicle and all associated records deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;