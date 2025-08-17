import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Inspection from '../models/Inspection.js';
import FuelRecord from '../models/FuelRecord.js';
import Maintenance from '../models/Maintenance.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Middleware configuration for handling file uploads for main image and damage points
const imageUploadFields = [
    { name: 'main', maxCount: 1 },
    { name: 'damageImages' } // This will accept an array of files for new damage points
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

// GET a single vehicle by ID with its inspections
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

    // Process structured damage points data
    if (req.body.damagePoints) {
        const points = JSON.parse(req.body.damagePoints);
        const damageImages = req.files.damageImages || [];
        
        // On create, every damage point must have a corresponding image
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
    
    // Robustly handle a mix of existing and new damage points
    if (req.body.damagePoints) {
        const pointsFromClient = JSON.parse(req.body.damagePoints);
        const newUploadedImages = req.files.damageImages || [];
        let newImageIndex = 0;
        
        const updatedDamagePoints = pointsFromClient.map(point => {
            // If the point already has an imagePath, it's an existing point to keep.
            if (point.imagePath) {
                return point;
            } 
            // If it's a new point (no imagePath), assign it the next available uploaded file.
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