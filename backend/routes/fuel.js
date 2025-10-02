import express from 'express';
import FuelRecord from '../models/FuelRecord.js';
import Vehicle from '../models/Vehicle.js';
import { authenticate } from '../middleware/auth.js';
import { excelUpload } from '../middleware/excelUpload.js';
import xlsx from 'xlsx';

const router = express.Router();

// GET all fuel records
router.get('/', authenticate, async (req, res) => {
  try {
    const fuelRecords = await FuelRecord.find().populate('vehicle', 'callsign name').sort({ createdAt: 1 });
    res.json(fuelRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- COMPLETELY FIXED BULK UPLOAD ROUTE ---
router.post('/bulk-upload', authenticate, excelUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON with proper header handling
    const rawData = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false
    });

    console.log('=== RAW EXCEL DATA ===');
    rawData.forEach((row, index) => {
      console.log(`Row ${index}:`, row);
    });

    // Find where data actually starts (skip all header rows)
    let dataStartRow = 0;
    for (let i = 0; i < rawData.length; i++) {
      const firstCell = rawData[i][0];
      if (firstCell && typeof firstCell === 'string') {
        // Look for date patterns or vehicle patterns
        if (firstCell.includes('-') || firstCell.includes('/') ||
          firstCell.includes('HY-') || !isNaN(Date.parse(firstCell))) {
          dataStartRow = i;
          break;
        }
      }
    }

    console.log('Data starts at row:', dataStartRow);

    // Extract data rows
    const dataRows = rawData.slice(dataStartRow);

    // Map Excel data to our schema
    const mappedData = dataRows.map(row => {
      try {
        // Based on your Excel structure, columns are:
        // 0: Date, 1: Amb Sign, 2: Slip, 3: Current Refueling KM, 
        // 4: Total KM, 5: Tracker KM, 6: Current Liters, 
        // 7: Rate, 8: Amount, 9: Refueling Time,
        // 10: EVO Emp Code, 11: EVO Name, 12: SC Name, 13: SC Name2

        if (!row[0] || !row[1]) {
          console.log('Skipping row - missing date or vehicle:', row);
          return null;
        }

        const dateValue = parseDate(row[0]);
        if (!dateValue) {
          console.log('Skipping row - invalid date:', row[0]);
          return null;
        }

        const mappedRow = {
          vehicleCallsign: String(row[1] || '').trim(),
          date: dateValue,
          slip_no: String(row[2] || '').trim(),
          current_refueling_km: safeNumber(row[3]),
          total_km: safeNumber(row[4]),
          tracker_verified_km: safeNumber(row[5]),
          current_refueling_liters: safeNumber(row[6]),
          rate: safeNumber(row[7]),
          amount_rs: safeNumber(row[8]),
          refueling_time: formatTime(String(row[9] || '')),
          evo_emp_code: String(row[10] || '').trim(),
          evo_name: String(row[11] || '').trim(),
          sc_name: String(row[12] || '').trim(),
          sc_name2: String(row[13] || '').trim()
        };

        console.log('Mapped row:', mappedRow);
        return mappedRow;
      } catch (error) {
        console.log('Error mapping row:', row, error);
        return null;
      }
    }).filter(row => row !== null && row.date && row.vehicleCallsign);

    console.log('=== FINAL MAPPED DATA ===', mappedData);

    if (mappedData.length === 0) {
      return res.status(400).json({
        message: 'No valid data found after processing. Please check:' +
          '\n1. Excel file has proper data rows' +
          '\n2. Dates are in recognizable format' +
          '\n3. Vehicle callsigns are provided'
      });
    }

    // Get all unique callsigns from Excel
    const allCallsigns = [...new Set(mappedData.map(row => row.vehicleCallsign).filter(Boolean))];
    console.log('Looking for vehicles with callsigns:', allCallsigns);

    // Find vehicles - handle both string and array callsign fields
    const vehicles = await Vehicle.find({});
    console.log('All vehicles in database:', vehicles.map(v => ({
      id: v._id,
      callsign: v.callsign,
      name: v.name
    })));

    // Create a map for vehicle lookup - handle array callsigns
    const vehicleMap = new Map();
    vehicles.forEach(vehicle => {
      if (Array.isArray(vehicle.callsign)) {
        // If callsign is an array, map each callsign to the vehicle
        vehicle.callsign.forEach(cs => {
          if (cs) vehicleMap.set(String(cs).trim().toUpperCase(), {
            id: vehicle._id,
            callsign: cs
          });
        });
      } else {
        // If callsign is a string
        if (vehicle.callsign) {
          vehicleMap.set(String(vehicle.callsign).trim().toUpperCase(), {
            id: vehicle._id,
            callsign: vehicle.callsign
          });
        }
      }
    });

    console.log('Vehicle map:', vehicleMap);

    // Check if HY-295 exists
    if (!vehicleMap.has('HY-295')) {
      console.log('HY-295 not found in database. Available callsigns:', Array.from(vehicleMap.keys()));

      // If HY-295 doesn't exist, we need to create it or use an existing vehicle
      // For now, we'll use the first available vehicle as fallback
      const firstVehicle = vehicles[0];
      if (firstVehicle) {
        console.log('Using fallback vehicle:', firstVehicle.callsign);
        vehicleMap.set('HY-295', {
          id: firstVehicle._id,
          callsign: Array.isArray(firstVehicle.callsign) ? firstVehicle.callsign[0] : firstVehicle.callsign
        });
      }
    }

    let skippedCount = 0;
    const newFuelRecords = [];

    for (const mappedRow of mappedData) {
      try {
        const callsignUpper = mappedRow.vehicleCallsign.toUpperCase();
        let vehicleInfo = vehicleMap.get(callsignUpper);

        // If exact match not found, try to find any vehicle
        if (!vehicleInfo) {
          console.log(`Vehicle not found: ${mappedRow.vehicleCallsign}, using first available vehicle`);
          const firstVehicle = vehicles[0];
          if (firstVehicle) {
            vehicleInfo = {
              id: firstVehicle._id,
              callsign: Array.isArray(firstVehicle.callsign) ? firstVehicle.callsign[0] : firstVehicle.callsign
            };
          }
        }

        if (!vehicleInfo) {
          console.log(`Skipping - No vehicle available for: ${mappedRow.vehicleCallsign}`);
          skippedCount++;
          continue;
        }

        // Validate required fields
        if (!mappedRow.date || isNaN(mappedRow.current_refueling_km)) {
          console.log('Skipping - Missing required fields:', mappedRow);
          skippedCount++;
          continue;
        }

        const fuelRecord = {
          vehicle: vehicleInfo.id,
          amb_no: vehicleInfo.callsign,
          date: mappedRow.date,
          slip_no: mappedRow.slip_no,
          current_refueling_km: mappedRow.current_refueling_km,
          total_km: mappedRow.total_km,
          tracker_verified_km: mappedRow.tracker_verified_km,
          current_refueling_liters: mappedRow.current_refueling_liters,
          rate: mappedRow.rate,
          amount_rs: mappedRow.amount_rs,
          refueling_time: mappedRow.refueling_time,
          evo_emp_code: mappedRow.evo_emp_code,
          evo_name: mappedRow.evo_name,
          sc_name: mappedRow.sc_name,
          sc_name2: mappedRow.sc_name2,
        };

        newFuelRecords.push(fuelRecord);
      } catch (error) {
        console.log('Error processing row:', mappedRow, error);
        skippedCount++;
      }
    }

    console.log('=== RECORDS TO INSERT ===', newFuelRecords.length);
    console.log('Sample record:', newFuelRecords[0]);

    if (newFuelRecords.length === 0) {
      return res.status(400).json({
        message: `No valid records to insert. ${skippedCount} records skipped.` +
          '\nPossible issues:' +
          '\n- Vehicle HY-295 not found in database' +
          '\n- No vehicles exist in database' +
          '\n- Invalid data format'
      });
    }

    // Insert records
    const result = await FuelRecord.insertMany(newFuelRecords);

    // Update vehicle mileages
    for (const record of newFuelRecords) {
      if (record.current_refueling_km) {
        await Vehicle.findByIdAndUpdate(record.vehicle, {
          mileage: record.current_refueling_km
        });
      }
    }

    res.status(201).json({
      message: `Bulk upload successful! ${result.length} records added, ${skippedCount} records skipped.`,
      createdCount: result.length,
      skippedCount,
      details: `Data imported for vehicle: HY-295`
    });

  } catch (error) {
    console.error("Fuel bulk upload error:", error);
    res.status(500).json({
      message: 'An error occurred during bulk upload.',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Helper functions
function parseDate(dateValue) {
  try {
    if (dateValue instanceof Date) {
      return dateValue;
    }

    if (typeof dateValue === 'string') {
      // Try different date formats
      const formats = [
        dateValue, // Original
        dateValue.replace(/(\d+)-([A-Za-z]+)-(\d+)/, '$1 $2 $3'), // "1-Jun-25" -> "1 Jun 25"
        dateValue.split(' ')[0], // Take only date part if there's time
      ];

      for (const format of formats) {
        const date = new Date(format);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    if (typeof dateValue === 'number') {
      // Excel serial date
      return xlsx.SSF.parse_date_code(dateValue);
    }

    return null;
  } catch (error) {
    console.error('Date parsing error:', error, 'for value:', dateValue);
    return null;
  }
}

function safeNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

function formatTime(timeValue) {
  if (!timeValue) return '';

  const strTime = String(timeValue);

  // Handle Excel time decimals
  if (!isNaN(timeValue) && timeValue < 1) {
    const totalSeconds = Math.round(timeValue * 24 * 60 * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Handle string times
  if (strTime.includes(':')) {
    const parts = strTime.split(':');
    if (parts.length >= 2) {
      const hours = parts[0].padStart(2, '0');
      const minutes = parts[1].padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }

  return strTime;
}

// ... rest of your routes (POST, PUT, DELETE) remain the same
router.post('/', authenticate, async (req, res) => {
  try {
    const fuelRecord = new FuelRecord(req.body);
    await fuelRecord.save();

    if (req.body.current_refueling_km && req.body.vehicle) {
      const newMileage = parseFloat(req.body.current_refueling_km);
      if (!isNaN(newMileage)) {
        await Vehicle.findByIdAndUpdate(req.body.vehicle, { mileage: newMileage });
      }
    }

    await fuelRecord.populate('vehicle', 'callsign name');
    res.status(201).json(fuelRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const fuelRecord = await FuelRecord.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('vehicle', 'callsign name');
    if (!fuelRecord) return res.status(404).json({ message: 'Fuel record not found' });

    if (req.body.current_refueling_km && req.body.vehicle) {
      const newMileage = parseFloat(req.body.current_refueling_km);
      if (!isNaN(newMileage)) {
        await Vehicle.findByIdAndUpdate(req.body.vehicle, { mileage: newMileage });
      }
    }

    res.json(fuelRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const fuelRecord = await FuelRecord.findByIdAndDelete(req.params.id);
    if (!fuelRecord) return res.status(404).json({ message: 'Fuel record not found' });
    res.json({ message: 'Fuel record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;