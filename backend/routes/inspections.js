import express from 'express';
import Inspection from '../models/Inspection.js';
import Vehicle from '../models/Vehicle.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all inspections
router.get('/', authenticate, async (req, res) => {
  try {
    const inspections = await Inspection.find().populate('vehicle', 'callsign').sort({ date: -1 });
    res.json(inspections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new inspection result
router.post('/', authenticate, async (req, res) => {
  try {
    const inspection = new Inspection(req.body);
    await inspection.save();
    if (req.body.currentMeterReading) {
        await Vehicle.findByIdAndUpdate(inspection.vehicle, { mileage: req.body.currentMeterReading });
    }
    await inspection.populate('vehicle', 'callsign');
    res.status(201).json(inspection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Schedule a new inspection
router.post('/schedule', authenticate, async (req, res) => {
  try {
    // --- UPDATED: 'inspector' is now 'technician' ---
    const { vehicle, scheduledDate, technician, type } = req.body;
    const inspection = new Inspection({
      vehicle,
      date: scheduledDate,
      status: 'Scheduled',
      technician,
      type
    });
    await inspection.save();
    await inspection.populate('vehicle', 'callsign');
    res.status(201).json(inspection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an inspection
router.put('/:id', authenticate, async (req, res) => {
  try {
    const inspection = await Inspection.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('vehicle', 'callsign');
    if (!inspection) {
        return res.status(404).json({ message: 'Inspection not found' });
    }
    if (req.body.currentMeterReading) {
        await Vehicle.findByIdAndUpdate(inspection.vehicle._id, { mileage: req.body.currentMeterReading });
    }
    res.json(inspection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an inspection
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const inspection = await Inspection.findByIdAndDelete(req.params.id);
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }
    res.json({ message: 'Inspection deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;