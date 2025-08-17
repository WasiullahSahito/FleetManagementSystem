const Vehicle = require('../models/Vehicle');
const Inspection = require('../models/Inspection');
const FuelLog = require('../models/FuelLog');
const Maintenance = require('../models/Maintenance');

// Create new vehicle
exports.createVehicle = async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all vehicles
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single vehicle with details
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    const inspections = await Inspection.find({ vehicle: req.params.id });
    const fuelLogs = await FuelLog.find({ vehicle: req.params.id }).sort({ date: -1 });
    const maintenance = await Maintenance.find({ vehicle: req.params.id }).sort({ date: -1 });
    
    res.json({
      ...vehicle.toObject(),
      inspections,
      fuelLogs,
      maintenance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    // Delete associated records
    await Inspection.deleteMany({ vehicle: req.params.id });
    await FuelLog.deleteMany({ vehicle: req.params.id });
    await Maintenance.deleteMany({ vehicle: req.params.id });
    
    res.json({ message: 'Vehicle deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};