// backend/models/Accident.js
import mongoose from 'mongoose';

const accidentSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  accidentDate: { type: Date, required: true },
  accidentTime: { type: String },
  location: { type: String },
  details: { type: String },
  driverName: { type: String },
  driverEmpId: { type: String },
  duringEmergency: { type: Boolean, default: false },
  // Add any other fields from SIEHS-FT-F-13 and SIEHS-FT-F-15
}, { timestamps: true });

export default mongoose.model('Accident', accidentSchema);