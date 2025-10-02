import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Download, Droplets, Upload } from 'lucide-react';
import api from '../api';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '/logo.png';

const FormInput = ({ label, name, type = 'text', required = false, value, onChange, readOnly = false }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            required={required}
            readOnly={readOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 read-only:bg-gray-100"
            value={value}
            onChange={onChange}
        />
    </div>
);

export default function FuelingDetails() {
    const [fuelingRecords, setFuelingRecords] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState('');
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        vehicle: '', date: new Date().toISOString().split('T')[0], amb_no: '', slip_no: '',
        current_refueling_km: '', total_km: '', tracker_verified_km: '', current_refueling_liters: '',
        rate: '', amount_rs: '', refueling_time: '',
        evo_emp_code: '', evo_name: '', sc_name: '', sc_name2: ''
    });

    useEffect(() => {
        fetchFuelingRecords();
        fetchVehicles();
    }, []);

    useEffect(() => {
        if (selectedStation) {
            setFilteredVehicles(vehicles.filter(v => v.registeredCity === selectedStation));
        } else {
            setFilteredVehicles(vehicles);
        }
        setSelectedVehicleFilter('');
    }, [selectedStation, vehicles]);

    useEffect(() => {
        let records = fuelingRecords;

        if (selectedMonth) {
            records = records.filter(record => record.date && record.date.startsWith(selectedMonth));
        }

        if (selectedStation) {
            const stationVehicleIds = vehicles
                .filter(v => v.registeredCity === selectedStation)
                .map(v => v._id);
            records = records.filter(record => stationVehicleIds.includes(record.vehicle?._id));
        }

        if (selectedVehicleFilter) {
            records = records.filter(record => record.vehicle?._id === selectedVehicleFilter);
        }

        setFilteredRecords(records);
    }, [selectedVehicleFilter, selectedStation, selectedMonth, fuelingRecords, vehicles]);

    const fetchFuelingRecords = async () => {
        try {
            const response = await api.get('/fuel');
            setFuelingRecords(response.data);
        } catch (error) {
            console.error('Error fetching fueling records:', error);
        }
    };

    const fetchVehicles = async () => {
        try {
            const response = await api.get('/vehicles');
            setVehicles(response.data);
            const uniqueStations = [...new Set(response.data.map(v => v.registeredCity).filter(Boolean))].sort();
            setStations(uniqueStations);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            vehicle: '', date: new Date().toISOString().split('T')[0], amb_no: '', slip_no: '',
            current_refueling_km: '', total_km: '', tracker_verified_km: '', current_refueling_liters: '',
            rate: '', amount_rs: '', refueling_time: '',
            evo_emp_code: '', evo_name: '', sc_name: '', sc_name2: ''
        });
        setEditingId(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'vehicle') {
            const selectedVehicle = vehicles.find(v => v._id === value);
            setFormData(prevData => ({
                ...prevData,
                vehicle: value,
                amb_no: selectedVehicle ? selectedVehicle.callsign : ''
            }));
        } else {
            setFormData(prevData => ({ ...prevData, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/fuel/${editingId}`, formData);
            } else {
                await api.post('/fuel', formData);
            }
            setShowModal(false);
            resetForm();
            fetchFuelingRecords();
        } catch (error) {
            console.error('Error saving fueling record:', error);
            alert(`Error: ${error.response?.data?.message || 'Could not save record.'}`);
        }
    };

    const handleEdit = (record) => {
        setEditingId(record._id);
        setFormData({
            vehicle: record.vehicle?._id || '',
            date: new Date(record.date).toISOString().split('T')[0],
            amb_no: record.amb_no || '',
            slip_no: record.slip_no || '',
            current_refueling_km: record.current_refueling_km || '',
            total_km: record.total_km || '',
            tracker_verified_km: record.tracker_verified_km || '',
            current_refueling_liters: record.current_refueling_liters || '',
            rate: record.rate || '',
            amount_rs: record.amount_rs || '',
            refueling_time: record.refueling_time || '',
            evo_emp_code: record.evo_emp_code || '',
            evo_name: record.evo_name || '',
            sc_name: record.sc_name || '',
            sc_name2: record.sc_name2 || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this fuel record?')) {
            try {
                await api.delete(`/fuel/${id}`);
                fetchFuelingRecords();
            } catch (error) {
                console.error('Error deleting fuel record:', error);
                alert('Failed to delete the record.');
            }
        }
    };

    const handleDownloadTemplate = () => {
        const headers = [
            'vehicleCallsign', 'date', 'slip_no', 'current_refueling_km', 'total_km',
            'tracker_verified_km', 'current_refueling_liters', 'rate', 'amount_rs',
            'refueling_time', 'evo_emp_code', 'evo_name', 'sc_name', 'sc_name2'
        ];
        const sampleData = [{
            vehicleCallsign: 'HY-999', date: '2023-10-26', slip_no: 'S-123',
            current_refueling_km: 50123, total_km: 350, tracker_verified_km: 348,
            current_refueling_liters: 30.5, rate: 290.97, amount_rs: 8874.58,
            refueling_time: '14:30', evo_emp_code: 'E101', evo_name: 'John Doe',
            sc_name: 'SC Name 1', sc_name2: 'SC Name 2'
        }];
        const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Fueling');
        XLSX.writeFile(wb, 'fueling_template.xlsx');
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
            const response = await api.post('/fuel/bulk-upload', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(response.data.message || 'Bulk upload successful!');
            setShowBulkModal(false);
            setUploadFile(null);
            fetchFuelingRecords();
        } catch (error) {
            console.error('Error during bulk upload:', error);
            alert(`Upload failed: ${error.response?.data?.message || 'An error occurred.'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleExportToExcel = () => {
        if (filteredRecords.length === 0) {
            alert('No data to export.');
            return;
        }
        const exportData = filteredRecords.map(record => ({
            'Date': new Date(record.date).toLocaleDateString(), 'Amb Sign #': record.amb_no, 'Slip #': record.slip_no,
            'Current Refueling KM': record.current_refueling_km, 'Total KM': record.total_km, 'Tracker Verified KM': record.tracker_verified_km,
            'Liters': record.current_refueling_liters, 'Rate (Rs.)': record.rate, 'Amount (Rs.)': record.amount_rs,
            'Time': record.refueling_time, 'EVO Code': record.evo_emp_code, 'EVO Name': record.evo_name,
            'SC Name': record.sc_name, 'SC Name 2': record.sc_name2,
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'FuelingDetails');
        worksheet['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
        const vehicle = vehicles.find(v => v._id === selectedVehicleFilter);
        const fileName = `fueling-details-${selectedStation || 'all-stations'}-${vehicle ? vehicle.callsign : 'all'}-${selectedMonth}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    const handleExportToPDF = () => {
        if (filteredRecords.length === 0) {
            alert('No data to export.');
            return;
        }
        const doc = new jsPDF({ orientation: 'landscape' });
        const vehicle = vehicles.find(v => v._id === selectedVehicleFilter);
        const title = `Fueling Details for ${selectedStation || 'All Stations'} (${selectedMonth})`;

        doc.addImage(logo, 'PNG', 15, 10, 45, 15);
        doc.setFontSize(20);
        doc.text(title, 70, 20);
        if (vehicle) {
            doc.setFontSize(12);
            doc.text(`Vehicle: ${vehicle.callsign}`, 70, 27);
        }

        const tableColumn = ["Date", "Amb #", "Slip #", "Refuel KM", "Total KM", "Tracker KM", "Liters", "Rate", "Amount", "Time", "EVO Code", "EVO Name", "SC Name", "SC Name2"];
        const tableRows = filteredRecords.map(record => [
            new Date(record.date).toLocaleDateString(), record.amb_no, record.slip_no,
            record.current_refueling_km, record.total_km, record.tracker_verified_km,
            record.current_refueling_liters, record.rate, record.amount_rs,
            record.refueling_time, record.evo_emp_code, record.evo_name, record.sc_name, record.sc_name2
        ]);

        autoTable(doc, {
            head: [tableColumn], body: tableRows, startY: 35, theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] }, styles: { fontSize: 8 },
        });

        const fileName = `fueling-details-${selectedStation || 'all-stations'}-${vehicle ? vehicle.callsign : 'all'}-${selectedMonth}.pdf`;
        doc.save(fileName);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Fueling Details</h1>
                <div className="flex items-center gap-2 flex-wrap">
                    <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" />
                    <select value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white">
                        <option value="">Select by Station</option>
                        {stations.map(station => (<option key={station} value={station}>{station}</option>))}
                    </select>
                    <select value={selectedVehicleFilter} onChange={(e) => setSelectedVehicleFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white" disabled={!selectedStation}>
                        <option value="">All Vehicles</option>
                        {filteredVehicles.map(vehicle => (<option key={vehicle._id} value={vehicle._id}>{vehicle.callsign} - {vehicle.name}</option>))}
                    </select>
                    <button onClick={() => setShowBulkModal(true)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 flex items-center gap-2 shadow-sm">
                        <Upload className="h-4 w-4" /> Bulk Upload
                    </button>
                    <button onClick={handleExportToExcel} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                        <Download className="h-4 w-4" /> Export Excel
                    </button>
                    <button onClick={handleExportToPDF} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 shadow-sm">
                        <Download className="h-4 w-4" /> Export PDF
                    </button>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm">
                        <Plus className="h-4 w-4" /> Add Record
                    </button>
                </div>
            </div>

            {selectedStation ? (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Amb #</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Slip #</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Refueling KM</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Total KM</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Tracker KM</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Liters</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">EVO Code</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">EVO Name</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">S.C Name</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">S.C Name2</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                                    <tr key={record._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap">{new Date(record.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-800">{record.amb_no}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{record.slip_no}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{record.current_refueling_km}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{record.total_km}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{record.tracker_verified_km}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{record.current_refueling_liters}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{record.rate}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{record.amount_rs}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{record.refueling_time}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{record.evo_emp_code}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{record.evo_name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{record.sc_name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{record.sc_name2}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEdit(record)} className="text-green-600 hover:text-green-800" title="Edit"><Edit className="h-4 w-4" /></button>
                                                <button onClick={() => handleDelete(record._id)} className="text-red-600 hover:text-red-800" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="15" className="text-center py-10 text-gray-500">No fueling records found for the selected criteria.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                    <Droplets className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Select Filters to View Data</h3>
                    <p className="mt-1 text-sm text-gray-500">Please select a station to view its fueling details for the chosen month.</p>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Fuel Record' : 'Add Fuel Record'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormInput label="Date" name="date" type="date" required value={formData.date} onChange={handleChange} />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                                    <select required name="vehicle" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" value={formData.vehicle} onChange={handleChange}>
                                        <option value="">Select a vehicle</option>
                                        {vehicles.map((vehicle) => (<option key={vehicle._id} value={vehicle._id}>{vehicle.callsign} - {vehicle.name}</option>))}
                                    </select>
                                </div>
                                <FormInput label="Amb Sign #" name="amb_no" value={formData.amb_no} onChange={handleChange} readOnly={true} />
                                <FormInput label="Slip #" name="slip_no" value={formData.slip_no} onChange={handleChange} />
                                <FormInput label="Current Refueling KM" name="current_refueling_km" type="number" value={formData.current_refueling_km} onChange={handleChange} />
                                <FormInput label="Total KM" name="total_km" type="number" value={formData.total_km} onChange={handleChange} />
                                <FormInput label="Tracker (Verified KM)" name="tracker_verified_km" type="number" value={formData.tracker_verified_km} onChange={handleChange} />
                                <FormInput label="Current Refueling Liters" name="current_refueling_liters" type="number" value={formData.current_refueling_liters} onChange={handleChange} />
                                <FormInput label="Rate per Liter" name="rate" type="number" value={formData.rate} onChange={handleChange} />
                                <FormInput label="Amount (in Rs.)" name="amount_rs" type="number" value={formData.amount_rs} onChange={handleChange} />
                                <FormInput label="Refueling Time" name="refueling_time" type="time" value={formData.refueling_time} onChange={handleChange} />
                                <FormInput label="EVO Emp. Code" name="evo_emp_code" value={formData.evo_emp_code} onChange={handleChange} />
                                <FormInput label="EVO Name" name="evo_name" value={formData.evo_name} onChange={handleChange} />
                                <FormInput label="S.C Name" name="sc_name" value={formData.sc_name} onChange={handleChange} />
                                <FormInput label="S.C Name 2" name="sc_name2" value={formData.sc_name2} onChange={handleChange} />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">{editingId ? 'Update Record' : 'Add Record'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showBulkModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-xl">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Bulk Upload Fueling Records</h2>
                        <p className="text-sm text-gray-600 mb-4">Upload an Excel file (.xlsx) with fueling data. The file must have a header row with the exact column names as in the template.</p>
                        <button onClick={handleDownloadTemplate} className="text-green-600 hover:text-green-800 text-sm font-semibold mb-4">Download Template File</button>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Excel File</label>
                            <input type="file" accept=".xlsx, .xls" onChange={(e) => setUploadFile(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                        </div>
                        <div className="flex gap-4 pt-6 mt-4 border-t">
                            <button type="button" onClick={() => setShowBulkModal(false)} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold">Cancel</button>
                            <button onClick={handleBulkUpload} disabled={isUploading} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-green-300">{isUploading ? 'Uploading...' : 'Upload File'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}