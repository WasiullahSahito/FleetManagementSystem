const mongoose = require('mongoose');

const mileageSchema = new mongoose.Schema({
  vehicle: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle', 
    required: true 
  },
  date: { type: Date, default: Date.now },
  odometerReading: { type: Number, required: true },
  driver: String,
  notes: String,
  image: String
});

module.exports = mongoose.model('Mileage', mileageSchema);