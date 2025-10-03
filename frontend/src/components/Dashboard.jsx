import { useState, useEffect } from 'react';
import { Car, CheckCircle, Settings, MapPin, AlertTriangle, Droplets, DollarSign, Zap, Download } from 'lucide-react';
import api from '../api';
import * as XLSX from 'xlsx'; // Import the xlsx library

const CustomDollarIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...props}>
        <g transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
            <circle cx="45.001" cy="47.211" r="42.791" style={{ fill: 'rgb(232,129,2)' }} />
            <circle cx="45" cy="42.79" r="35" style={{ fill: 'rgb(243,158,9)' }} />
            <path d="M 45 13.791 c 17.977 0 32.78 13.555 34.766 31 c 0.15 -1.313 0.234 -2.647 0.234 -4 c 0 -19.33 -15.67 -35 -35 -35 s -35 15.67 -35 35 c 0 1.353 0.085 2.687 0.234 4 C 12.22 27.346 27.023 13.791 45 13.791 z" style={{ fill: 'rgb(232,129,2)' }} />
            <path d="M 45 0 C 21.367 0 2.209 19.158 2.209 42.791 c 0 23.633 19.158 42.791 42.791 42.791 s 42.791 -19.158 42.791 -42.791 C 87.791 19.158 68.633 0 45 0 z M 45 75.928 c -18.301 0 -33.137 -14.836 -33.137 -33.137 C 11.863 24.49 26.699 9.653 45 9.653 S 78.137 24.49 78.137 42.791 C 78.137 61.092 63.301 75.928 45 75.928 z" style={{ fill: 'rgb(254,236,154)' }} />
            <path d="M 45 0 C 21.367 0 2.209 19.158 2.209 42.791 c 0 23.633 19.158 42.791 42.791 42.791 s 42.791 -19.158 42.791 -42.791 C 87.791 19.158 68.633 0 45 0 z M 45 75.928 c -18.301 0 -33.137 -14.836 -33.137 -33.137 C 11.863 24.49 26.699 9.653 45 9.653 S 78.137 24.49 78.137 42.791 C 78.137 61.092 63.301 75.928 45 75.928 z" style={{ fill: 'rgb(253,216,53)' }} />
            <path d="M 83.422 23.947 l -7.339 7.339 c 1.241 3.352 1.947 6.961 2.035 10.723 l 8.623 -8.623 C 85.999 30.079 84.88 26.916 83.422 23.947 z" style={{ fill: 'rgb(254,236,154)' }} />
            <path d="M 44.218 75.909 c -3.762 -0.087 -7.371 -0.794 -10.723 -2.035 l -7.339 7.339 c 2.969 1.459 6.132 2.578 9.439 3.32 L 44.218 75.909 z" style={{ fill: 'rgb(254,236,154)' }} />
            <path d="M 15.236 57.365 l -7.118 7.118 c 3.188 5.408 7.526 10.054 12.685 13.598 l 6.975 -6.975 C 22.396 67.826 18.027 63.053 15.236 57.365 z" style={{ fill: 'rgb(254,236,154)' }} />
            <path d="M 66.692 5.909 l -7.118 7.118 c 5.688 2.791 10.461 7.16 13.741 12.541 l 6.975 -6.975 C 76.745 13.435 72.1 9.097 66.692 5.909 z" style={{ fill: 'rgb(254,236,154)' }} />
            <path d="M 49.861 10.012 c 1.441 0.212 2.849 0.522 4.223 0.913 l 7.565 -7.565 c -1.224 -0.517 -2.478 -0.976 -3.756 -1.379 L 49.861 10.012 z" style={{ fill: 'rgb(254,236,154)' }} />
            <path d="M 5.569 59.44 l 7.565 -7.565 c -0.391 -1.374 -0.701 -2.782 -0.913 -4.223 L 4.19 55.683 C 4.593 56.962 5.052 58.216 5.569 59.44 z" style={{ fill: 'rgb(254,236,154)' }} />
            <path d="M 47.602 39.078 c 0 -5.998 -4.879 -10.877 -10.877 -10.877 h -8.726 c -1.657 0 -3 1.343 -3 3 v 15.755 c 0 0.009 0.003 0.018 0.003 0.027 c 0 0.009 -0.003 0.018 -0.003 0.027 v 15.755 c 0 1.657 1.343 3 3 3 s 3 -1.343 3 -3 V 49.956 h 0.004 l 11.219 14.634 c 0.591 0.771 1.482 1.175 2.383 1.175 c 0.637 0 1.279 -0.202 1.823 -0.619 c 1.314 -1.008 1.563 -2.892 0.556 -4.206 l -8.535 -11.133 C 43.628 48.976 47.602 44.488 47.602 39.078 z M 36.725 43.956 h -5.726 v -9.755 h 5.726 c 2.689 0 4.877 2.188 4.877 4.877 S 39.414 43.956 36.725 43.956 z" style={{ fill: 'rgb(232,129,2)' }} />
            <path d="M 66.405 54.851 c -0.977 -2.324 -3.009 -4.054 -5.587 -4.759 L 58.089 49.2 l -0.172 -0.051 c -0.791 -0.207 -1.416 -0.694 -1.672 -1.304 c -0.174 -0.413 -0.167 -0.83 0.018 -1.239 c 0.245 -0.542 0.776 -0.982 1.456 -1.21 c 1.393 -0.466 3.038 0.117 3.515 1.252 c 0.641 1.528 2.403 2.249 3.927 1.604 c 1.528 -0.641 2.246 -2.399 1.604 -3.927 c -1.709 -4.072 -6.519 -6.103 -10.95 -4.618 c -2.258 0.756 -4.087 2.369 -5.018 4.426 c -0.876 1.936 -0.905 4.08 -0.083 6.037 c 0.977 2.324 3.009 4.054 5.587 4.759 l 2.729 0.893 l 0.172 0.051 c 0.791 0.207 1.416 0.694 1.672 1.304 c 0.173 0.413 0.167 0.83 -0.019 1.239 c -0.245 0.542 -0.775 0.983 -1.455 1.211 c -1.399 0.469 -3.039 -0.118 -3.514 -1.252 c -0.643 -1.528 -2.403 -2.246 -3.928 -1.605 c -1.527 0.642 -2.246 2.4 -1.605 3.928 c 1.332 3.172 4.542 5.104 7.99 5.104 c 0.98 0 1.98 -0.156 2.962 -0.484 c 2.257 -0.756 4.086 -2.369 5.017 -4.427 C 67.198 58.953 67.227 56.808 66.405 54.851 z" style={{ fill: 'rgb(232,129,2)' }} />
            <path d="M 47.602 35.078 c 0 -5.998 -4.879 -10.877 -10.877 -10.877 h -8.726 c -1.657 0 -3 1.343 -3 3 v 15.755 c 0 0.009 0.003 0.018 0.003 0.027 c 0 0.009 -0.003 0.018 -0.003 0.027 v 15.755 c 0 1.657 1.343 3 3 3 s 3 -1.343 3 -3 V 45.956 h 0.004 l 11.219 14.634 c 0.591 0.771 1.482 1.175 2.383 1.175 c 0.637 0 1.279 -0.202 1.823 -0.619 c 1.314 -1.008 1.563 -2.892 0.556 -4.206 l -8.535 -11.133 C 43.628 44.976 47.602 40.488 47.602 35.078 z M 36.725 39.956 h -5.726 v -9.755 h 5.726 c 2.689 0 4.877 2.188 4.877 4.877 S 39.414 39.956 36.725 39.956 z" style={{ fill: 'rgb(253,216,53)' }} />
            <path d="M 66.405 50.851 c -0.977 -2.324 -3.009 -4.054 -5.587 -4.759 L 58.089 45.2 l -0.172 -0.051 c -0.791 -0.207 -1.416 -0.694 -1.672 -1.304 c -0.174 -0.413 -0.167 -0.83 0.018 -1.239 c 0.245 -0.542 0.776 -0.982 1.456 -1.21 c 1.393 -0.466 3.038 0.117 3.515 1.252 c 0.641 1.528 2.403 2.249 3.927 1.604 c 1.528 -0.641 2.246 -2.399 1.604 -3.927 c -1.709 -4.072 -6.519 -6.103 -10.95 -4.618 c -2.258 0.756 -4.087 2.369 -5.018 4.426 c -0.876 1.936 -0.905 4.08 -0.083 6.037 c 0.977 2.324 3.009 4.054 5.587 4.759 l 2.729 0.893 l 0.172 0.051 c 0.791 0.207 1.416 0.694 1.672 1.304 c 0.173 0.413 0.167 0.83 -0.019 1.239 c -0.245 0.542 -0.775 0.983 -1.455 1.211 c -1.399 0.469 -3.039 -0.118 -3.514 -1.252 c -0.643 -1.528 -2.403 -2.246 -3.928 -1.605 c -1.527 0.642 -2.246 2.4 -1.605 3.928 c 1.332 3.172 4.542 5.104 7.99 5.104 c 0.98 0 1.98 -0.156 2.962 -0.484 c 2.257 -0.756 4.086 -2.369 5.017 -4.427 C 67.198 54.953 67.227 52.808 66.405 50.851 z" style={{ fill: 'rgb(253,216,53)' }} />
        </g>
    </svg>
)
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
        // --- UPDATED: Reordered the array to match your request ---
        const sortOrder = ['Ambulances', 'TDP', 'Mortuary Van', 'Rapid Response Bike'];
        uniqueVehicles.sort((a, b) => {
            const indexA = sortOrder.indexOf(a.name);
            const indexB = sortOrder.indexOf(b.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(b.name);
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
                            // --- UPDATED: Logic to correctly calculate off-road count per vehicle type ---
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