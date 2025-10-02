import express from 'express';
import Maintenance from '../models/Maintenance.js';
import Vehicle from '../models/Vehicle.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to update vehicle service milestones
const updateVehicleMilestones = async (maintenanceRecord) => {
  const vehicle = await Vehicle.findById(maintenanceRecord.vehicle);
  if (!vehicle) return;

  const maintenanceType = maintenanceRecord.type.toLowerCase();
  const update = {};

  // Check for tire-related keywords to update the specific tire milestone
  if (maintenanceType.includes('tire') || maintenanceType.includes('tyre')) {
    update.lastTireChangeActivity = vehicle.mileage;
  } else {
    // Assume any other completed job is a general preventive maintenance (PM)
    update.lastService = vehicle.mileage;
  }

  await Vehicle.findByIdAndUpdate(vehicle._id, update);
};

// GET all maintenance records
router.get('/', authenticate, async (req, res) => {
  try {
    // --- FIX: Filter for records that have a 'category' field ---
    // This ensures only new, correctly formatted records are sent to the frontend.
    const maintenanceRecords = await Maintenance.find({ category: { $exists: true } })
      .populate('vehicle', 'callsign')
      .sort({ dateIn: -1 });
    res.json(maintenanceRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST (Create) a new maintenance record
router.post('/', authenticate, async (req, res) => {
  try {
    const maintenance = new Maintenance(req.body);
    await maintenance.save();

    // If the job is marked as 'Completed', update the vehicle's milestones
    if (maintenance.status === 'Completed') {
      await updateVehicleMilestones(maintenance);
    }

    await maintenance.populate('vehicle', 'callsign');
    res.status(201).json(maintenance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT (Update) a maintenance record by ID
router.put('/:id', authenticate, async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('vehicle', 'callsign');
    if (!maintenance) return res.status(404).json({ message: 'Maintenance record not found' });

    // If the job is marked as 'Completed', update the vehicle's milestones
    if (maintenance.status === 'Completed') {
      await updateVehicleMilestones(maintenance);
    }

    res.json(maintenance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a maintenance record by ID
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndDelete(req.params.id);
    if (!maintenance) return res.status(404).json({ message: 'Maintenance record not found' });
    res.json({ message: 'Maintenance record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;