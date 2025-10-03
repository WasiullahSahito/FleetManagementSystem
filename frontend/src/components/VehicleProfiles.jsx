import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Car, X, CheckCircle, AlertTriangle, Settings, MapPin, Eye, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';
import * as XLSX from 'xlsx';

const vehicleConfigs = {
    ambulance: {
        locations: [
            'Front Bumper', 'Hood', 'Front Windshield',
            'Rear Bumper', 'Rear Doors', 'Rear Windows',
            'Driver Door', 'Left Panel', 'Front Left Tire', 'Rear Left Tire',
            'Passenger Door', 'Sliding Door', 'Right Panel', 'Front Right Tire', 'Rear Right Tire',
            'Roof'
        ],
    },
    van: {
        locations: [
            'Front Bumper', 'Hood', 'Front Windshield',
            'Rear Bumper', 'Rear Doors', 'Rear Windows',
            'Driver Door', 'Left Panel', 'Front Left Tire', 'Rear Left Tire',
            'Passenger Door', 'Sliding Door', 'Right Panel', 'Front Right Tire', 'Rear Right Tire',
            'Roof'
        ],
    },
    bike: {
        locations: ['Front Fender', 'Rear Fender', 'Fuel Tank', 'Seat', 'Handlebars', 'Exhaust', 'Front Wheel', 'Rear Wheel'],
    },
    default: {
        locations: ['Front', 'Back', 'Left Side', 'Right Side', 'Top'],
    }
};

const getVehicleConfig = (vehicleName) => {
    const name = (vehicleName || '').toLowerCase();
    if (name.includes('ambulance')) return vehicleConfigs.ambulance;
    if (name.includes('mortuary van')) return vehicleConfigs.van;
    if (name.includes('bike')) return vehicleConfigs.bike;
    return vehicleConfigs.default;
};

const stationList = [
    'Badin', 'Bathoro', 'Dadu', 'Ghotki', 'Hingorja', 'Hyderabad',
    'Jacobabad', 'Kandhkot', 'Kashmore', 'Khairpur', 'Larkana', 'Matiari',
    'Mirpurkhas', 'Mithi', 'Nagarparkar', 'Naushahro Feroze', 'Qambar',
    'Qazi Ahmed', 'Radhan/Mehar', 'Ranipur', 'Sakro', 'Sanghar', 'Sehwan',
    'Shahdadkot', 'Shaheed Benazirabad', 'Shikarpur', 'Sujawal', 'Sukkur',
    'Tando Adam', 'Tando Allahyar', 'Tando Muhammad Khan', 'Thatta', 'Tharparkar', 'Umerkot'
].sort();

const statusList = ['OnRoad Fleet', 'OffRoad Fleet', 'Mechanical Maintenance', 'Insurance Claim'];
const ownerList = ['PDMA', 'China Aid', 'SIEHS', 'TDP', 'Sindh Government'];

const callsignToStationMap = {
    'BD-309': 'Badin', 'BD-310': 'Badin', 'BD-311': 'Badin', 'BD-312': 'Badin', 'BD-313': 'Badin', 'M-05': 'Badin',
    'BT-271': 'Bathoro', 'BT-272': 'Bathoro', 'BT-273': 'Bathoro', 'BT-274': 'Bathoro', 'BT-275': 'Bathoro',
    'DA-439': 'Dadu', 'DA-440': 'Dadu', 'DA-391': 'Dadu',
    'GH-337': 'Ghotki', 'GH-338': 'Ghotki', 'GH-339': 'Ghotki', 'GH-340': 'Ghotki', 'GH-341': 'Ghotki', 'GH-342': 'Ghotki', 'GH-343': 'Ghotki', 'GH-344': 'Ghotki',
    'KP-404': 'Hingorja', 'KP-405': 'Hingorja', 'KP-406': 'Hingorja', 'KP-407': 'Hingorja', 'KP-408': 'Hingorja',
    'HY-292': 'Hyderabad', 'HY-293': 'Hyderabad', 'HY-294': 'Hyderabad', 'HY-295': 'Hyderabad', 'HY-296': 'Hyderabad', 'HY-297': 'Hyderabad', 'HY-298': 'Hyderabad', 'HY-299': 'Hyderabad', 'HY-300': 'Hyderabad', 'HY-301': 'Hyderabad', 'HY-302': 'Hyderabad', 'HY-317': 'Hyderabad', 'M-21': 'Hyderabad',
    'JB-277': 'Jacobabad', 'JB-374': 'Jacobabad', 'JB-375': 'Jacobabad', 'JB-376': 'Jacobabad', 'JB-377': 'Jacobabad', 'JB-378': 'Jacobabad', 'M-04': 'Jacobabad',
    'KA-370': 'Kandhkot', 'KA-371': 'Kandhkot', 'KA-372': 'Kandhkot', 'KA-373': 'Kandhkot', 'KA-500': 'Kandhkot',
    'KA-369': 'Kashmore', 'KA-501': 'Kashmore', 'KA-502': 'Kashmore', 'KA-506': 'Kashmore',
    'KP-400': 'Khairpur', 'KP-401': 'Khairpur', 'KP-402': 'Khairpur', 'KP-403': 'Khairpur', 'KP-437': 'Khairpur', 'KP-438': 'Khairpur', 'M-09': 'Khairpur',
    'LA-278': 'Larkana', 'LA-279': 'Larkana', 'LA-280': 'Larkana', 'LA-281': 'Larkana', 'LA-282': 'Larkana', 'LA-283': 'Larkana', 'LA-284': 'Larkana', 'LA-285': 'Larkana', 'LA-286': 'Larkana', 'LA-287': 'Larkana', 'LA-289': 'Larkana', 'LA-290': 'Larkana', 'M-22': 'Larkana', 'LA-291': 'Larkana',
    'MA-412': 'Matiari', 'MA-413': 'Matiari', 'MA-414': 'Matiari', 'MA-415': 'Matiari', 'MA-416': 'Matiari', 'M-20': 'Matiari',
    'MK-347': 'Mirpurkhas', 'MK-349': 'Mirpurkhas', 'MK-350': 'Mirpurkhas', 'MK-351': 'Mirpurkhas', 'MK-352': 'Mirpurkhas', 'MK-353': 'Mirpurkhas', 'MK-354': 'Mirpurkhas', 'MK-355': 'Mirpurkhas', 'MK-356': 'Mirpurkhas', 'MK-357': 'Mirpurkhas', 'M-19': 'Mirpurkhas',
    'TP-427': 'Mithi', 'TP-428': 'Mithi', 'TP-430': 'Mithi',
    'NF-395': 'Naushahro Feroze', 'NF-396': 'Naushahro Feroze', 'NF-409': 'Naushahro Feroze', 'NF-410': 'Naushahro Feroze', 'NF-411': 'Naushahro Feroze',
    'TP-497': 'Nagarparkar', 'TP-498': 'Nagarparkar', 'TP-499': 'Nagarparkar',
    'HY-318': 'Shaheed Benazirabad', 'SB-384': 'Shaheed Benazirabad', 'SB-385': 'Shaheed Benazirabad', 'SB-386': 'Shaheed Benazirabad', 'SB-387': 'Shaheed Benazirabad', 'SB-388': 'Shaheed Benazirabad', 'M-03': 'Shaheed Benazirabad',
    'QS-304': 'Qambar', 'QS-305': 'Qambar',
    'SB-379': 'Qazi Ahmed', 'SB-380': 'Qazi Ahmed', 'SB-381': 'Qazi Ahmed', 'SB-382': 'Qazi Ahmed', 'SB-383': 'Qazi Ahmed',
    'ME-420': 'Radhan/Mehar', 'ME-421': 'Radhan/Mehar',
    'TH-258': 'Sakro', 'TH-259': 'Sakro', 'TH-261': 'Sakro', 'TH-262': 'Sakro',
    'SG-422': 'Sanghar', 'SG-423': 'Sanghar', 'SG-424': 'Sanghar', 'SG-319': 'Sanghar',
    'JA-359': 'Sehwan', 'JA-360': 'Sehwan', 'JA-361': 'Sehwan', 'JA-362': 'Sehwan', 'JA-363': 'Sehwan',
    'QS-306': 'Shahdadkot', 'QS-307': 'Shahdadkot', 'QS-308': 'Shahdadkot', 'M-02': 'Shahdadkot',
    'SH-364': 'Shikarpur', 'SH-365': 'Shikarpur', 'SH-366': 'Shikarpur', 'SH-367': 'Shikarpur', 'SH-368': 'Shikarpur', 'SH-390': 'Shikarpur', 'SH-392': 'Shikarpur', 'M-24': 'Shikarpur',
    'SU-265': 'Sujawal', 'SU-268': 'Sujawal', 'SU-269': 'Sujawal', 'SU-270': 'Sujawal', 'M-08': 'Sujawal',
    'SK-320': 'Sukkur', 'SK-321': 'Sukkur', 'SK-322': 'Sukkur', 'SK-323': 'Sukkur', 'SK-324': 'Sukkur', 'SK-325': 'Sukkur', 'SK-326': 'Sukkur', 'SK-327': 'Sukkur', 'SK-328': 'Sukkur', 'SK-329': 'Sukkur', 'SK-330': 'Sukkur', 'M-15': 'Sukkur',
    'M-07': 'Tando Allahyar', 'TA-393': 'Tando Allahyar', 'TA-397': 'Tando Allahyar', 'TA-398': 'Tando Allahyar',
    'TH-252': 'Thatta', 'TH-254': 'Thatta', 'TH-256': 'Thatta', 'TH-257': 'Thatta', 'M-25': 'Thatta',
    'TM-260': 'Tando Muhammad Khan', 'TM-263': 'Tando Muhammad Khan', 'TM-264': 'Tando Muhammad Khan', 'TM-276': 'Tando Muhammad Khan', 'TM-389': 'Tando Muhammad Khan', 'M-17': 'Tando Muhammad Khan',
    'UK-345': 'Umerkot', 'UK-346': 'Umerkot', 'UK-348': 'Umerkot', 'UK-358': 'Umerkot', 'UK-399': 'Umerkot', 'UK-494': 'Umerkot', 'UK-495': 'Umerkot', 'UK-496': 'Umerkot',
    'RR-01': 'Hyderabad', 'RR-02': 'Hyderabad', 'RR-03': 'Hyderabad', 'RR-04': 'Hyderabad', 'RR-05': 'Hyderabad', 'RR-06': 'Hyderabad', 'RR-07': 'Hyderabad', 'RR-08': 'Hyderabad', 'RR-09': 'Hyderabad', 'RR-10': 'Hyderabad',
};

const callsignList = Object.keys(callsignToStationMap).sort();

export default function VehicleProfiles() {
    const [vehicles, setVehicles] = useState([]);
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [fuelRecords, setFuelRecords] = useState([]);
    const [selectedStation, setSelectedStation] = useState('');
    const [stationData, setStationData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stationMetrics, setStationMetrics] = useState(null);
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [selectedVehicleObject, setSelectedVehicleObject] = useState(null);
    const [callsignOptions, setCallsignOptions] = useState([]);
    const [formData, setFormData] = useState({
        name: '', callsign: '', model: '', year: new Date().getFullYear(), mileage: '', status: 'OnRoad Fleet',
        chassisNo: '', engineNo: '', registrationNo: '', fuelType: 'Petrol',
        transmission: 'Manual', engineCapacity: '', registeredCity: '', ownerName: ''
    });
    const [mainImageFile, setMainImageFile] = useState(null);
    const [damagePoints, setDamagePoints] = useState([]);
    const [newDamagePoint, setNewDamagePoint] = useState({ type: 'D', location: '', notes: '', file: null });
    const [editingId, setEditingId] = useState(null);
    const [currentDamageLocations, setCurrentDamageLocations] = useState(vehicleConfigs.default.locations);
    const [editingDamageIndex, setEditingDamageIndex] = useState(null);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedVehicleId) {
            const vehicle = vehicles.find(v => v._id === selectedVehicleId);
            setSelectedVehicleObject(vehicle);
        } else {
            setSelectedVehicleObject(null);
        }
    }, [selectedVehicleId, vehicles]);

    useEffect(() => {
        const config = getVehicleConfig(formData.name);
        setCurrentDamageLocations(config.locations);
        if (editingDamageIndex === null && !config.locations.includes(newDamagePoint.location)) {
            setNewDamagePoint(prev => ({ ...prev, location: config.locations[0] || '' }));
        }
    }, [formData.name, showModal, editingDamageIndex, newDamagePoint.location]);

    useEffect(() => {
        if (showModal) {
            const stationForCallsign = callsignToStationMap[formData.callsign];
            if (stationForCallsign) {
                setFormData(prev => ({ ...prev, registeredCity: stationForCallsign }));
            }
        }
    }, [formData.callsign, showModal]);

    useEffect(() => {
        if (!selectedStation) {
            setStationData(null);
            setStationMetrics(null);
            setCallsignOptions([]);
            return;
        }

        const stationVehicles = vehicles.filter(v => v.registeredCity === selectedStation);
        setCallsignOptions(stationVehicles);

        const uniqueVehicleTypesInStation = [...new Map(stationVehicles.map(item => [item.name, item])).values()]
            .sort((a, b) => a.name.localeCompare(b.name));

        const maintenanceCount = stationVehicles.filter(v => v.status === 'Mechanical Maintenance').length;
        const insuranceClaimCount = stationVehicles.filter(v => v.status === 'Insurance Claim').length;
        const offRoadFleetCount = stationVehicles.filter(v => v.status === 'OffRoad Fleet').length;
        setStationMetrics({
            total: stationVehicles.length,
            onRoad: stationVehicles.filter(v => v.status === 'OnRoad Fleet').length,
            maintenance: maintenanceCount,
            insuranceClaim: insuranceClaimCount,
            offRoad: maintenanceCount + insuranceClaimCount + offRoadFleetCount,
        });

        const statusCounts = {};
        uniqueVehicleTypesInStation.forEach(type => {
            const vehiclesOfType = stationVehicles.filter(v => v.name === type.name);
            const maintenance = vehiclesOfType.filter(v => v.status === 'Mechanical Maintenance').length;
            const insurance = vehiclesOfType.filter(v => v.status === 'Insurance Claim').length;
            const offRoadFleet = vehiclesOfType.filter(v => v.status === 'OffRoad Fleet').length;
            statusCounts[type.name] = {
                total: vehiclesOfType.length,
                onRoad: vehiclesOfType.filter(v => v.status === 'OnRoad Fleet').length,
                maintenance,
                insurance,
                offRoad: maintenance + insurance + offRoadFleet,
            };
        });

        const stationVehicleIds = stationVehicles.map(v => v._id);

        const maintAnalytics = {};
        const stationMaintRecords = maintenanceRecords.filter(m => stationVehicleIds.includes(m.vehicle?._id));
        uniqueVehicleTypesInStation.forEach(vehicleType => {
            const vehicleIdsForType = stationVehicles.filter(v => v.name === vehicleType.name).map(v => v._id);
            const recordsForType = stationMaintRecords.filter(m => vehicleIdsForType.includes(m.vehicle?._id));
            const totalCost = recordsForType.reduce((sum, rec) => sum + (rec.partsCost || 0) + (rec.otherCost || 0), 0);
            const preventiveCost = recordsForType.filter(r => (r.type || '').toLowerCase().includes('preventive')).reduce((sum, rec) => sum + (rec.partsCost || 0) + (rec.otherCost || 0), 0);
            const correctiveCost = totalCost - preventiveCost;
            const avgCostPerVehicle = vehicleIdsForType.length > 0 ? totalCost / vehicleIdsForType.length : 0;
            maintAnalytics[vehicleType.name] = { preventiveCost, correctiveCost, totalCost, avgCostPerVehicle };
        });

        const fuelAnalytics = {};
        const stationFuelRecords = fuelRecords.filter(f => stationVehicleIds.includes(f.vehicle?._id));
        uniqueVehicleTypesInStation.forEach(vehicleType => {
            const vehicleIdsForType = stationVehicles.filter(v => v.name === vehicleType.name).map(v => v._id);
            const recordsForType = stationFuelRecords.filter(f => vehicleIdsForType.includes(f.vehicle?._id));
            const totalLiters = recordsForType.reduce((sum, record) => sum + (record.current_refueling_liters || 0), 0);
            const totalCost = recordsForType.reduce((sum, record) => sum + (record.amount_rs || 0), 0);
            const totalKm = recordsForType.reduce((sum, record) => sum + (record.total_km || 0), 0);
            const avgEfficiency = totalLiters > 0 ? (totalKm / totalLiters) : 0;
            const avgCost = totalKm > 0 ? (totalCost / totalKm) : 0;
            fuelAnalytics[vehicleType.name] = { total: vehicleIdsForType.length, totalLiters, totalCost, avgEfficiency, avgCost };
        });

        setStationData({ uniqueVehicleTypes: uniqueVehicleTypesInStation, statusCounts, maintenance: maintAnalytics, fuel: fuelAnalytics, vehicles: stationVehicles });

    }, [selectedStation, vehicles, maintenanceRecords, fuelRecords]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [vehiclesRes, maintRes, fuelRes] = await Promise.all([
                api.get('/vehicles'),
                api.get('/maintenance'),
                api.get('/fuel')
            ]);
            const sortedVehicles = vehiclesRes.data.sort((a, b) => a.callsign.localeCompare(b.callsign));
            setVehicles(sortedVehicles);
            setMaintenanceRecords(maintRes.data);
            setFuelRecords(fuelRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', callsign: '', model: '', year: new Date().getFullYear(), mileage: '', status: 'OnRoad Fleet',
            chassisNo: '', engineNo: '', registrationNo: '', fuelType: 'Petrol',
            transmission: 'Manual', engineCapacity: '', registeredCity: '', ownerName: ''
        });
        setMainImageFile(null);
        setDamagePoints([]);
        setNewDamagePoint({ type: 'D', location: '', notes: '', file: null });
        setEditingId(null);
        setEditingDamageIndex(null);
    };

    const handleEdit = (vehicle) => {
        setEditingId(vehicle._id);
        setFormData({
            name: vehicle.name || '',
            callsign: vehicle.callsign || '',
            model: vehicle.model || '',
            year: vehicle.year || '',
            mileage: vehicle.mileage || '',
            status: vehicle.status || 'OnRoad Fleet',
            chassisNo: vehicle.chassisNo || '',
            engineNo: vehicle.engineNo || '',
            registrationNo: vehicle.registrationNo || '',
            fuelType: vehicle.fuelType || 'Petrol',
            transmission: vehicle.transmission || 'Manual',
            engineCapacity: vehicle.engineCapacity || '',
            registeredCity: vehicle.registeredCity || '',
            ownerName: vehicle.ownerName || '',
        });
        setMainImageFile(null);
        setDamagePoints(vehicle.damagePoints || []);
        setShowModal(true);
    };

    const handleDelete = async (vehicleId) => {
        if (window.confirm('Are you sure you want to delete this vehicle and all its associated records? This action cannot be undone.')) {
            try {
                await api.delete(`/vehicles/${vehicleId}`);
                setSelectedVehicleId('');
                await fetchData();
            } catch (error) {
                console.error('Error deleting vehicle:', error);
                alert('Failed to delete vehicle.');
            }
        }
    };

    const handleStartEditDamage = (index) => {
        setEditingDamageIndex(index);
        const pointToEdit = damagePoints[index];
        setNewDamagePoint({
            type: pointToEdit.type,
            location: pointToEdit.location,
            notes: pointToEdit.notes,
            file: null,
            imagePath: pointToEdit.imagePath,
        });
        document.getElementById('damage-file-input').value = "";
    };

    const handleCancelEditDamage = () => {
        setEditingDamageIndex(null);
        setNewDamagePoint({ type: 'D', location: currentDamageLocations[0], notes: '', file: null });
        document.getElementById('damage-file-input').value = "";
    };

    const handleUpdateDamagePoint = () => {
        if (!newDamagePoint.location) {
            alert('Please provide a location.');
            return;
        }
        const updatedPoints = [...damagePoints];
        updatedPoints[editingDamageIndex] = { ...updatedPoints[editingDamageIndex], ...newDamagePoint };
        setDamagePoints(updatedPoints);
        handleCancelEditDamage();
    };

    const handleAddDamagePoint = () => {
        if (!newDamagePoint.location || !newDamagePoint.file) {
            alert('Please provide a location and select an image for the damage point.');
            return;
        }
        setDamagePoints([...damagePoints, newDamagePoint]);
        setNewDamagePoint({ type: 'D', location: currentDamageLocations[0], notes: '', file: null });
        document.getElementById('damage-file-input').value = "";
    };

    const handleRemoveDamagePoint = (index) => {
        setDamagePoints(damagePoints.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] || typeof formData[key] === 'number') {
                    formDataToSend.append(key, formData[key]);
                }
            });
            if (mainImageFile) {
                formDataToSend.append('main', mainImageFile);
            }

            const newPointsWithFiles = damagePoints.filter(p => p.file);
            const pointsMetadata = damagePoints.map(p => {
                const { file, ...meta } = p;
                return meta;
            });
            formDataToSend.append('damagePoints', JSON.stringify(pointsMetadata));

            newPointsWithFiles.forEach((point) => {
                formDataToSend.append('damageImages', point.file);
            });

            if (editingId) {
                await api.put(`/vehicles/${editingId}`, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await api.post('/vehicles', formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
            }

            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving vehicle:', error.response ? error.response.data : error.message);
            alert(`Error saving vehicle: ${error.response?.data?.message || 'Please check the console for details.'}`);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = [
            'name', 'callsign', 'model', 'year', 'mileage', 'status',
            'chassisNo', 'engineNo', 'registrationNo', 'fuelType',
            'transmission', 'engineCapacity', 'registeredCity', 'ownerName'
        ];
        const sampleData = [{
            name: 'Ambulances', callsign: 'HY-999', model: 'Toyota Hiace',
            year: 2022, mileage: 15000, status: 'OnRoad Fleet',
            chassisNo: 'CHASSIS12345', engineNo: 'ENGINE54321', registrationNo: 'REG-001',
            fuelType: 'Diesel', transmission: 'Manual', engineCapacity: '2800',
            registeredCity: 'Hyderabad', ownerName: 'SIEHS'
        }];

        const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Vehicles');
        XLSX.writeFile(wb, 'vehicles_template.xlsx');
    };
    const handleBulkUpload = async () => {
        if (!uploadFile) {
            alert('Please select a file to upload.');
            return;
        }
        setIsUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', uploadFile);

        try {
            const response = await api.post('/vehicles/bulk-upload', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Show detailed success message
            alert(`Bulk upload successful! ${response.data.message}`);

            if (response.data.errors && response.data.errors.length > 0) {
                console.log('Upload errors:', response.data.errors);
                // You can show errors in a more detailed way if needed
                if (response.data.errors.length > 0) {
                    alert(`Some errors occurred:\n${response.data.errors.slice(0, 5).join('\n')}${response.data.errors.length > 5 ? '\n... and more' : ''}`);
                }
            }

            setShowBulkModal(false);
            setUploadFile(null);
            fetchData(); // Refresh the data
        } catch (error) {
            console.error('Error during bulk upload:', error);
            let errorMessage = error.response?.data?.message || 'An error occurred.';

            // Show detailed error information
            if (error.response?.data?.details) {
                if (Array.isArray(error.response.data.details)) {
                    errorMessage += `\nDetails:\n${error.response.data.details.slice(0, 5).join('\n')}`;
                } else {
                    errorMessage += `\nDetails: ${error.response.data.details}`;
                }
            }

            alert(`Upload failed: ${errorMessage}`);
        } finally {
            setIsUploading(false);
        }
    };


    const fleetMetricsCards = stationMetrics ? [
        { title: 'Total Fleet', value: stationMetrics.total, icon: Car, color: 'green' },
        { title: 'On-Road Fleet', value: stationMetrics.onRoad, icon: CheckCircle, color: 'green' },
        { title: 'Off-Road Fleet', value: stationMetrics.offRoad, icon: AlertTriangle, color: 'red' },
        { title: 'Mechanical Maintenance', value: stationMetrics.maintenance, icon: Settings, color: 'yellow' },
        { title: 'Insurance Claim', value: stationMetrics.insuranceClaim, icon: MapPin, color: 'purple' },
    ] : [];

    return (
        <div className="p-6 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Vehicle Profiles</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowBulkModal(true)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 flex items-center gap-2 shadow-sm">
                        <Upload className="h-4 w-4" /> Bulk Upload
                    </button>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm">
                        <Plus className="h-4 w-4" /> Add Vehicle
                    </button>
                </div>
            </div>

            <div className="flex items-end flex-wrap gap-4 mb-8">
                <div className="flex-1 min-w-[250px] max-w-sm">
                    <label htmlFor="station-select" className="block text-sm font-medium text-gray-700 mb-2">Select by Station</label>
                    <select
                        id="station-select"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        value={selectedStation}
                        onChange={(e) => {
                            setSelectedStation(e.target.value);
                            setSelectedVehicleId('');
                        }}
                    >
                        <option value="">Please Select a Station</option>
                        {stationList.map(station => (
                            <option key={station} value={station}>{station}</option>
                        ))}
                    </select>
                </div>
                {selectedStation && callsignOptions.length > 0 && (
                    <div className="flex-1 min-w-[250px] max-w-sm">
                        <label htmlFor="vehicle-detail-select" className="block text-sm font-medium text-gray-700 mb-2">Select Vehicle by Callsign</label>
                        <select
                            id="vehicle-detail-select"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                            onChange={(e) => setSelectedVehicleId(e.target.value)}
                            value={selectedVehicleId}
                        >
                            <option value="">-- Select a Vehicle to Manage --</option>
                            {callsignOptions.map(vehicle => (
                                <option key={vehicle._id} value={vehicle._id}>
                                    {vehicle.callsign} - {vehicle.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center py-16 text-gray-500">Loading...</div>
            ) : !selectedStation ? (
                <div className="text-center py-16 text-gray-500 bg-white rounded-lg border shadow-sm">
                    <Car className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="font-semibold text-lg">No Station Selected</h3>
                    <p className="text-sm">Please choose a station to view its fleet details and analytics.</p>
                </div>
            ) : selectedVehicleId && selectedVehicleObject ? (
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Selected Vehicle</h2>
                    <div className="bg-white rounded-xl shadow-lg border p-6 max-w-sm">
                        <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center p-2 mb-4">
                            <img src={selectedVehicleObject.images?.main ? `http://localhost:5000/${selectedVehicleObject.images.main}` : '/vehicle/ambulance.png'} alt={selectedVehicleObject.name} className="max-h-full max-w-full object-contain" />
                        </div>
                        <h3 className="font-bold text-2xl text-green-600">{selectedVehicleObject.callsign}</h3>
                        <p className="text-md text-gray-500 mb-4">{selectedVehicleObject.name} - {selectedVehicleObject.year}</p>
                        <hr className="my-4" />
                        <div className="text-md space-y-3 text-gray-700 mb-6">
                            <p className="flex justify-between"><span>Status:</span><span className="font-bold text-gray-900">{selectedVehicleObject.status}</span></p>
                            <p className="flex justify-between"><span>Mileage:</span><span className="font-bold text-gray-900">{selectedVehicleObject.mileage?.toLocaleString() || 'N/A'} km</span></p>
                        </div>
                        <div className="space-y-2">
                            <Link to={`/vehicles/${selectedVehicleObject._id}`} className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 shadow-sm transition-all font-semibold">
                                <Eye size={16} /> View Details
                            </Link>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(selectedVehicleObject)}
                                    className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm font-semibold"
                                >
                                    <Edit size={16} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(selectedVehicleObject._id)}
                                    className="w-full bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 shadow-sm font-semibold"
                                >
                                    <Trash size={16} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-12">
                    {stationMetrics && (
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Fleet Status</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                {fleetMetricsCards.map((metric, index) => (
                                    <div key={index} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
                                        <div className={`flex-shrink-0 p-3.5 rounded-lg bg-${metric.color}-100`}>
                                            <metric.icon className={`h-7 w-7 text-${metric.color}-600`} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-bold">{metric.title}</p>
                                            <p className="text-3xl font-bold text-gray-800">{metric.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Fleet Vehicles</h2>
                        {stationData && stationData.uniqueVehicleTypes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {stationData.uniqueVehicleTypes.map(vehicleType => {
                                    const counts = stationData.statusCounts[vehicleType.name];
                                    return (
                                        <div key={vehicleType.name} className="bg-white rounded-xl shadow-sm border p-4 flex flex-col">
                                            <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center p-2 mb-4">
                                                <img src={vehicleType.images?.main ? `http://localhost:5000/${vehicleType.images.main}` : '/vehicle/ambulance.png'} alt={vehicleType.name} className="max-h-full max-w-full object-contain" />
                                            </div>
                                            <div className="flex-grow">
                                                <h3 className="font-bold text-xl text-gray-800">{vehicleType.name}</h3>
                                                <p className="text-sm text-green-600 font-bold mb-3">Total: {counts.total}</p>
                                                <div className="text-sm space-y-2 text-gray-600">
                                                    <p className="flex justify-between"><span>On-Road:</span><span className="font-bold text-green-600">{counts.onRoad}</span></p>
                                                    <p className="flex justify-between"><span>Off-Road:</span><span className="font-bold text-red-600">{counts.offRoad}</span></p>
                                                    <p className="flex justify-between"><span>Maintenance:</span><span className="font-bold text-yellow-600">{counts.maintenance}</span></p>
                                                    <p className="flex justify-between"><span>Insurance:</span><span className="font-bold text-purple-600">{counts.insurance}</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-gray-500 bg-white rounded-lg border shadow-sm">
                                <Car className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <h3 className="font-semibold text-lg">No Vehicles Found</h3>
                                <p className="text-sm">There are no vehicles registered at {selectedStation}.</p>
                            </div>
                        )}
                    </div>

                    {stationData && stationData.uniqueVehicleTypes.length > 0 && (
                        <>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Maintenance Cost Analytics</h2>
                                <div className="flex overflow-x-auto space-x-6 pb-4">
                                    {stationData.uniqueVehicleTypes.map((vehicle) => {
                                        const analytics = stationData.maintenance[vehicle.name] || { preventiveCost: 0, correctiveCost: 0, totalCost: 0, avgCostPerVehicle: 0 };
                                        return (
                                            <div key={`${vehicle.name}-maint`} className="flex-none w-72 bg-white border rounded-lg shadow-sm overflow-hidden shrink-0">
                                                <div className="h-40 bg-white p-2 flex items-center justify-center border-b"><img src={vehicle.images?.main ? `http://localhost:5000/${vehicle.images.main}` : '/vehicle/ambulance.png'} alt={vehicle.name} className="max-h-full max-w-full object-contain" /></div>
                                                <div className="p-4">
                                                    <h3 className="font-bold text-xl text-gray-800 mb-4">{vehicle.name}</h3>
                                                    <div className="space-y-2 text-sm text-gray-600">
                                                        <p className="flex justify-between"><span>Preventive Cost:</span><span className="font-medium text-gray-800">Rs. {analytics.preventiveCost.toLocaleString()}</span></p>
                                                        <p className="flex justify-between"><span>Corrective Cost:</span><span className="font-medium text-gray-800">Rs. {analytics.correctiveCost.toLocaleString()}</span></p>
                                                        <p className="flex justify-between mt-1 pt-1 border-t"><span className="font-bold">Total Cost:</span><span className="font-bold text-gray-800">Rs. {analytics.totalCost.toLocaleString()}</span></p>
                                                        <p className="flex justify-between"><span>Avg Cost/Vehicle:</span><span className="font-medium text-gray-800">Rs. {analytics.avgCostPerVehicle.toFixed(2)}</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Fuel Analytics</h2>
                                <div className="flex overflow-x-auto space-x-6 pb-4">
                                    {stationData.uniqueVehicleTypes.map((vehicle) => {
                                        const analytics = stationData.fuel[vehicle.name] || { totalLiters: 0, totalCost: 0, avgEfficiency: 0, avgCost: 0 };
                                        return (
                                            <div key={`${vehicle.name}-fuel`} className="flex-none w-64 bg-white border rounded-lg shadow-sm overflow-hidden shrink-0">
                                                <div className="h-40 bg-white p-2 flex items-center justify-center border-b"><img src={vehicle.images?.main ? `http://localhost:5000/${vehicle.images.main}` : '/vehicle/ambulance.png'} alt={vehicle.name} className="max-h-full max-w-full object-contain" /></div>
                                                <div className="p-4">
                                                    <h3 className="font-bold text-gray-800 text-lg mb-1">{vehicle.name}</h3>
                                                    <p className="text-sm text-gray-600 mb-3">Total: {analytics.total}</p>
                                                    <div className="space-y-1.5 text-sm text-gray-500">
                                                        <p className="flex justify-between"><span>Monthly Fueling:</span><span className="font-bold text-gray-800">{analytics.totalLiters.toFixed(2)} Liters</span></p>
                                                        <p className="flex justify-between"><span>Monthly Fuel Cost:</span><span className="font-bold text-gray-800">Rs. {analytics.totalCost.toLocaleString()}</span></p>
                                                        <p className="flex justify-between"><span>Avg Efficiency:</span><span className="font-bold text-gray-800">{analytics.avgEfficiency.toFixed(2)} KM/L</span></p>
                                                        <p className="flex justify-between"><span>Avg Cost:</span><span className="font-bold text-gray-800">Rs. {analytics.avgCost.toFixed(2)} / KM</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div><label className="block text-sm font-medium">Name (e.g. Ambulances)</label><input type="text" required name="name" className="w-full px-3 py-2 border rounded-md" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium">Callsign</label><select required name="callsign" className="w-full px-3 py-2 border rounded-md bg-white" value={formData.callsign} onChange={(e) => setFormData({ ...formData, callsign: e.target.value })}><option value="">Select Callsign</option>{callsignList.map(cs => (<option key={cs} value={cs}>{cs}</option>))}</select></div>
                                <div><label className="block text-sm font-medium">Model</label><input type="text" required name="model" className="w-full px-3 py-2 border rounded-md" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium">Year</label><input type="number" required name="year" className="w-full px-3 py-2 border rounded-md" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium">Mileage (km)</label><input type="number" name="mileage" className="w-full px-3 py-2 border rounded-md" value={formData.mileage} onChange={(e) => setFormData({ ...formData, mileage: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium">Ownership</label><select name="ownerName" className="w-full px-3 py-2 border rounded-md bg-white" value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}><option value="">Select Ownership</option>{ownerList.map(o => (<option key={o} value={o}>{o}</option>))}</select></div>
                                <div><label className="block text-sm font-medium">Chassis No.</label><input type="text" name="chassisNo" className="w-full px-3 py-2 border rounded-md" value={formData.chassisNo} onChange={(e) => setFormData({ ...formData, chassisNo: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium">Engine No.</label><input type="text" name="engineNo" className="w-full px-3 py-2 border rounded-md" value={formData.engineNo} onChange={(e) => setFormData({ ...formData, engineNo: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium">Registration No.</label><input type="text" name="registrationNo" className="w-full px-3 py-2 border rounded-md" value={formData.registrationNo} onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium">Fuel Type</label><input type="text" name="fuelType" className="w-full px-3 py-2 border rounded-md" value={formData.fuelType} onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium">Engine Capacity (cc)</label><input type="text" name="engineCapacity" className="w-full px-3 py-2 border rounded-md" value={formData.engineCapacity} onChange={(e) => setFormData({ ...formData, engineCapacity: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium">Station</label><select name="registeredCity" className="w-full px-3 py-2 border rounded-md bg-white" value={formData.registeredCity} onChange={(e) => setFormData({ ...formData, registeredCity: e.target.value })}><option value="">Select Station</option>{stationList.map(s => (<option key={s} value={s}>{s}</option>))}</select></div>
                                <div><label className="block text-sm font-medium">Transmission</label><select name="transmission" className="w-full px-3 py-2 border rounded-md bg-white" value={formData.transmission} onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}><option value="Manual">Manual</option><option value="Automatic">Automatic</option></select></div>
                                <div><label className="block text-sm font-medium">Status</label><select name="status" className="w-full px-3 py-2 border rounded-md bg-white" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option value="">Select Status</option>{statusList.map(s => (<option key={s} value={s}>{s}</option>))}</select></div>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-800 my-2">Image Uploads</h3>
                                <div className="p-4 border rounded-lg bg-gray-50">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Image</label>
                                    <input type="file" accept="image/*" onChange={(e) => setMainImageFile(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-800 mb-2">Damage Points</h3>
                                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">
                                    {damagePoints.map((point, index) => {
                                        const imgSrc = point.file ? URL.createObjectURL(point.file) : (point.imagePath ? `http://localhost:5000/${point.imagePath}` : null);
                                        return (
                                            <div key={index} className="flex items-center gap-3 bg-gray-100 p-2 rounded">
                                                {imgSrc && <img src={imgSrc} alt={point.location} className="w-12 h-12 object-cover rounded-md border" />}
                                                <div className="flex-grow text-sm"><p><span className="font-bold">{point.type}:</span> {point.location}</p><p className="text-xs text-gray-500 truncate italic">{point.notes || 'No notes'}</p></div>
                                                <div className="flex-shrink-0 flex gap-2">
                                                    <button type="button" onClick={() => handleStartEditDamage(index)} className="text-blue-500 hover:text-blue-700 p-1"><Edit size={16} /></button>
                                                    <button type="button" onClick={() => handleRemoveDamagePoint(index)} className="text-red-500 hover:text-red-700 p-1"><Trash size={16} /></button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 p-3 border rounded-lg bg-gray-50">
                                    <select value={newDamagePoint.type} onChange={(e) => setNewDamagePoint({ ...newDamagePoint, type: e.target.value })} className="w-full border-gray-300 rounded-md text-sm"><option value="D">Dent (D)</option><option value="S">Scratch (S)</option><option value="B">Broken (B)</option><option value="OK">OK</option></select>
                                    <select value={newDamagePoint.location} onChange={(e) => setNewDamagePoint({ ...newDamagePoint, location: e.target.value })} className="w-full border-gray-300 rounded-md text-sm">
                                        <option value="">Select Location</option>
                                        {currentDamageLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                    </select>
                                    <input type="text" placeholder="Notes (optional)" value={newDamagePoint.notes} onChange={(e) => setNewDamagePoint({ ...newDamagePoint, notes: e.target.value })} className="border-gray-300 rounded-md text-sm" />
                                    <input id="damage-file-input" type="file" onChange={(e) => setNewDamagePoint({ ...newDamagePoint, file: e.target.files[0] })} className="text-sm text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300" />
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={editingDamageIndex !== null ? handleUpdateDamagePoint : handleAddDamagePoint}
                                        className="bg-green-100 text-green-800 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-green-200"
                                    >
                                        {editingDamageIndex !== null ? 'Update Point' : 'Add Damage Point'}
                                    </button>
                                    {editingDamageIndex !== null && (
                                        <button
                                            type="button"
                                            onClick={handleCancelEditDamage}
                                            className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-300"
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6 mt-4 border-t">
                                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">{editingId ? 'Update Record' : 'Add Record'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-xl">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Bulk Upload Vehicles</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Upload an Excel file (.xlsx) with vehicle data. The file must have a header row with the exact column names as in the template. The 'callsign' for each vehicle must be unique.
                        </p>
                        <p className="text-sm text-gray-600 font-semibold mb-4">Required columns: name, callsign, model, year.</p>

                        <button onClick={handleDownloadTemplate} className="text-green-600 hover:text-green-800 text-sm font-semibold mb-4">
                            Download Template File
                        </button>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Excel File</label>
                            <input
                                type="file"
                                accept=".xlsx"
                                onChange={(e) => setUploadFile(e.target.files[0])}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                            />
                        </div>

                        <div className="flex gap-4 pt-6 mt-4 border-t">
                            <button type="button" onClick={() => setShowBulkModal(false)} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold">
                                Cancel
                            </button>
                            <button onClick={handleBulkUpload} disabled={isUploading} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-green-300">
                                {isUploading ? 'Uploading...' : 'Upload File'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}