import express from 'express';
import FuelRecord from '../models/FuelRecord.js';
import Vehicle from '../models/Vehicle.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET all fuel records (sorted oldest first)
router.get('/', authenticate, async (req, res) => {
  try {
    const fuelRecords = await FuelRecord.find().populate('vehicle', 'callsign name').sort({ createdAt: 1 });
    res.json(fuelRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST (Create) a new fuel record
router.post('/', authenticate, async (req, res) => {
  try {
    const fuelRecord = new FuelRecord(req.body);
    await fuelRecord.save();
    
    // Automatically update the vehicle's mileage based on this fuel entry
    if (req.body.current_refueling_km && req.body.vehicle) {
        const newMileage = parseFloat(req.body.current_refueling_km);
        if (!isNaN(newMileage)) {
            await Vehicle.findByIdAndUpdate(req.body.vehicle, { mileage: newMileage });
        }
    }

    await fuelRecord.populate('vehicle', 'callsign name');
    res.status(201).json(fuelRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT (Update) a fuel record by ID
router.put('/:id', authenticate, async (req, res) => {
    try {
        const fuelRecord = await FuelRecord.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('vehicle', 'callsign name');
        if (!fuelRecord) return res.status(404).json({ message: 'Fuel record not found' });
        
        // Also update the vehicle's mileage when a fuel record is edited
        if (req.body.current_refueling_km && req.body.vehicle) {
            const newMileage = parseFloat(req.body.current_refueling_km);
            if (!isNaN(newMileage)) {
                await Vehicle.findByIdAndUpdate(req.body.vehicle, { mileage: newMileage });
            }
        }
        
        res.json(fuelRecord);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE a fuel record by ID
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const fuelRecord = await FuelRecord.findByIdAndDelete(req.params.id);
        if (!fuelRecord) return res.status(404).json({ message: 'Fuel record not found' });
        res.json({ message: 'Fuel record deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;