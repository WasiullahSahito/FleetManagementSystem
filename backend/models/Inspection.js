// models/Inspection.js
import mongoose from 'mongoose';

const inspectionChecklistSchema = new mongoose.Schema({
    category: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 }
}, { _id: false });

const inspectionSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Passed', 'Failed', 'Scheduled'], default: 'Pending' },
  technician: { type: String, required: true },
  notes: { type: String },
  type: { type: String, enum: ['Preventive Maintenance', 'Corrective Maintenance', 'other'], default: 'Preventive Maintenance' },
  overallRating: { type: Number, min: 0, max: 10 },
  checklist: [inspectionChecklistSchema],
  location: { type: String },
  currentMeterReading: { type: Number }
}, { timestamps: true });

export default mongoose.model('Inspection', inspectionSchema);