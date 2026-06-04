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

// ENHANCED BULK UPLOAD ROUTE WITH DUPLICATE HANDLING AND STATUS FOCUS
router.post('/bulk-upload', authenticate, excelUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  try {
    const defaultImages = {
      ambulance: 'assets/images/ambulance.png',
      bike: 'assets/images/rrb.png',
      mortuary: 'assets/images/mortuary.jpg',
      tdp: 'assets/images/tdp.png'
    };

    const columnMapping = {
      'ownership': 'ownerName',
      'model': 'model',
      'year': 'year',
      'call sign': 'callsign',
      'reg#': 'registrationNo',
      'engine no': 'engineNo',
      'chassis no': 'chassisNo',
      'name': 'name',
      'station': 'registeredCity',
      'engine capacity': 'engineCapacity',
      'mileage': 'mileage',
      'transimission': 'transmission',
      'transmission': 'transmission',
      'fuel type': 'fuelType',
      'status': 'status',
    };

    // Comprehensive station mapping
    const stationMapping = {
      'Tando Muhammad Khan': 'Tando Muhammad Khan',
      'Bathoro': 'Bathoro',
      'Hyderabad': 'Hyderabad',
      'Jamshoro': 'Sehwan',
      'Tando Allah Yar': 'Tando Allahyar',
      'Tando Allahyar': 'Tando Allahyar',
      'Dadu': 'Dadu',
      'Matiari': 'Matiari',
      'Matiyari': 'Matiari',
      'Sanghar': 'Sanghar',
      'Sehwan': 'Sehwan',
      'Qazi Ahmed': 'Qazi Ahmed',
      'qazi ahmed': 'Qazi Ahmed',
      'Naushahro Feroze': 'Naushahro Feroze',
      'TAY': 'Tando Allahyar'
    };

    // Priority status mapping (higher number = higher priority for duplicates)
    const statusPriority = {
      'Insurance Claim': 3,
      'Mechanical Maintenance': 2,
      'OnRoad Fleet': 1
    };

    // Callsign to station mapping for fallback
    const callsignToStationMap = {
      'TH-259': 'Tando Muhammad Khan', 'TH-260': 'Tando Muhammad Khan', 'TH-263': 'Tando Muhammad Khan',
      'SU-271': 'Bathoro', 'SU-276': 'Tando Muhammad Khan', 'SU-389': 'Tando Muhammad Khan',
      'HY-292': 'Hyderabad', 'HY-293': 'Hyderabad', 'HY-294': 'Hyderabad', 'HY-295': 'Hyderabad',
      'HY-296': 'Hyderabad', 'HY-297': 'Hyderabad', 'HY-298': 'Hyderabad', 'HY-299': 'Hyderabad',
      'HY-300': 'Hyderabad', 'HY-301': 'Hyderabad', 'HY-302': 'Hyderabad', 'HY-303': 'Hyderabad',
      'HY-317': 'Hyderabad', 'HY-318': 'Hyderabad', 'HY-319': 'Hyderabad',
      'MK-359': 'Sehwan', 'MK-360': 'Sehwan', 'MK-361': 'Sehwan', 'MK-362': 'Sehwan', 'MK-363': 'Sehwan',
      'JA-391': 'Dadu', 'JA-393': 'Tando Allahyar', 'JA-394': 'Tando Allahyar', 'JA-397': 'Tando Allahyar', 'JA-399': 'Tando Allahyar',
      'MA-412': 'Matiari', 'MA-413': 'Matiari', 'MA-414': 'Matiari', 'MA-415': 'Matiari', 'MA-416': 'Matiari',
      'M-07': 'Hyderabad', 'M-24': 'Sehwan',
      'DA-420': 'Dadu', 'DA-421': 'Dadu',
      'SG-422': 'Sanghar', 'SG-423': 'Sanghar', 'SG-424': 'Sanghar',
      'HY-446': 'Hyderabad', 'JA-447': 'Sehwan', 'SB-448': 'Qazi Ahmed', 'JA-451': 'Sehwan', 'JA-452': 'Sehwan',
      'DA-453': 'Dadu', 'JA-454': 'Sehwan', 'DA-455': 'Dadu', 'DA-456': 'Dadu', 'MA-457': 'Matiari',
      'NF-460': 'Naushahro Feroze', 'SG-461': 'Sanghar', 'SG-463': 'Sanghar', 'JA-464': 'Sehwan',
      'SB-468': 'Qazi Ahmed', 'SG-470': 'Sanghar', 'SG-471': 'Sanghar', 'TA-480': 'Tando Allahyar',
      'DA-512': 'Dadu', 'SB-511': 'Qazi Ahmed'
    };

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'The uploaded file is empty.' });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const processedVehicles = new Map(); // Use Map to handle duplicates by callsign

    console.log(`Processing ${data.length} rows from Excel file`);

    for (const [index, row] of data.entries()) {
      try {
        const mappedRow = {};

        // Map all columns
        for (const key in row) {
          const normalizedKey = key.trim().toLowerCase();
          const schemaKey = columnMapping[normalizedKey];
          if (schemaKey) {
            mappedRow[schemaKey] = row[key];
          }
        }

        // Essential columns validation
        if (!mappedRow.name || !mappedRow.callsign || !mappedRow.model || !mappedRow.year) {
          errors.push(`Row ${index + 2}: Missing required fields (name, callsign, model, or year)`);
          errorCount++;
          continue;
        }

        const callsign = String(mappedRow.callsign).trim();

        // Map station names
        let station = mappedRow.registeredCity ? String(mappedRow.registeredCity).trim() : '';
        if (station && stationMapping[station]) {
          station = stationMapping[station];
        } else if (!station && callsignToStationMap[callsign]) {
          station = callsignToStationMap[callsign];
        } else {
          station = 'Hyderabad'; // Default station
        }

        const vehicleData = {
          name: String(mappedRow.name),
          callsign: callsign,
          model: String(mappedRow.model),
          year: Number(mappedRow.year),
          mileage: mappedRow.mileage ? Number(mappedRow.mileage) : 0,
          status: 'OnRoad Fleet', // Default
          chassisNo: mappedRow.chassisNo ? String(mappedRow.chassisNo) : '',
          engineNo: mappedRow.engineNo ? String(mappedRow.engineNo) : '',
          registrationNo: mappedRow.registrationNo ? String(mappedRow.registrationNo) : '',
          fuelType: mappedRow.fuelType || 'Petrol',
          transmission: mappedRow.transmission || 'Manual',
          engineCapacity: mappedRow.engineCapacity ? String(mappedRow.engineCapacity) : '',
          registeredCity: station,
          ownerName: mappedRow.ownerName ? String(mappedRow.ownerName) : 'PDMA',
        };

        // ENHANCED STATUS MAPPING - Only 3 statuses as required
        const excelStatus = (mappedRow.status || '').toString().toLowerCase().trim();
        if (excelStatus.includes('on-road')) {
          vehicleData.status = 'OnRoad Fleet';
        } else if (excelStatus.includes('mechanical maintenance') || excelStatus.includes('mechanical')) {
          vehicleData.status = 'Mechanical Maintenance';
        } else if (excelStatus.includes('insurance claim') || excelStatus.includes('insurance')) {
          vehicleData.status = 'Insurance Claim';
        }

        // Smart image assignment
        const vehicleNameLower = vehicleData.name.toLowerCase();
        let mainImagePath = null;

        if (vehicleNameLower.includes('ambulance')) {
          mainImagePath = defaultImages.ambulance;
        } else if (vehicleNameLower.includes('tdp')) {
          mainImagePath = defaultImages.tdp;
        } else if (vehicleNameLower.includes('bike') || vehicleNameLower.includes('rrb')) {
          mainImagePath = defaultImages.bike;
        } else if (vehicleNameLower.includes('mortuary')) {
          mainImagePath = defaultImages.mortuary;
        }

        if (mainImagePath) {
          vehicleData.images = { main: mainImagePath };
        }

        // DUPLICATE HANDLING: Keep the record with highest priority status
        if (processedVehicles.has(callsign)) {
          const existingVehicle = processedVehicles.get(callsign);
          const currentPriority = statusPriority[vehicleData.status] || 0;
          const existingPriority = statusPriority[existingVehicle.status] || 0;

          if (currentPriority > existingPriority) {
            console.log(`🔄 Updating duplicate ${callsign} from "${existingVehicle.status}" to "${vehicleData.status}" (higher priority)`);
            processedVehicles.set(callsign, vehicleData);
          } else {
            console.log(`⏩ Keeping existing ${callsign} with status "${existingVehicle.status}" (higher/equal priority)`);
          }
        } else {
          processedVehicles.set(callsign, vehicleData);
          successCount++;
          console.log(`✓ Processed: ${callsign} - ${vehicleData.name} - ${vehicleData.status} - ${station}`);
        }

      } catch (rowError) {
        errors.push(`Row ${index + 2}: ${rowError.message}`);
        errorCount++;
        console.error(`✗ Error at row ${index + 2}:`, rowError);
      }
    }

    const finalVehicles = Array.from(processedVehicles.values());
    console.log(`Successfully processed ${finalVehicles.length} unique vehicles for insertion`);

    if (finalVehicles.length === 0) {
      return res.status(400).json({
        message: 'No valid vehicle records could be processed.',
        details: errors
      });
    }

    // Insert vehicles with duplicate handling
    let insertedCount = 0;
    let updatedCount = 0;
    const insertionErrors = [];

    for (const vehicle of finalVehicles) {
      try {
        // Use upsert to handle duplicates - update if exists, insert if not
        const result = await Vehicle.findOneAndUpdate(
          { callsign: vehicle.callsign },
          vehicle,
          {
            upsert: true,
            new: true,
            runValidators: true
          }
        );

        if (result.$isNew) {
          insertedCount++;
          console.log(`✅ Inserted: ${vehicle.callsign}`);
        } else {
          updatedCount++;
          console.log(`🔄 Updated: ${vehicle.callsign}`);
        }
      } catch (insertError) {
        insertionErrors.push(`Failed to insert ${vehicle.callsign}: ${insertError.message}`);
        console.error(`✗ Insertion error for ${vehicle.callsign}:`, insertError);
      }
    }

    console.log(`Successfully inserted ${insertedCount} new vehicles and updated ${updatedCount} existing vehicles`);

    res.status(201).json({
      message: `Bulk upload completed successfully.`,
      summary: {
        totalProcessed: successCount,
        newInserted: insertedCount,
        existingUpdated: updatedCount,
        errors: errorCount
      },
      details: `Processed ${finalVehicles.length} unique vehicles from Excel. ${insertedCount} new vehicles inserted, ${updatedCount} existing vehicles updated.`
    });

  } catch (error) {
    console.error("Error during vehicle bulk upload:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate callsigns found during upload.',
        details: error.message
      });
    }

    res.status(500).json({
      message: 'An error occurred during the bulk upload.',
      error: error.message
    });
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