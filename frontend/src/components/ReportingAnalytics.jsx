import { useState, useEffect } from 'react';
import { FileText, Car, Settings, Droplets, PieChart, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import api from '../api';

export default function ReportingAnalytics() {
    const [analytics, setAnalytics] = useState({ totalVehicles: 0, onRoadCount: 0, offRoadCount: 0, monthlyMaintenanceCost: 0, monthlyFuelCost: 0, monthlyInspections: 0 });
    const [documentList, setDocumentList] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                // This part fetches data for the top metric cards
                const [vehiclesRes, inspectionsRes, fuelRes, maintenanceRes] = await Promise.all([
                    api.get('/vehicles'),
                    api.get('/inspections'),
                    api.get('/fuel'),
                    api.get('/maintenance'),
                ]);

                const vehicles = vehiclesRes.data;
                const filteredInspections = inspectionsRes.data.filter(i => i.date && i.date.startsWith(selectedMonth));
                const filteredFuel = fuelRes.data.filter(f => f.date && f.date.startsWith(selectedMonth));
                const filteredMaintenance = maintenanceRes.data.filter(m => m.dateIn && m.dateIn.startsWith(selectedMonth));

                const monthlyMaintenanceCost = filteredMaintenance.reduce((sum, record) => sum + (record.electricalCost || 0) + (record.fabricationCost || 0) + (record.insuranceCost || 0) + (record.otherCost || 0), 0);
                const monthlyFuelCost = filteredFuel.reduce((sum, record) => sum + (record.amount_rs || 0), 0);

                const onRoadCount = vehicles.filter(v => v.status === 'OnRoad Fleet').length;
                const maintenanceCount = vehicles.filter(v => v.status === 'Mechanical Maintenance').length;
                const insuranceClaimCount = vehicles.filter(v => v.status === 'Insurance Claim').length;
                const offRoadCount = maintenanceCount + insuranceClaimCount;

                setAnalytics({
                    totalVehicles: vehicles.length,
                    onRoadCount,
                    offRoadCount,
                    monthlyMaintenanceCost,
                    monthlyFuelCost,
                    monthlyInspections: filteredInspections.length
                });

            } catch (error) {
                console.error('Error fetching analytics data:', error);
            }
        };

        const fetchDocumentList = async () => {
            try {
                // Fetch the list of filenames from our new backend endpoint
                const response = await api.get('/reports/available-documents');
                // Sort the list alphabetically for a consistent order
                setDocumentList(response.data.sort());
            } catch (error) {
                console.error('Error fetching document list:', error);
            }
        };

        fetchAnalyticsData();
        fetchDocumentList();
    }, [selectedMonth]);


    const metrics = [
        { title: 'Total Vehicles', value: analytics.totalVehicles, icon: Car },
        { title: 'On-Road Fleet', value: analytics.onRoadCount, icon: CheckCircle },
        { title: 'Off-Road Fleet', value: analytics.offRoadCount, icon: AlertTriangle },
        { title: 'Monthly Maintenance Cost', value: `Rs. ${analytics.monthlyMaintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: Settings },
        { title: 'Monthly Fuel Cost', value: `Rs. ${analytics.monthlyFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: Droplets },
        { title: 'Inspections This Month', value: analytics.monthlyInspections, icon: PieChart }
    ];

    // Helper function to make filenames more readable for the display title
    const formatFilename = (filename) => {
        const nameWithoutExtension = filename.substring(0, filename.lastIndexOf('.'));
        return nameWithoutExtension.replace(/-/g, ' '); // Replace dashes with spaces
    };

    // This function handles the download of a static file
    const handleDownload = (filename) => {
        const link = document.createElement('a');
        link.href = `/documents/${filename}`; // The path to the file in the `public` folder
        link.download = filename; // This sets the name of the downloaded file
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-gray-700" />
                    <h1 className="text-2xl font-bold text-gray-800">Reporting & Analytics</h1>
                </div>
                <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-white relative">
                    <span className="text-sm font-medium text-gray-600">{new Date(selectedMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="absolute opacity-0 w-full h-full top-0 left-0 cursor-pointer"
                    />
                </div>
            </div>

            {/* The top metric cards remain the same */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {metrics.map((metric, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm border p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm text-gray-500">{metric.title}</h3>
                            <div className="p-1.5 bg-gray-100 rounded-md">
                                <metric.icon className="h-5 w-5 text-gray-500" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                    </div>
                ))}
            </div>

            {/* The list of documents is now generated dynamically */}
            <div className="bg-white rounded-lg shadow-sm border mb-8">
                <div className="px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">Available Documents</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {documentList.length > 0 ? (
                        documentList.map((filename, index) => (
                            <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <FileText className="h-6 w-6 text-gray-400 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-medium text-gray-800">{formatFilename(filename)}</h3>
                                        <p className="text-xs text-gray-500">{filename}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDownload(filename)}
                                    className="inline-flex items-center justify-center px-4 py-2 font-semibold text-sm rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                                >
                                    Download
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="px-6 py-4 text-gray-500">Loading documents or no documents found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}