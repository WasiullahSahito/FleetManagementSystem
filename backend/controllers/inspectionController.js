const Inspection = require('../models/Inspection');
const Vehicle = require('../models/Vehicle');

// Create inspection
exports.createInspection = async (req, res) => {
  try {
    const { vehicle, inspector, notes, checklist } = req.body;
    
    const images = req.files.map(file => 
      `/uploads/${file.filename}`
    );

    const inspection = new Inspection({
      vehicle,
      inspector,
      notes,
      images,
      checklist: JSON.parse(checklist)
    });

    await inspection.save();
    
    // Update vehicle status if needed
    const issues = inspection.checklist.filter(item => !item.status);
    if(issues.length > 0) {
      await Vehicle.findByIdAndUpdate(vehicle, { status: 'maintenance' });
    }

    res.status(201).json(inspection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get inspections for a vehicle
exports.getVehicleInspections = async (req, res) => {
  try {
    const inspections = await Inspection.find({ vehicle: req.params.vehicleId })
      .sort({ date: -1 });
      
    res.json(inspections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate inspection report
exports.generateReport = async (req, res) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('vehicle');
      
    if (!inspection) return res.status(404).json({ message: 'Inspection not found' });
    
    // Simplified report generation
    const report = {
      vehicle: inspection.vehicle,
      date: inspection.date,
      inspector: inspection.inspector,
      passedItems: inspection.checklist.filter(item => item.status).length,
      failedItems: inspection.checklist.filter(item => !item.status).length,
      images: inspection.images,
      checklist: inspection.checklist,
      notes: inspection.notes
    };
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};