import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Vehicle from '../models/Vehicle.js';
import Inspection from '../models/Inspection.js';
import FuelRecord from '../models/FuelRecord.js';
import Maintenance from '../models/Maintenance.js';
import fs from 'fs';
import path from 'path';
// --- FIX START: Import 'fileURLToPath' to get the correct directory path ---
import { fileURLToPath } from 'url';

const router = express.Router();

// --- FIX START: Define __dirname for ES Modules to create a stable path ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- FIX END ---


// --- GET DOCUMENT LIST ---
router.get('/available-documents', authenticate, (req, res) => {
  try {
    // --- FIX START: Construct the correct path from the backend to the frontend's public folder ---
    // This goes up two directories (from /backend/routes to /) and then into /frontend/public/documents
    const documentsPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'documents');
    // --- FIX END ---

    // Add a check to ensure the directory actually exists before trying to read it
    if (!fs.existsSync(documentsPath)) {
      console.error(`Error: The directory does not exist at path: ${documentsPath}`);
      return res.status(404).json({ message: 'Documents directory not found on the server.' });
    }

    const files = fs.readdirSync(documentsPath);

    const documentFiles = files.filter(file =>
      file.endsWith('.docx') || file.endsWith('.xlsx')
    );

    res.json(documentFiles);
  } catch (error) {
    console.error('Error reading documents directory:', error);
    res.status(500).json({ message: 'Could not retrieve the list of documents.' });
  }
});


// Generate a data report
router.post('/generate/:type', authenticate, async (req, res) => {
  try {
    const reportType = req.params.type;
    const { month } = req.body;
    let data = {};
    let name = '';

    const startDate = new Date(month);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

    switch (reportType) {
      case 'fleet-performance':
        name = 'Fleet Performance Report';
        const vehicles = await Vehicle.find();
        const inspectionsThisMonth = await Inspection.find({ date: { $gte: startDate, $lt: endDate } });

        const onRoadCount = vehicles.filter(v => v.status === 'OnRoad Fleet').length;
        const maintenanceCount = vehicles.filter(v => v.status === 'Mechanical Maintenance').length;
        const insuranceClaimCount = vehicles.filter(v => v.status === 'Insurance Claim').length;

        const offRoadCount = maintenanceCount + insuranceClaimCount;

        data = {
          'Total Vehicles': vehicles.length,
          'On-Road Fleet': onRoadCount,
          'Off-Road Fleet': offRoadCount,
          'Vehicles in Maintenance': maintenanceCount,
          'Vehicles on Insurance Claim': insuranceClaimCount,
          'Total Inspections This Month': inspectionsThisMonth.length,
          'Passed Inspections This Month': inspectionsThisMonth.filter(i => i.status === 'Passed').length,
          'Failed Inspections This Month': inspectionsThisMonth.filter(i => i.status === 'Failed').length,
        };
        break;

      case 'fuel-efficiency':
        name = 'Fuel Efficiency Analysis';
        const fuelData = await FuelRecord.find({ date: { $gte: startDate, $lt: endDate } });
        const totalCost = fuelData.reduce((sum, record) => sum + (record.amount_rs || 0), 0);
        const totalVolume = fuelData.reduce((sum, record) => sum + (record.current_refueling_liters || 0), 0);
        const totalKm = fuelData.reduce((sum, record) => sum + (record.total_km || 0), 0);
        const avgEfficiency = totalVolume > 0 ? (totalKm / totalVolume) : 0;
        data = {
          'Total Fuel Records This Month': fuelData.length,
          'Total Fuel Cost This Month': `Rs. ${totalCost.toFixed(2)}`,
          'Total Fuel Volume This Month (L)': totalVolume.toFixed(2),
          'Average Efficiency This Month (km/L)': avgEfficiency.toFixed(2),
        };
        break;

      case 'maintenance-costs':
        name = 'Maintenance Cost Summary';
        const maintenanceData = await Maintenance.find({ date: { $gte: startDate, $lt: endDate } })
          .populate('vehicle', 'name');

        const allVehiclesForCount = await Vehicle.find();
        const vehicleCounts = allVehiclesForCount.reduce((acc, vehicle) => {
          acc[vehicle.name] = (acc[vehicle.name] || 0) + 1;
          return acc;
        }, {});

        const reportData = {};

        for (const vehicleName in vehicleCounts) {
          reportData[vehicleName] = {
            preventiveCost: 0,
            correctiveCost: 0,
            totalCost: 0,
            vehicleCount: vehicleCounts[vehicleName],
            avgCostPerVehicle: 0,
          };
        }

        maintenanceData.forEach(record => {
          if (!record.vehicle) return;

          const vehicleName = record.vehicle.name;
          const cost = (record.partsCost || 0) + (record.otherCost || 0);

          if (reportData[vehicleName]) {
            if (record.category === 'Preventive') {
              reportData[vehicleName].preventiveCost += cost;
            } else if (record.category === 'Corrective') {
              reportData[vehicleName].correctiveCost += cost;
            }
          }
        });

        for (const vehicleName in reportData) {
          const stats = reportData[vehicleName];
          stats.totalCost = stats.preventiveCost + stats.correctiveCost;
          if (stats.vehicleCount > 0) {
            stats.avgCostPerVehicle = stats.totalCost / stats.vehicleCount;
          }
        }

        data = reportData;
        break;

      case 'vehicle-health':
        name = 'Vehicle Health Overview';
        const allHealthVehicles = await Vehicle.find();
        const healthData = {};
        for (const vehicle of allHealthVehicles) {
          const lastInspection = await Inspection.findOne({ vehicle: vehicle._id }).sort({ date: -1 });
          healthData[`Vehicle: ${vehicle.callsign} (${vehicle.name})`] = `Last Inspection: ${lastInspection ? lastInspection.status : 'None'}`;
        }
        data = healthData;
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    const report = {
      name: name,
      type: reportType,
      createdAt: new Date(),
      data: data,
    };
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

export default router;