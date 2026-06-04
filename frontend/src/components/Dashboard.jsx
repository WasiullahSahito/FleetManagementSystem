import { useState, useEffect } from 'react';
import { Car, CheckCircle, Settings, MapPin, AlertTriangle, Droplets, Download } from 'lucide-react';
import api from '../api';
import * as XLSX from 'xlsx';

const customStyles = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .fade-in {
        animation: fadeIn 0.5s ease-out forwards;
    }
    .custom-scrollbar::-webkit-scrollbar {
        height: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: #f8fafc;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
    }
`;

export default function Dashboard() {
    const [data, setData] = useState({
        vehicles: [],
        fuelRecords: [],
        metrics: {
            totalVehicles: 0,
            onRoad: 0,
            offRoad: 0,
            maintenance: 0,
            insuranceClaim: 0,
        },
        fuelMetrics: {
            totalLiters: 0,
            totalCost: 0,
            avgCostPerKm: 0,
        },
        countsByName: {},
        countsByStatusAndName: {}
    });

    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [monthlyFuelAnalytics, setMonthlyFuelAnalytics] = useState({});
    const [monthlyMaintAnalytics, setMonthlyMaintAnalytics] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!data.vehicles.length) return;

        // Calculate Monthly Fuel Analytics
        const analytics = {};
        const uniqueVehicleTypes = getSortedUniqueVehicles();

        uniqueVehicleTypes.forEach(vehicleType => {
            const vehicleIdsForType = data.vehicles
                .filter(v => v.name === vehicleType.name)
                .map(v => v._id);

            const monthlyRecords = data.fuelRecords.filter(record => {
                const recordMonth = new Date(record.date).toISOString().slice(0, 7);
                const vehicleId = record.vehicle?._id || record.vehicle;
                return recordMonth === selectedMonth && vehicleIdsForType.includes(vehicleId);
            });

            const totalLiters = monthlyRecords.reduce((sum, record) => sum + (record.current_refueling_liters || 0), 0);
            const totalCost = monthlyRecords.reduce((sum, record) => sum + (record.amount_rs || 0), 0);
            const totalKm = monthlyRecords.reduce((sum, record) => sum + (record.total_km || 0), 0);
            const avgEfficiency = totalLiters > 0 ? (totalKm / totalLiters) : 0;
            const avgCost = totalKm > 0 ? (totalCost / totalKm) : 0;
            analytics[vehicleType.name] = { totalLiters, totalCost, avgEfficiency, avgCost };
        });
        setMonthlyFuelAnalytics(analytics);

        // Fetch Monthly Maintenance Report from API
        const fetchMaintenanceReport = async () => {
            try {
                setMonthlyMaintAnalytics(null); // Reset on fetch
                const reportRes = await api.post('/reports/generate/maintenance-costs', { month: selectedMonth });
                setMonthlyMaintAnalytics(reportRes.data.data);
            } catch (error) {
                console.error("Error fetching maintenance report:", error);
                setMonthlyMaintAnalytics({}); // Set to empty object on error to prevent crashes
            }
        };
        fetchMaintenanceReport();

    }, [data.vehicles, data.fuelRecords, selectedMonth]);


    const fetchData = async () => {
        try {
            const [vehiclesRes, fuelRes] = await Promise.all([
                api.get('/vehicles'),
                api.get('/fuel')
            ]);

            const vehicles = vehiclesRes.data;
            const fuelRecords = fuelRes.data;

            const totalLiters = fuelRecords.reduce((sum, record) => sum + (record.current_refueling_liters || 0), 0);
            const totalCost = fuelRecords.reduce((sum, record) => sum + (record.amount_rs || 0), 0);
            const totalKmTraveled = fuelRecords.reduce((sum, record) => sum + (record.total_km || 0), 0);
            const avgCostPerKm = totalKmTraveled > 0 ? (totalCost / totalKmTraveled) : 0;

            const countsByName = {};
            const countsByStatusAndName = {};
            vehicles.forEach(v => {
                const vehicleName = v.name;
                countsByName[vehicleName] = (countsByName[vehicleName] || 0) + 1;
                if (!countsByStatusAndName[vehicleName]) {
                    countsByStatusAndName[vehicleName] = { 'OnRoad Fleet': 0, 'OffRoad Fleet': 0, 'Mechanical Maintenance': 0, 'Insurance Claim': 0 };
                }
                if (countsByStatusAndName[vehicleName][v.status] !== undefined) {
                    countsByStatusAndName[vehicleName][v.status]++;
                }
            });

            const maintenanceCount = vehicles.filter(v => v.status === 'Mechanical Maintenance').length;
            const insuranceClaimCount = vehicles.filter(v => v.status === 'Insurance Claim').length;
            const offRoadFleetCount = vehicles.filter(v => v.status === 'OffRoad Fleet').length;


            setData({
                vehicles,
                fuelRecords,
                metrics: {
                    totalVehicles: vehicles.length,
                    onRoad: vehicles.filter(v => v.status === 'OnRoad Fleet').length,
                    offRoad: maintenanceCount + insuranceClaimCount + offRoadFleetCount,
                    maintenance: maintenanceCount,
                    insuranceClaim: insuranceClaimCount,
                },
                fuelMetrics: { totalLiters, totalCost, avgCostPerKm },
                countsByName, countsByStatusAndName
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const fleetMetrics = [
        { title: 'Total Fleet', value: data.metrics.totalVehicles, icon: Car, color: 'green' },
        { title: 'On-Road Fleet', value: data.metrics.onRoad, icon: CheckCircle, color: 'green' },
        { title: 'Off-Road Fleet', value: data.metrics.offRoad, icon: AlertTriangle, color: 'red' },
        { title: 'Mechanical Maintenance', value: data.metrics.maintenance, icon: Settings, color: 'yellow' },
        { title: 'Insurance Claim', value: data.metrics.insuranceClaim, icon: MapPin, color: 'purple' },
    ];

    const handleExportAnalyticsToExcel = () => {
        if (!monthlyMaintAnalytics || Object.keys(monthlyFuelAnalytics).length === 0) {
            alert('Analytics data is not yet available. Please wait a moment and try again.');
            return;
        }

        const vehiclesToExport = getSortedUniqueVehicles();

        const exportData = vehiclesToExport.map(vehicle => {
            const maintAnalytics = monthlyMaintAnalytics[vehicle.name] || {};
            const fuelAnalytics = monthlyFuelAnalytics[vehicle.name] || {};

            return {
                'Vehicle Type': vehicle.name,
                'Monthly Fueling (Liters)': (fuelAnalytics.totalLiters || 0).toFixed(2),
                'Monthly Fuel Cost (Rs.)': (fuelAnalytics.totalCost || 0).toLocaleString(),
                'Avg Efficiency (KM/L)': (fuelAnalytics.avgEfficiency || 0).toFixed(2),
                'Avg Cost per KM (Rs.)': (fuelAnalytics.avgCost || 0).toFixed(2),
                'Preventive Maint. Cost (Rs.)': (maintAnalytics.preventiveCost || 0).toLocaleString(),
                'Corrective Maint. Cost (Rs.)': (maintAnalytics.correctiveCost || 0).toLocaleString(),
                'Total Maint. Cost (Rs.)': (maintAnalytics.totalCost || 0).toLocaleString(),
                'Avg Maint. Cost per Vehicle (Rs.)': (maintAnalytics.avgCostPerVehicle || 0).toFixed(2),
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Analytics');

        const colWidths = [
            { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 },
            { wch: 30 }, { wch: 30 }, { wch: 25 }, { wch: 35 }
        ];
        worksheet['!cols'] = colWidths;

        const fileName = `Monthly_Analytics_${selectedMonth}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };


    const getSortedUniqueVehicles = () => {
        if (!data.vehicles || data.vehicles.length === 0) return [];
        const uniqueVehicles = [...new Map(data.vehicles.map(item => [item.name, item])).values()];

        // --- UPDATED: Reordered the array to match your specified order ---
        const sortOrder = ['Ambulance', 'Mortuary', 'TDP', 'Bike'];

        uniqueVehicles.sort((a, b) => {
            const indexA = sortOrder.indexOf(a.name);
            const indexB = sortOrder.indexOf(b.name);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Both are in the sort order
            if (indexA !== -1) return -1; // Only A is in the sort order, so it comes first
            if (indexB !== -1) return 1; // Only B is in the sort order, so it comes first
            return a.name.localeCompare(b.name); // Fallback for any other vehicle types
        });
        return uniqueVehicles;
    };

    const uniqueVehicleNames = getSortedUniqueVehicles();

    return (
        <>
            <style>{customStyles}</style>
            <div className="p-6 bg-gray-50 min-h-full">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
                </div>

                <div className="mb-8">
                    <h2 className="text-3xl font-semibold text-gray-800 mb-4">Fleet Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {fleetMetrics.map((metric, index) => (
                            <div key={index} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 transition-transform transform hover:-translate-y-1">
                                <div className={`flex-shrink-0 p-3.5 rounded-lg bg-${metric.color}-100`}><metric.icon className={`h-7 w-7 text-${metric.color}-600`} /></div>
                                <div>
                                    <p className="text-sm text-gray-500 font-bold">{metric.title}</p>
                                    <p className="text-3xl font-bold text-gray-800">{metric.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Fleet Vehicles</h2>
                    <div className="flex overflow-x-auto space-x-6 pb-4 custom-scrollbar">
                        {uniqueVehicleNames.map((vehicle) => {
                            const vehicleName = vehicle.name;
                            const nameCounts = data.countsByStatusAndName[vehicleName];
                            const offRoadCount = (nameCounts ? (nameCounts['OffRoad Fleet'] + nameCounts['Mechanical Maintenance'] + nameCounts['Insurance Claim']) : 0);

                            return (
                                <div key={vehicle.name} className="flex-none w-64 bg-white shadow rounded-lg overflow-hidden shrink-0">
                                    <div className="h-40 bg-gray-100 p-2 flex items-center justify-center">
                                        <img
                                            src={vehicle.images?.main ? `http://localhost:5000/${vehicle.images.main}` : '/vehicle/ambulance.png'}
                                            alt={vehicle.name}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-800 text-xl">{vehicle.name}</h3>
                                        <p className="text-sm text-green-600 font-bold">Total: {data.countsByName[vehicleName] || 0}</p>
                                        <hr className="my-3 border-gray-200" />
                                        {nameCounts && (
                                            <div className="text-sm space-y-2 text-gray-500">
                                                <p className="flex justify-between"><span>On-Road:</span><span className="font-bold text-green-600">{nameCounts['OnRoad Fleet']}</span></p>
                                                <p className="flex justify-between"><span>Off-Road:</span><span className="font-bold text-red-600">{offRoadCount}</span></p>
                                                <p className="flex justify-between"><span>Maintenance:</span><span className="font-bold text-yellow-600">{nameCounts['Mechanical Maintenance']}</span></p>
                                                <p className="flex justify-between"><span>Insurance:</span><span className="font-bold text-purple-600">{nameCounts['Insurance Claim']}</span></p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-semibold text-gray-800">Monthly Analytics</h2>
                        <div className="flex items-center gap-4">
                            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500" />
                            <button
                                onClick={handleExportAnalyticsToExcel}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
                            >
                                <Download className="h-4 w-4" />
                                Export Analytics
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Maintenance Cost Analytics</h3>
                        <div className="flex overflow-x-auto space-x-6 pb-4 custom-scrollbar">
                            {!monthlyMaintAnalytics ? (<p className="text-gray-500">Loading maintenance data...</p>) : (
                                uniqueVehicleNames.map((vehicle) => {
                                    const analytics = monthlyMaintAnalytics[vehicle.name] || {};
                                    const preventiveCost = analytics.preventiveCost || 0;
                                    const correctiveCost = analytics.correctiveCost || 0;
                                    const totalCost = analytics.totalCost || 0;
                                    const avgCost = analytics.avgCostPerVehicle || 0;

                                    return (
                                        <div key={`${vehicle.name}-maint`} className="flex-none w-72 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden shrink-0">
                                            <div className="h-40 bg-white p-2 flex items-center justify-center border-b border-gray-200">
                                                <img src={vehicle.images?.main ? `http://localhost:5000/${vehicle.images.main}` : '/vehicle/ambulance.png'} alt={vehicle.name} className="max-h-full max-w-full object-contain" />
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-xl text-gray-800 mb-4">{vehicle.name}</h3>
                                                <div className="space-y-2 text-sm text-gray-600">
                                                    <p className="flex justify-between"><span>Preventive Cost:</span><span className="font-medium text-gray-800">Rs. {preventiveCost.toLocaleString()}</span></p>
                                                    <p className="flex justify-between"><span>Corrective Cost:</span><span className="font-medium text-gray-800">Rs. {correctiveCost.toLocaleString()}</span></p>
                                                    <p className="flex justify-between mt-1">
                                                        <span className="font-bold">Total Cost:</span>
                                                        <span className="font-bold text-gray-800">Rs. {totalCost.toLocaleString()}</span>
                                                    </p>
                                                    <p className="flex justify-between"><span>Avg Cost/Vehicle:</span><span className="font-medium text-gray-800">Rs. {avgCost.toFixed(2)}</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Fuel Analytics</h3>
                        <div className="flex overflow-x-auto space-x-6 pb-4 custom-scrollbar">
                            {uniqueVehicleNames.map((vehicle) => {
                                const analytics = monthlyFuelAnalytics[vehicle.name] || { totalLiters: 0, totalCost: 0, avgEfficiency: 0, avgCost: 0 };
                                return (
                                    <div key={`${vehicle.name}-fuel`} className="flex-none w-64 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden shrink-0">
                                        <div className="h-40 bg-white p-2 flex items-center justify-center border-b border-gray-200"><img src={vehicle.images?.main ? `http://localhost:5000/${vehicle.images.main}` : '/vehicle/ambulance.png'} alt={vehicle.name} className="max-h-full max-w-full object-contain" /></div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-800 text-lg mb-1">{vehicle.name}</h3>
                                            <p className="text-sm text-gray-600 mb-3">Total: {data.countsByName[vehicle.name] || 0}</p>
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
                </div>
            </div>
        </>
    );
}