import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  category: { type: String, enum: ['Preventive', 'Corrective'], required: true },
  type: { type: String, required: true },
  date: { type: Date, required: true },
  
  // UPDATED COST FIELDS (replaces partsCost)
  electricalCost: { type: Number, default: 0 },
  fabricationCost: { type: Number, default: 0 },
  insuranceCost: { type: Number, default: 0 },
  otherCost: { type: Number, default: 0 },
  
  status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed'], default: 'Scheduled' },
  description: { type: String },
  technician: { type: String },
  partsUsed: { type: String }
}, { timestamps: true });

// Remove the old partsCost field if it exists
maintenanceSchema.pre('save', function(next) {
  if (this.partsCost) {
    this.partsCost = undefined;
  }
  next();
});

export default mongoose.model('Maintenance', maintenanceSchema);