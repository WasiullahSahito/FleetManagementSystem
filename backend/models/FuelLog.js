const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema({
  vehicle: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle', 
    required: true 
  },
  date: { type: Date, default: Date.now },
  fuelAmount: { type: Number, required: true },
  costPerLiter: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  odometerReading: { type: Number, required: true },
  vendor: String,
  receipt: String,
  notes: String
});

module.exports = mongoose.model('FuelLog', fuelLogSchema);