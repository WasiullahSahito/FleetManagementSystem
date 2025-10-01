// src/components/ReportingAnalytics.jsx

import { useState, useEffect } from 'react';
import { FileText, Car, Settings, Droplets, PieChart, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import api from '../api';

// Import libraries for DOCX generation
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

// --- FINAL, ROBUST VERSION: Generic DOCX Generation Helper Function ---
const generateDocx = async (templateName, data, outputFileName) => {
    try {
        const response = await fetch(`/templates/${templateName}`);

        // ** THIS IS THE FIX **
        // First check: Was the request successful?
        if (!response.ok) {
            throw new Error(`Network response was not ok. Template file not found at "/public/templates/${templateName}".`);
        }

        // Second check: Is the file actually a DOCX file and not a fallback HTML page?
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
            // This condition is often met in SPAs where a non-existent path returns index.html with a 200 OK status.
            throw new Error(`Incorrect file type received. Expected a DOCX file but got ${contentType}. Please ensure the file exists at "/public/templates/${templateName}".`);
        }

        const content = await response.arrayBuffer();

        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

        doc.setData(data);
        doc.render();

        const out = doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        saveAs(out, outputFileName);
    } catch (error) {
        console.error(`Error generating DOCX for ${templateName}:`, error);
        alert(`Failed to generate report: ${error.message}. Check console for details.`);
    }
};


export default function ReportingAnalytics() {
    const [allData, setAllData] = useState({ vehicles: [], inspections: [], fuel: [], maintenance: [], accidents: [] });
    const [analytics, setAnalytics] = useState({ totalVehicles: 0, onRoadCount: 0, offRoadCount: 0, monthlyMaintenanceCost: 0, monthlyFuelCost: 0, monthlyInspections: 0 });
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [vehiclesRes, inspectionsRes, fuelRes, maintenanceRes, accidentsRes] = await Promise.all([
                    api.get('/vehicles'),
                    api.get('/inspections'),
                    api.get('/fuel'),
                    api.get('/maintenance'),
                    api.get('/accidents')
                ]);
                setAllData({
                    vehicles: vehiclesRes.data,
                    inspections: inspectionsRes.data,
                    fuel: fuelRes.data,
                    maintenance: maintenanceRes.data,
                    accidents: accidentsRes.data,
                });
            } catch (error) {
                console.error('Error fetching all analytics data:', error);
            }
        };
        fetchAllData();
    }, []);

    useEffect(() => {
        if (!allData.vehicles.length) return;
        const { vehicles, inspections, fuel, maintenance } = allData;
        const filteredInspections = inspections.filter(i => i.date && i.date.startsWith(selectedMonth));
        const filteredFuel = fuel.filter(f => f.date && f.date.startsWith(selectedMonth));
        const filteredMaintenance = maintenance.filter(m => m.dateIn && m.dateIn.startsWith(selectedMonth));
        const monthlyMaintenanceCost = filteredMaintenance.reduce((sum, record) => sum + (record.electricalCost || 0) + (record.fabricationCost || 0) + (record.insuranceCost || 0) + (record.otherCost || 0), 0);
        const monthlyFuelCost = filteredFuel.reduce((sum, record) => sum + (record.amount_rs || 0), 0);
        const onRoadCount = vehicles.filter(v => v.status === 'OnRoad Fleet').length;
        const maintenanceCount = vehicles.filter(v => v.status === 'Mechanical Maintenance').length;
        const insuranceClaimCount = vehicles.filter(v => v.status === 'Insurance Claim').length;
        const offRoadCount = maintenanceCount + insuranceClaimCount;
        setAnalytics({ totalVehicles: vehicles.length, onRoadCount, offRoadCount, monthlyMaintenanceCost, monthlyFuelCost, monthlyInspections: filteredInspections.length });
    }, [allData, selectedMonth]);

    const metrics = [
        { title: 'Total Vehicles', value: analytics.totalVehicles, icon: Car },
        { title: 'On-Road Fleet', value: analytics.onRoadCount, icon: CheckCircle },
        { title: 'Off-Road Fleet', value: analytics.offRoadCount, icon: AlertTriangle },
        { title: 'Monthly Maintenance Cost', value: `Rs. ${analytics.monthlyMaintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: Settings },
        { title: 'Monthly Fuel Cost', value: `Rs. ${analytics.monthlyFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: Droplets },
        { title: 'Inspections This Month', value: analytics.monthlyInspections, icon: PieChart }
    ];

    const availableReports = [
        { name: 'Daily Refueling Form', type: 'dynamic', template: 'refueling_template.docx', fileName: 'SIEHS-FT-F-01-Daily Refueling Form Issue 03.docx' },
        { name: 'Body and Paint Request Form', type: 'static', fileName: 'SIEHS-FT-F-02- Body and Paint Request Form Issue 03.docx' },
        { name: 'Fleet Evaluation Form part 2', type: 'dynamic', template: 'evaluation_summary_template.docx', fileName: 'SIEHS-FT-F-04-Fleet Evaluation Form part 2 Issue 03.docx' },
        { name: 'Fleet Allocation', type: 'dynamic', template: 'fleet_allocation_template.docx', fileName: 'SIEHS-FT-F-05-Fleet Allocation Issue 03.docx' },
        { name: 'Accident Report Format', type: 'dynamic', template: 'accident_summary_template.docx', fileName: 'SIEHS-FT-F-13-Accident Report Format Issue 02.docx' },
        { name: 'Repair maintenance Technician Register', type: 'dynamic', template: 'maintenance_register_template.docx', fileName: 'SIEHS-FT-F-17-Repair maintenance Technician Register.docx' },
        { name: 'HES Work Order', type: 'static', fileName: 'SIEHS-FT-F-08-HES Work Order Issue 08.docx' },
        { name: 'Vehicle Job Card Record', type: 'static', fileName: 'SIEHS-FT-F-14-Vehicle Job Card Record Issue 03.docx' },
    ];

    const handleDownload = async (report) => {
        const monthName = new Date(selectedMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });

        if (report.type === 'static') {
            const link = document.createElement('a');
            link.href = `/documents/${report.fileName}`;
            link.download = report.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        let data;
        let filteredData;

        switch (report.template) {
            case 'refueling_template.docx':
                filteredData = allData.fuel.filter(f => f.date && f.date.startsWith(selectedMonth));
                if (filteredData.length === 0) return alert(`No refueling data for ${monthName}`);
                data = {
                    date: new Date().toLocaleDateString(), station_name: 'All Stations',
                    records: filteredData.map((r, i) => ({
                        sr_no: i + 1, amb_sign: r.amb_no || '', slip_no: r.slip_no || '',
                        reg_no: allData.vehicles.find(v => v._id === r.vehicle?._id)?.registrationNo || '',
                        current_refueling_km: r.current_refueling_km || '', tracker_verified_km: r.tracker_verified_km || '',
                        difference: (r.current_refueling_km || 0) - (r.tracker_verified_km || 0),
                        liters: r.current_refueling_liters || '',
                        avg: (r.total_km && r.current_refueling_liters) ? (r.total_km / r.current_refueling_liters).toFixed(2) : '0.00',
                        rate: r.rate || '', amount: r.amount_rs || '', time: r.refueling_time || '',
                        evo_code: r.evo_emp_code || '', evo_name: r.evo_name || '',
                    }))
                };
                break;

            case 'evaluation_summary_template.docx':
                filteredData = allData.inspections.filter(i => i.date && i.date.startsWith(selectedMonth));
                if (filteredData.length === 0) return alert(`No evaluation data for ${monthName}`);
                data = {
                    period: monthName,
                    evaluations: filteredData.map((i, idx) => ({
                        s_no: idx + 1, amb_sign: i.vehicle.callsign,
                        odometer: i.currentMeterReading || 'N/A',
                        make: allData.vehicles.find(v => v._id === i.vehicle._id)?.model || '',
                        score_b: i.overallRating < 4 ? (i.overallRating * 10).toFixed(1) : '',
                        score_a: i.overallRating >= 4 && i.overallRating <= 7 ? (i.overallRating * 10).toFixed(1) : '',
                        score_g: i.overallRating > 7 ? (i.overallRating * 10).toFixed(1) : '',
                        inspection_date: new Date(i.date).toLocaleDateString(),
                        recommendation: i.notes || '',
                    }))
                };
                break;

            case 'fleet_allocation_template.docx':
                const stations = [...new Set(allData.vehicles.map(v => v.registeredCity).filter(Boolean))];
                data = {
                    month: monthName, region: 'All Regions',
                    stations: stations.map((station, i) => {
                        const stationVehicles = allData.vehicles.filter(v => v.registeredCity === station);
                        return {
                            sr_no: i + 1, station_name: station, total_amb: stationVehicles.length,
                            toyota_amb: stationVehicles.filter(v => v.model.toLowerCase().includes('toyota')).length,
                            other_amb: stationVehicles.filter(v => !v.model.toLowerCase().includes('toyota')).length,
                            backup_amb: 0,
                        }
                    })
                };
                break;

            case 'accident_summary_template.docx':
                filteredData = allData.accidents.filter(a => a.accidentDate && a.accidentDate.startsWith(selectedMonth));
                if (filteredData.length === 0) return alert(`No accident data for ${monthName}`);
                data = {
                    month: monthName,
                    accidents: filteredData.map((a, i) => ({
                        s_no: i + 1, hes_no: a._id.slice(-6).toUpperCase(),
                        call_sign: a.vehicle?.callsign, reg_no: a.vehicle?.registrationNo,
                        make: a.vehicle?.model, station: a.vehicle?.registeredCity,
                        date: new Date(a.accidentDate).toLocaleDateString(), time: a.accidentTime || '',
                        location: a.location || '', details: a.details || '',
                        driver_name: a.driverName || '', emp_id: a.driverEmpId || '',
                    }))
                };
                break;

            case 'maintenance_register_template.docx':
                filteredData = allData.maintenance.filter(m => m.dateIn && m.dateIn.startsWith(selectedMonth));
                if (filteredData.length === 0) return alert(`No maintenance data for ${monthName}`);
                data = {
                    jobs: filteredData.map((m, i) => ({
                        sr_no: i + 1, amb_no: m.vehicle?.callsign, category: m.category,
                        hes_wo: '', odo_meter: allData.vehicles.find(v => v._id === m.vehicle?._id)?.mileage || '',
                        station: m.vehicle?.registeredCity, workshop_name: 'SIEHS Workshop',
                        breakdown_date: new Date(m.dateIn).toLocaleString(),
                        in_date: new Date(m.dateIn).toLocaleString(),
                        out_date: m.dateOut ? new Date(m.dateOut).toLocaleString() : 'In Progress',
                        problem: m.description,
                    }))
                };
                break;

            default:
                alert('This report template has not been configured yet.');
                return;
        }

        generateDocx(report.template, data, report.fileName);
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
                                    <p className="text-sm text-gray-500">
                                        {report.type === 'dynamic' ? 'Monthly Report' : 'Template'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDownload(report)}
                                className="inline-flex items-center justify-center px-4 py-2 font-semibold text-sm rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                            >
                                Download
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}