import { useState, useEffect } from 'react';
import { Plus, CheckCircle, AlertCircle, Clock, Edit, Calendar, Trash2 } from 'lucide-react';
import api from '../api';

const checklistCategories = [
    'ENGINE/TRANSMISSION/CLUTCH', 'SUSPENSION/STEERING', 'BRAKES', 'INTERIOR',
    'AC/HEATER', 'ELECTRICAL & ELECTRONICS', 'EXTERIOR & BODY', 'TYRES', 'EMT CABIN CONDITION'
];

const maintenanceTypes = ['Preventive Maintenance', 'Corrective Maintenance', 'other'];

export default function InspectionManagement() {
    const [inspections, setInspections] = useState([])
    const [vehicles, setVehicles] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editingInspection, setEditingInspection] = useState(null)
    const [showScheduleModal, setShowScheduleModal] = useState(false)

    const [formData, setFormData] = useState({
        vehicle: '', date: new Date().toISOString().split('T')[0], status: 'Pending',
        technician: '', notes: '', overallRating: '', location: '', currentMeterReading: '',
        checklist: checklistCategories.reduce((acc, category) => ({ ...acc, [category]: '' }), {})
    })

    const [scheduleData, setScheduleData] = useState({
        vehicle: '', scheduledDate: '', technician: '', type: 'Preventive Maintenance'
    })

    useEffect(() => {
        fetchInspections()
        fetchVehicles()
    }, [])

    useEffect(() => {
        const calculateOverallRating = () => {
            const scores = Object.values(formData.checklist)
                .map(score => parseFloat(score))
                .filter(score => !isNaN(score) && score >= 0 && score <= 100);

            if (scores.length === 0) {
                setFormData(prev => ({ ...prev, overallRating: '' }));
                return;
            }

            const averagePercent = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            const ratingOutOfTen = (averagePercent / 10).toFixed(1);

            const newStatus = averagePercent >= 70 ? 'Passed' : 'Failed';

            setFormData(prev => ({
                ...prev,
                overallRating: ratingOutOfTen,
                status: prev.status === 'Scheduled' ? newStatus : prev.status
            }));
        };

        calculateOverallRating();
    }, [formData.checklist]);

    const fetchInspections = async () => {
        try {
            const response = await api.get('/inspections')
            setInspections(response.data)
        } catch (error) { console.error('Error fetching inspections:', error) }
    }

    const fetchVehicles = async () => {
        try {
            const response = await api.get('/vehicles')
            setVehicles(response.data)
        } catch (error) { console.error('Error fetching vehicles:', error) }
    }

    const resetForm = () => {
        setFormData({
            vehicle: '', date: new Date().toISOString().split('T')[0], status: 'Pending',
            technician: '', notes: '', overallRating: '', location: '', currentMeterReading: '',
            checklist: checklistCategories.reduce((acc, category) => ({ ...acc, [category]: '' }), {})
        })
        setEditingInspection(null)
    }

    const handleEdit = (inspection) => {
        const checklistForForm = checklistCategories.reduce((acc, category) => {
            const item = inspection.checklist?.find(c => c.category === category);
            return { ...acc, [category]: item ? item.score : '' };
        }, {});

        setFormData({
            vehicle: inspection.vehicle?._id || '',
            date: new Date(inspection.date).toISOString().split('T')[0],
            status: inspection.status === 'Scheduled' ? 'Pending' : inspection.status,
            technician: inspection.technician || '',
            notes: inspection.notes || '',
            overallRating: inspection.overallRating || '',
            location: inspection.location || '',
            currentMeterReading: inspection.currentMeterReading || '',
            checklist: checklistForForm
        })
        setEditingInspection(inspection)
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const checklistForApi = Object.entries(formData.checklist)
            .filter(([, score]) => score !== '' && !isNaN(parseFloat(score)))
            .map(([category, score]) => ({ category, score: parseFloat(score) }));

        const { checklist, ...restData } = formData;
        const apiPayload = {
            ...restData,
            checklist: checklistForApi,
            overallRating: formData.overallRating ? parseFloat(formData.overallRating) : undefined,
            currentMeterReading: formData.currentMeterReading ? parseFloat(formData.currentMeterReading) : undefined
        };

        try {
            if (editingInspection) {
                await api.put(`/inspections/${editingInspection._id}`, apiPayload)
            } else {
                await api.post('/inspections', apiPayload)
            }
            setShowModal(false); resetForm(); fetchInspections();
        } catch (error) { console.error('Error saving inspection:', error) }
    }

    const handleSchedule = async (e) => {
        e.preventDefault()
        try {
            await api.post('/inspections/schedule', scheduleData)
            setShowScheduleModal(false);
            setScheduleData({ vehicle: '', scheduledDate: '', technician: '', type: 'Preventive Maintenance' });
            fetchInspections();
        } catch (error) { console.error('Error scheduling inspection:', error) }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this inspection record?')) {
            try {
                await api.delete(`/inspections/${id}`);
                fetchInspections();
            } catch (error) {
                console.error("Error deleting inspection:", error);
                alert('Failed to delete inspection.');
            }
        }
    };


    const getStatusIcon = (status) => {
        switch (status) {
            case 'Passed': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'Failed': return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'Scheduled': return <Calendar className="h-5 w-5 text-blue-500" />;
            default: return <Clock className="h-5 w-5 text-yellow-500" />;
        }
    }

    return (
        <div className="p-6 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-gray-800">Inspection Management</h1>
                <div className="flex gap-3">
                    <button onClick={() => setShowScheduleModal(true)} className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm font-semibold">
                        <Calendar className="h-4 w-4" />Schedule
                    </button>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm font-semibold">
                        <Plus className="h-4 w-4" />Add Inspection
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                                <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                                <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {inspections.map((inspection) => (
                                <tr key={inspection._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800">{inspection.vehicle?.callsign || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{new Date(inspection.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            {getStatusIcon(inspection.status)}
                                            <span>{inspection.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{inspection.technician}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800">{inspection.overallRating ? `${inspection.overallRating}/10` : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleEdit(inspection)} className="p-2 text-gray-400 hover:text-green-600 transition-colors" title="Edit Inspection">
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleDelete(inspection._id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Delete Inspection">
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">{editingInspection ? 'Perform / Edit Inspection' : 'Add New Inspection'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                                    <select required className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" value={formData.vehicle} disabled={!!editingInspection}>
                                        <option value="">Select a vehicle</option>
                                        {vehicles.map((vehicle) => (<option key={vehicle._id} value={vehicle._id}>{vehicle.callsign}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-md" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Pending">Pending</option>
                                        <option value="Passed">Passed</option>
                                        <option value="Failed">Failed</option>
                                        <option value="Scheduled" disabled>Scheduled</option>
                                    </select>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Technician</label><input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md" value={formData.technician} onChange={(e) => setFormData({ ...formData, technician: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input type="text" placeholder="e.g., City Name" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Meter Reading (km)</label><input type="number" placeholder="e.g., 50123" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={formData.currentMeterReading} onChange={(e) => setFormData({ ...formData, currentMeterReading: e.target.value })} /></div>
                                <div className="md:col-span-2 lg:col-span-3"><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
                            </div>
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-medium mb-4">Detailed Scores</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {checklistCategories.map(category => (
                                        <div key={category}><label className="block text-sm font-medium text-gray-700 mb-1 truncate" title={category}>{category}</label><input type="number" min="0" max="100" placeholder="Score %" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={formData.checklist[category]} onChange={(e) => setFormData({ ...formData, checklist: { ...formData.checklist, [category]: e.target.value } })} /></div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6 mt-4 border-t"><button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold">Cancel</button><button type="submit" className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">{editingInspection ? 'Update Inspection' : 'Add Inspection'}</button></div>
                        </form>
                    </div>
                </div>)}

            {showScheduleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-xl">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Schedule Inspection</h2>
                        <form onSubmit={handleSchedule} className="space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label><select required className="w-full px-3 py-2 border border-gray-300 rounded-md" value={scheduleData.vehicle} onChange={(e) => setScheduleData({ ...scheduleData, vehicle: e.target.value })}><option value="">Select a vehicle</option>{vehicles.map((vehicle) => (<option key={vehicle._id} value={vehicle._id}>{vehicle.callsign}</option>))}</select></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label><input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-md" value={scheduleData.scheduledDate} onChange={(e) => setScheduleData({ ...scheduleData, scheduledDate: e.target.value })} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Technician</label><input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md" value={scheduleData.technician} onChange={(e) => setScheduleData({ ...scheduleData, technician: e.target.value })} /></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={scheduleData.type} onChange={(e) => setScheduleData({ ...scheduleData, type: e.target.value })}>
                                    {maintenanceTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-6 mt-4 border-t"><button type="button" onClick={() => setShowScheduleModal(false)} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold">Cancel</button><button type="submit" className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Schedule</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}