import mongoose from 'mongoose';

const fuelRecordSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  date: { type: Date, required: true },
  
  amb_no: { type: String }, 
  slip_no: { type: String },
  current_refueling_km: { type: Number }, // Odometer reading at refueling
  total_km: { type: Number }, // Total KM (difference)
  // --- UPDATED: Renamed for clarity ---
  tracker_verified_km: { type: Number }, // Tracker Verified KM
  // --- UPDATED: Renamed for clarity ---
  current_refueling_liters: { type: Number }, // Current Refueling Liters (amount of fuel)
  rate: { type: Number },
  amount_rs: { type: Number },
  refueling_time: { type: String },
  evo_emp_code: { type: String },
  evo_name: { type: String },
  sc_name: { type: String },
  sc_name2: { type: String },

}, { timestamps: true });

export default mongoose.model('FuelRecord', fuelRecordSchema);