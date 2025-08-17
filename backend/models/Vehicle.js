import mongoose from 'mongoose';
const stationList = [
  'Thatta', 'Sujawal', 'Bathoro', 'Sakro', 'Badin',
  'Tando Muhammad Khan', 'Mirpurkhas', 'Umerkot', 'Mithi', 'Tharparkar', 'Nagarparkar',
  'Hyderabad', 'Tando Adam', 'Matiari',
  'Qazi Ahmed', 'Shaheed Benazirabad', 'Naushahro Feroze', 'Sehwan', 'Ranipur',
  'Dadu', 'Sukkur', 'Khairpur', 'Hingorja', 'Shikarpur',
  'Jacobabad', 'Kashmore', 'Kandhkot', 'Ghotki', 'Larkana',
  'Qambar', 'Shahdadkot'
];

const statusList = ['OnRoad Fleet', 'OffRoad Fleet', 'Mechanical Maintenance', 'Insurance Claim'];
const ownerList = ['PDMA', 'China Aid', 'SIEHS', 'TDP', 'Sindh Government'];
const damagePointSchema = new mongoose.Schema({
    type: { type: String, enum: ['D', 'S', 'B', 'OK'], required: true }, // Dent, Scratch, Broken, OK
    location: { type: String, required: true }, // e.g., "Front Bumper", "Roof Left"
    notes: { type: String },
    imagePath: { type: String, required: true }
}, { _id: false });
const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  callsign: { type: String, required: true, unique: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  mileage: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: {
        values: statusList,
        message: '"{VALUE}" is not a supported status.'
    }, 
    default: 'OnRoad Fleet' 
  },
  images: {
    main: { type: String },
    damage: [{ type: String }] 
  },
  nextService: { type: Number },
  lastService: { type: Number, default: 0 },
  lastTireChangeActivity: { type: Number, default: 0 },
  chassisNo: { type: String },
  engineNo: { type: String },
  registrationNo: { type: String },
  fuelType: { type: String, default: 'Petrol' },
  transmission: {type: String, default: 'Manual' },
  engineCapacity: { type: String },
  registeredCity: {
    type: String,
    enum: {
        values: stationList,
        message: '"{VALUE}" is not a supported station.'
    }
  },
  ownerName: { 
    type: String,
    enum: {
        values: ownerList,
        message: '"{VALUE}" is not a supported owner.'
    }
  },
  // --- UPDATED: Added the damagePoints array to the schema ---
  damagePoints: [damagePointSchema],
}, { timestamps: true });

export default mongoose.model('Vehicle', vehicleSchema);
