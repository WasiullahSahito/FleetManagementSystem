import express from 'express';
import Maintenance from '../models/Maintenance.js';
import Vehicle from '../models/Vehicle.js';
import { authenticate } from '../middleware/auth.js';
import { excelUpload } from '../middleware/excelUpload.js';
import xlsx from 'xlsx';

const router = express.Router();

// Helper function to update vehicle service milestones
const updateVehicleMilestones = async (maintenanceRecord) => {
  const vehicle = await Vehicle.findById(maintenanceRecord.vehicle);
  if (!vehicle) return;
  const maintenanceType = maintenanceRecord.type.toLowerCase();
  const update = {};
  if (maintenanceType.includes('tire') || maintenanceType.includes('tyre')) {
    update.lastTireChangeActivity = vehicle.mileage;
  } else {
    update.lastService = vehicle.mileage;
  }
  await Vehicle.findByIdAndUpdate(vehicle._id, update);
};

// GET all maintenance records
router.get('/', authenticate, async (req, res) => {
  try {
    const maintenanceRecords = await Maintenance.find({ category: { $exists: true } })
      .populate('vehicle', 'callsign')
      .sort({ dateIn: -1 });
    res.json(maintenanceRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// BULK UPLOAD FOR MAINTENANCE RECORDS
router.post('/bulk-upload', authenticate, excelUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { cellDates: true });

    const callsigns = [...new Set(data.map(row => row.vehicleCallsign).filter(Boolean))];
    const vehicles = await Vehicle.find({ callsign: { $in: callsigns } });
    const vehicleMap = new Map(vehicles.map(v => [v.callsign, v._id]));

    let skippedCount = 0;
    const newMaintenanceRecords = data.map(row => {
      const vehicleId = vehicleMap.get(row.vehicleCallsign);
      if (!vehicleId || !row.category || !row.type || !row.dateIn) {
        skippedCount++;
        return null;
      }
      return {
        vehicle: vehicleId,
        category: row.category,
        type: row.type,
        dateIn: new Date(row.dateIn),
        status: row.status || 'Scheduled',
        technician: row.technician,
        description: row.description,
        otherCost: row.otherCost ? Number(row.otherCost) : 0,
        electricalCost: row.electricalCost ? Number(row.electricalCost) : 0,
        fabricationCost: row.fabricationCost ? Number(row.fabricationCost) : 0,
      };
    }).filter(Boolean);

    if (newMaintenanceRecords.length === 0) {
      return res.status(400).json({ message: 'No valid records found. Check vehicle callsigns and required fields.' });
    }

    const result = await Maintenance.insertMany(newMaintenanceRecords);
    res.status(201).json({
      message: `Bulk upload successful. ${result.length} records added, ${skippedCount} skipped.`,
      createdCount: result.length,
      skippedCount
    });
  } catch (error) {
    console.error("Maintenance bulk upload error:", error);
    res.status(500).json({ message: 'An error occurred during bulk upload.', error: error.message });
  }
});

// POST (Create) a new maintenance record
router.post('/', authenticate, async (req, res) => {
  try {
    const maintenance = new Maintenance(req.body);
    await maintenance.save();
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