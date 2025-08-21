import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Download } from 'lucide-react';
import api from '../api';
import * as XLSX from 'xlsx';

// Constants for maintenance categories and types
const maintenanceCategories = ['Preventive', 'Corrective'];
const maintenanceTypes = {
    Preventive: ['PM', 'Tires', 'Brake'],
    Corrective: ['Clutch', 'Mechanical', 'Engine', 'Suspension', 'A/C', 'Fabrication', 'Electrical', 'Brake'],
};

// Regions and their associated stations for filtering
const regions = {
    'Sukkur': ['Larkano', 'Qambar', 'Shahdadkot', 'Sukkur', 'Ghotki', 'Shikarpur', 'Kashmore', 'Kandhkot', 'Jacobabad', 'Khairpur', 'Hingroja', 'Ranipur'],
    'Hyderabad': ['Hyderabad', 'Qazi Ahmed', 'Shaheed Benazirabad', 'Matiari', 'Naushero Feroze', 'Tando Allahyar', 'Jamshoro', 'Dadu', 'Mehar/Radhan', 'Sanghar', 'Sehwan'],
    'Bambore': ['Thatta', 'Sujawal', 'Badin', 'Bathoro', 'Sakro', 'Tando Muhammad Khan', 'Mirpurkhas', 'Umerkot', 'Mithi', 'Tharparkar', 'Nagarparkar'],
};
const allStations = Object.values(regions).flat().sort();

export default function MaintenanceRepairs() {
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedStation, setSelectedStation] = useState('');
    const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [formData, setFormData] = useState({
        vehicle: '', category: '', type: '',
        maintenanceDetails: '',
        dateIn: new Date().toISOString().split('T')[0], timeIn: '',
        dateOut: '', timeOut: '', removeDate: '',
        electricalCost: '', fabricationCost: '', insuranceCost: '', otherCost: '',
        status: 'Scheduled', description: '', technician: '', partsUsed: ''
    });

    useEffect(() => {
        fetchMaintenanceRecords();
        fetchVehicles();
    }, []);

    useEffect(() => {
        let records = maintenanceRecords;
        // Updated to filter by dateIn
        if (selectedMonth) records = records.filter(r => r.dateIn?.startsWith(selectedMonth));

        let stationsToFilter = selectedStation ? [selectedStation] : selectedRegion ? regions[selectedRegion] : [];
        if (stationsToFilter.length > 0) {
            const stationVehicleIds = new Set(vehicles.filter(v => stationsToFilter.includes(v.registeredCity)).map(v => v._id));
            records = records.filter(r => stationVehicleIds.has(r.vehicle?._id));
        }

        if (selectedCategory) records = records.filter(r => r.category === selectedCategory);
        if (selectedVehicleFilter) records = records.filter(r => r.vehicle?._id === selectedVehicleFilter);

        setFilteredRecords(records);
    }, [selectedMonth, selectedRegion, selectedStation, selectedVehicleFilter, selectedCategory, maintenanceRecords, vehicles]);

    const fetchMaintenanceRecords = async () => {
        try {
            const response = await api.get('/maintenance');
            setMaintenanceRecords(response.data);
        } catch (error) { console.error('Error fetching maintenance records:', error); }
    };

    const fetchVehicles = async () => {
        try {
            const response = await api.get('/vehicles');
            setVehicles(response.data);
        } catch (error) { console.error('Error fetching vehicles:', error); }
    };

    const resetForm = () => {
        setFormData({
            vehicle: '', category: '', type: '',
            maintenanceDetails: '',
            dateIn: new Date().toISOString().split('T')[0], timeIn: '',
            dateOut: '', timeOut: '', removeDate: '',
            electricalCost: '', fabricationCost: '', insuranceCost: '', otherCost: '',
            status: 'Scheduled', description: '', technician: '', partsUsed: ''
        });
        setEditingId(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'category') setFormData(prev => ({ ...prev, category: value, type: '' }));
        else setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...formData, electricalCost: parseFloat(formData.electricalCost) || 0, fabricationCost: parseFloat(formData.fabricationCost) || 0, insuranceCost: parseFloat(formData.insuranceCost) || 0, otherCost: parseFloat(formData.otherCost) || 0 };

        // Combine date and time fields into ISO strings, handle empty fields
        payload.dateIn = formData.dateIn ? new Date(`${formData.dateIn}T${formData.timeIn || '00:00:00'}`).toISOString() : null;
        payload.dateOut = formData.dateOut ? new Date(`${formData.dateOut}T${formData.timeOut || '00:00:00'}`).toISOString() : null;
        payload.removeDate = formData.removeDate ? new Date(formData.removeDate).toISOString() : null;

        // Remove temporary state fields before sending
        delete payload.timeIn;
        delete payload.timeOut;

        try {
            if (editingId) await api.put(`/maintenance/${editingId}`, payload);
            else await api.post('/maintenance', payload);
            setShowModal(false);
            resetForm();
            fetchMaintenanceRecords();
        } catch (error) {
            console.error('Error saving maintenance record:', error);
            alert(`Error: ${error.response?.data?.message || 'Could not save record.'}`);
        }
    };

    const handleEdit = (record) => {
        setEditingId(record._id);

        const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';
        const formatTime = (dateStr) => dateStr ? new Date(dateStr).toTimeString().slice(0, 5) : '';

        setFormData({
            vehicle: record.vehicle?._id || '', category: record.category || '', type: record.type || '',
            maintenanceDetails: record.maintenanceDetails || '',
            dateIn: formatDate(record.dateIn), timeIn: formatTime(record.dateIn),
            dateOut: formatDate(record.dateOut), timeOut: formatTime(record.dateOut),
            removeDate: formatDate(record.removeDate),
            electricalCost: record.electricalCost || '', fabricationCost: record.fabricationCost || '',
            insuranceCost: record.insuranceCost || '', otherCost: record.otherCost || '',
            status: record.status || 'Scheduled', description: record.description || '',
            technician: record.technician || '', partsUsed: record.partsUsed || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this maintenance record?')) {
            try {
                await api.delete(`/maintenance/${id}`);
                fetchMaintenanceRecords();
            } catch (error) { console.error('Error deleting maintenance record:', error); }
        }
    };

    const handleExportToExcel = () => {
        if (filteredRecords.length === 0) return alert('No data to export.');
        const exportData = filteredRecords.map(r => ({
            'Vehicle': r.vehicle?.callsign || 'N/A', 'Category': r.category, 'Type': r.type,
            'Maintenance Details': r.maintenanceDetails,
            'Date In': r.dateIn ? new Date(r.dateIn).toLocaleString() : '',
            'Date Out': r.dateOut ? new Date(r.dateOut).toLocaleString() : '',
            'Remove Date': r.removeDate ? new Date(r.removeDate).toLocaleDateString() : '',
            'Status': r.status,
            'Electrical Cost (Rs.)': r.electricalCost || 0, 'Fabrication Cost (Rs.)': r.fabricationCost || 0, 'Insurance Cost (Rs.)': r.insuranceCost || 0, 'Other Cost (Rs.)': r.otherCost || 0,
            'Total Cost (Rs.)': (r.electricalCost || 0) + (r.fabricationCost || 0) + (r.insuranceCost || 0) + (r.otherCost || 0),
            'Technician': r.technician, 'Parts Used': r.partsUsed, 'Description': r.description
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'MaintenanceDetails');
        XLSX.writeFile(workbook, 'MaintenanceDetails.xlsx');
    };

    const selectedVehicleObject = vehicles.find(v => v._id === formData.vehicle);
    const currentStation = selectedVehicleObject ? selectedVehicleObject.registeredCity : 'Select a Vehicle';
    const stationsForRegion = selectedRegion ? regions[selectedRegion] : allStations;

    // This correctly filters vehicles for the MAIN page filter dropdown
    const filteredVehicleOptions = selectedStation ? vehicles.filter(v => v.registeredCity === selectedStation) : (selectedRegion ? vehicles.filter(v => regions[selectedRegion].includes(v.registeredCity)) : vehicles);

    // This is the list for the MODAL dropdown. It starts with the filtered list.
    const modalVehicleOptions = [...filteredVehicleOptions];

    // If we're editing, ensure the vehicle being edited is in the list, even if it doesn't match the current filter.
    if (editingId && formData.vehicle) {
        const isVehicleInList = modalVehicleOptions.some(v => v._id === formData.vehicle);
        if (!isVehicleInList) {
            const vehicleToEdit = vehicles.find(v => v._id === formData.vehicle);
            if (vehicleToEdit) {
                modalVehicleOptions.unshift(vehicleToEdit); // Add it to the top of the list
            }
        }
    }

    const totalFormCost = (parseFloat(formData.electricalCost) || 0) + (parseFloat(formData.fabricationCost) || 0) + (parseFloat(formData.insuranceCost) || 0) + (parseFloat(formData.otherCost) || 0);

    return (
        <div className="p-6 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Maintenance & Repairs</h1>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm font-semibold">
                    <Plus className="h-5 w-5" /> Add Maintenance
                </button>
            </div>

            <div className="mb-6 flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <select value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); setSelectedStation(''); setSelectedVehicleFilter(''); }} className="px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"><option value="">All Regions</option>{Object.keys(regions).map(region => (<option key={region} value={region}>{region}</option>))}</select>
                <select value={selectedStation} onChange={(e) => { setSelectedStation(e.target.value); setSelectedVehicleFilter(''); }} className="px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"><option value="">All Stations</option>{stationsForRegion.map(station => (<option key={station} value={station}>{station}</option>))}</select>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"><option value="">All Categories</option>{maintenanceCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select>
                <select value={selectedVehicleFilter} onChange={(e) => setSelectedVehicleFilter(e.target.value)} className="px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"><option value="">All Vehicles</option>{filteredVehicleOptions.map(vehicle => (<option key={vehicle._id} value={vehicle._id}>{vehicle.callsign} - {vehicle.name}</option>))}</select>
                <button onClick={handleExportToExcel} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm font-semibold"><Download className="h-5 w-5" /> Export Excel</button>
            </div>

            <div className="bg-white rounded-lg shadow-md border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Vehicle</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Category</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Type</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Date In</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Status</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Electrical Cost</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Fabrication Cost</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Insurance Cost</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Other Cost</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Total Cost</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Technician</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y">
                            {filteredRecords.length > 0 ? filteredRecords.map((record) => {
                                const totalCost = (record.electricalCost || 0) + (record.fabricationCost || 0) + (record.insuranceCost || 0) + (record.otherCost || 0);
                                return (
                                    <tr key={record._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-800">{record.vehicle?.callsign || 'N/A'}</td>
                                        <td className="px-6 py-4 text-gray-600">{record.category}</td>
                                        <td className="px-6 py-4 text-gray-600">{record.type}</td>
                                        <td className="px-6 py-4 text-gray-600">{record.dateIn ? new Date(record.dateIn).toLocaleString() : 'N/A'}</td>
                                        <td className="px-6 py-4"><span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{record.status}</span></td>
                                        <td className="px-6 py-4 text-gray-600">Rs. {(record.electricalCost || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-gray-600">Rs. {(record.fabricationCost || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-gray-600">Rs. {(record.insuranceCost || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-gray-600">Rs. {(record.otherCost || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4 font-bold text-gray-800">Rs. {totalCost.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-gray-600">{record.technician || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <button onClick={() => handleEdit(record)} className="hover:text-indigo-600"><Edit className="h-5 w-5" /></button>
                                                <button onClick={() => handleDelete(record._id)} className="hover:text-red-600"><Trash2 className="h-5 w-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr><td colSpan="12" className="text-center py-10 text-gray-500">No maintenance records found for the selected criteria.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-8 w-full max-w-4xl shadow-xl max-h-[95vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-6 text-gray-800">{editingId ? 'Edit Maintenance Record' : 'Add Maintenance Record'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* --- THE ONLY CHANGE IS HERE --- */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                                    <select required name="vehicle" value={formData.vehicle} onChange={handleChange} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                        <option value="">Select a vehicle</option>
                                        {/* Use the filtered list for the modal */}
                                        {modalVehicleOptions.map((v) => (
                                            <option key={v._id} value={v._id}>{v.callsign} - {v.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* --- END OF CHANGE --- */}
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Station</label><input type="text" value={currentStation} readOnly disabled className="w-full px-3 py-2 border rounded-md bg-gray-100" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select name="category" required value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"><option value="">Select Category</option>{maintenanceCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select name="type" required value={formData.type} onChange={handleChange} disabled={!formData.category} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"><option value="">Select Type</option>{formData.category && maintenanceTypes[formData.category].map(type => (<option key={type} value={type}>{type}</option>))}</select></div>
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Details</label><input type="text" name="maintenanceDetails" value={formData.maintenanceDetails} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" /></div>
                            </div>
                            <hr />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date In</label><input type="date" name="dateIn" required value={formData.dateIn} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Time In</label><input type="time" name="timeIn" value={formData.timeIn} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" /></div>
                                <div className="md:col-start-1"><label className="block text-sm font-medium text-gray-700 mb-1">Date Out</label><input type="date" name="dateOut" value={formData.dateOut} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Time Out</label><input type="time" name="timeOut" value={formData.timeOut} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Remove Date</label><input type="date" name="removeDate" value={formData.removeDate} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border rounded-md"><option value="Scheduled">Scheduled</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option></select></div>
                            </div>
                            <hr />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Electrical Cost (Rs.)</label><input type="number" name="electricalCost" step="0.01" value={formData.electricalCost} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Fabrication Cost (Rs.)</label><input type="number" name="fabricationCost" step="0.01" value={formData.fabricationCost} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Insurance Cost (Rs.)</label><input type="number" name="insuranceCost" step="0.01" value={formData.insuranceCost} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Any Other Cost (Rs.)</label><input type="number" name="otherCost" step="0.01" value={formData.otherCost} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (Rs.)</label><input type="text" value={totalFormCost.toFixed(2)} readOnly disabled className="w-full px-3 py-2 border rounded-md bg-gray-100 font-bold" /></div>
                            </div>
                            <hr />
                            <div className="space-y-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Technician</label><input type="text" name="technician" value={formData.technician} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Parts Used</label><input type="text" name="partsUsed" value={formData.partsUsed} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" /></div>
                            </div>
                            <div className="flex gap-4 pt-4 mt-4 border-t">
                                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">{editingId ? 'Update Record' : 'Add Record'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}