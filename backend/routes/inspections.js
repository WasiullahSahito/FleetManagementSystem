import express from 'express';
import Inspection from '../models/Inspection.js';
import Vehicle from '../models/Vehicle.js';
import { authenticate } from '../middleware/auth.js';
import { excelUpload } from '../middleware/excelUpload.js';
import xlsx from 'xlsx';

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

// BULK UPLOAD FOR INSPECTIONS
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
    const newInspections = data.map(row => {
      const vehicleId = vehicleMap.get(row.vehicleCallsign);
      if (!vehicleId || !row.date || !row.technician || !row.status) {
        skippedCount++;
        return null;
      }
      return {
        vehicle: vehicleId,
        date: new Date(row.date),
        technician: String(row.technician),
        status: String(row.status),
        location: row.location ? String(row.location) : undefined,
        currentMeterReading: row.currentMeterReading ? Number(row.currentMeterReading) : undefined,
        notes: row.notes ? String(row.notes) : undefined,
        overallRating: row.overallRating ? Number(row.overallRating) : undefined,
      };
    }).filter(Boolean);

    if (newInspections.length === 0) {
      return res.status(400).json({ message: 'No valid records found. Check vehicle callsigns and required fields.' });
    }

    const result = await Inspection.insertMany(newInspections);
    res.status(201).json({
      message: `Bulk upload successful. ${result.length} records added, ${skippedCount} skipped.`,
      createdCount: result.length,
      skippedCount
    });
  } catch (error) {
    console.error("Inspection bulk upload error:", error);
    res.status(500).json({ message: 'An error occurred during bulk upload.', error: error.message });
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