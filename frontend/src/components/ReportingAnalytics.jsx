// src/components/ReportingAnalytics.jsx

import { useState, useEffect } from 'react';
import { FileText, Car, Settings, Droplets, PieChart, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import api from '../api';

export default function ReportingAnalytics() {
    // State for all data fetched from API
    const [allData, setAllData] = useState({ vehicles: [], inspections: [], fuel: [], maintenance: [] });
    // State for the calculated analytics based on the filter
    const [analytics, setAnalytics] = useState({
        totalVehicles: 0,
        onRoadCount: 0,
        offRoadCount: 0,
        monthlyMaintenanceCost: 0,
        monthlyFuelCost: 0,
        monthlyInspections: 0
    });
    // State for the month/year filter, defaults to current month
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    // --- Data Fetching Effect (runs once on component mount) ---
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [vehiclesRes, inspectionsRes, fuelRes, maintenanceRes] = await Promise.all([
                    api.get('/vehicles'),
                    api.get('/inspections'),
                    api.get('/fuel'),
                    api.get('/maintenance')
                ]);
                setAllData({
                    vehicles: vehiclesRes.data,
                    inspections: inspectionsRes.data,
                    fuel: fuelRes.data,
                    maintenance: maintenanceRes.data,
                });
            } catch (error) {
                console.error('Error fetching all analytics data:', error);
            }
        };
        fetchAllData();
    }, []);

    // --- Calculation Effect (runs when data or filter changes) ---
    useEffect(() => {
        // Guard clause: Don't run calculations if data hasn't been fetched yet.
        if (!allData.vehicles.length) return;

        const { vehicles, inspections, fuel, maintenance } = allData;

        // Filter date-sensitive data based on the selected month
        const filteredInspections = inspections.filter(i => i.date.startsWith(selectedMonth));
        const filteredFuel = fuel.filter(f => f.date.startsWith(selectedMonth));
        const filteredMaintenance = maintenance.filter(m => m.date.startsWith(selectedMonth));

        // Calculate monthly costs from filtered data
        const monthlyMaintenanceCost = filteredMaintenance.reduce((sum, record) => sum + (record.partsCost || 0) + (record.otherCost || 0), 0);
        const monthlyFuelCost = filteredFuel.reduce((sum, record) => sum + (record.amount_rs || 0), 0);

        // Vehicle status counts are always current, not dependent on the month filter
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
            monthlyInspections: filteredInspections.length,
        });
    }, [allData, selectedMonth]); // <-- This dependency array ensures the effect re-runs when the month changes


    const metrics = [
        { title: 'Total Vehicles', value: analytics.totalVehicles, icon: Car },
        { title: 'On-Road Fleet', value: analytics.onRoadCount, icon: CheckCircle },
        { title: 'Off-Road Fleet', value: analytics.offRoadCount, icon: AlertTriangle },
        { title: 'Monthly Maintenance Cost', value: `Rs. ${analytics.monthlyMaintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Settings },
        { title: 'Monthly Fuel Cost', value: `Rs. ${analytics.monthlyFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Droplets },
        { title: 'Inspections This Month', value: analytics.monthlyInspections, icon: PieChart }
    ];

    const availableReports = [
        { name: 'Daily Refueling Form', fileName: 'SIEHS-FT-F-01-Daily Refueling Form Issue 03.docx', period: 'Template' },
        { name: 'Body and Paint Request Form', fileName: 'SIEHS-FT-F-02- Body and Paint Request Form Issue 03.docx', period: 'Template' },
        { name: 'Fleet Evaluation Form', fileName: 'SIEHS-FT-F-03- Fleet Evaluation Form Issue 03.docx', period: 'Template' },
        { name: 'Fleet Evaluation Form part 2', fileName: 'SIEHS-FT-F-04-Fleet Evaluation Form part 2 Issue 03.docx', period: 'Template' },
        { name: 'Fleet Allocation', fileName: 'SIEHS-FT-F-05-Fleet Allocation Issue 03.docx', period: 'Template' },
        { name: 'HES Work Order', fileName: 'SIEHS-FT-F-08-HES Work Order Issue 08.docx', period: 'Template' },
        { name: 'Periodic Maintenance Checklist', fileName: 'SIEHS-FT-F-09-Periodic Maintenance Checklist Issue 03.xlsx', period: 'Template' },
        { name: 'Accident Report Format', fileName: 'SIEHS-FT-F-13-Accident Report Format Issue 02.docx', period: 'Template' },
        { name: 'Vehicle Job Card Record', fileName: 'SIEHS-FT-F-14-Vehicle Job Card Record Issue 03.docx', period: 'Template' },
        { name: 'Accident Report', fileName: 'SIEHS-FT-F-15-Accident Report Issue 02.docx', period: 'Template' },
        { name: 'Vehicle Log Book', fileName: 'SIEHS-FT-F-16-Vehicle Log Book.docx', period: 'Template' },
        { name: 'Repair maintenance Technician Register', fileName: 'SIEHS-FT-F-17-Repair maintenance Technician Register.docx', period: 'Template' },
        { name: 'Ambulance Maintenance', fileName: 'SIEHS-FT-SOP-01-Ambulance Maintenance Issue 04.docx', period: 'Template' },
        { name: 'Fleet Management Procedure', fileName: 'SIEHS-FT-SOP-02-Fleet Management Procedure Issue 04.docx', period: 'Template' },
        { name: 'KPIS of Fleet Department', fileName: 'SIEHS-FT-SOP-03 KPIS of Fleet Department Issue 03.docx', period: 'Template' },
        { name: 'Document Update Request', fileName: 'SIEHS-MR-F-03-Document Update Request Issue 02.docx', period: 'Template' },
        { name: 'Risk Opportunity Assessment Fleet', fileName: 'SIEHS-MR-F-13-Risk Opportunity Assessment Fleet Issue 04.docx', period: 'Template' },
        { name: 'Internal External Issues Fleet', fileName: 'SIEHS-MR-F-14-Internal External Issues Fleet Issue 04.docx', period: 'Template' },
        { name: 'Interested Parties Need Expectation Fleet', fileName: 'SIEHS-MR-F-15-Interested Parties Need Expectation Fleet Issue 04.docx', period: 'Template' },
        { name: 'Quality Objective of Fleet', fileName: 'SIEHS-MR-F-16-Quality Objective of Fleet Issue 04.docx', period: 'Template' },
    ];

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

            <div className="bg-white rounded-lg shadow-sm border mb-8">
                <div className="px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">Available Reports</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {availableReports.map((report, index) => (
                        <div key={index} className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <FileText className="h-6 w-6 text-gray-400" />
                                <div>
                                    <h3 className="font-medium text-gray-800">{report.name}</h3>
                                    <p className="text-sm text-gray-500">{report.period}</p>
                                </div>
                            </div>
                            <a
                                href={`/documents/${report.fileName}`}
                                download={report.fileName}
                                className="inline-flex items-center justify-center px-4 py-2 font-semibold text-sm rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                            >
                                Download
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}