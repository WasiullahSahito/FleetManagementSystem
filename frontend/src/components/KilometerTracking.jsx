import { useState, useEffect } from 'react';
import { MapPin, Car, TrendingUp, Settings, Wrench } from 'lucide-react';
import api from '../api';

export default function KilometerTracking() {
    const [allVehicles, setAllVehicles] = useState([]);
    const [stations, setStations] = useState([]);

    const [selectedStation, setSelectedStation] = useState('');
    const [callsignOptions, setCallsignOptions] = useState([]);
    const [selectedCallsign, setSelectedCallsign] = useState('');
    const [vehiclesToShow, setVehiclesToShow] = useState([]);

    useEffect(() => {
        fetchVehicles();
    }, []);

    useEffect(() => {
        let stationFilteredVehicles = allVehicles;
        if (selectedStation) {
            stationFilteredVehicles = allVehicles.filter(v => v.registeredCity === selectedStation);
        }
        setCallsignOptions(stationFilteredVehicles);

        let finalVehicles = stationFilteredVehicles;
        if (selectedCallsign) {
            finalVehicles = stationFilteredVehicles.filter(v => v._id === selectedCallsign);
        }

        // Only show vehicles if a station or a specific callsign is selected
        if (selectedStation || selectedCallsign) {
            setVehiclesToShow(finalVehicles);
        } else {
            setVehiclesToShow([]); // Show nothing by default
        }

    }, [selectedStation, selectedCallsign, allVehicles]);

    const fetchVehicles = async () => {
        try {
            const response = await api.get('/vehicles');
            const sortedVehicles = response.data.sort((a, b) => a.callsign.localeCompare(b.callsign));
            setAllVehicles(sortedVehicles);

            const uniqueStations = [...new Set(response.data.map(v => v.registeredCity).filter(Boolean))].sort();
            setStations(uniqueStations);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    const handleStationChange = (e) => {
        setSelectedStation(e.target.value);
        setSelectedCallsign(''); // Reset callsign when station changes
    };

    const handleCallsignChange = (e) => {
        setSelectedCallsign(e.target.value);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-full">
            <div className="flex items-center mb-8">
                <MapPin className="h-8 w-8 text-green-600 mr-3" />
                <h1 className="text-4xl font-bold text-gray-800">Kilometer Tracking</h1>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 max-w-sm">
                    <label htmlFor="station-select" className="block text-sm font-medium text-gray-700 mb-2">Select by Station</label>
                    <select
                        id="station-select"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        value={selectedStation}
                        onChange={handleStationChange}
                    >
                        <option value="">All Stations</option>
                        {stations.map(station => (
                            <option key={station} value={station}>{station}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 max-w-sm">
                    <label htmlFor="callsign-select" className="block text-sm font-medium text-gray-700 mb-2">Select by Callsign</label>
                    <select
                        id="callsign-select"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        value={selectedCallsign}
                        onChange={handleCallsignChange}
                    >
                        <option value="">All Callsigns</option>
                        {callsignOptions.map(vehicle => (
                            <option key={vehicle._id} value={vehicle._id}>{vehicle.callsign}</option>
                        ))}
                    </select>
                </div>
            </div>

            {vehiclesToShow.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehiclesToShow.map((vehicle) => (
                        <div key={vehicle._id} className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col transition-shadow hover:shadow-lg">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-20 h-16 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center border p-1">
                                    {vehicle.images?.main ? (
                                        <img
                                            src={`http://localhost:5000/${vehicle.images.main}`}
                                            alt={vehicle.callsign}
                                            className="w-full h-full object-contain rounded-sm"
                                        />
                                    ) : (
                                        <Car className="h-8 w-8 text-gray-300" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{vehicle.callsign}</h3>
                                    <p className="text-xs text-gray-500">{vehicle.name} ({vehicle.year})</p>
                                </div>
                            </div>

                            <div className="space-y-3 flex-grow">
                                <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-500">Current Mileage</span>
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {vehicle.mileage?.toLocaleString() || '0'} <span className="text-xl font-semibold text-gray-400">km</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="text-center p-2 bg-blue-50 rounded-md border border-blue-200">
                                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Settings size={12} /> Last PM</p>
                                        <p className="font-semibold text-base text-blue-800">
                                            {vehicle.lastService?.toLocaleString() || '0'} km
                                        </p>
                                    </div>
                                    <div className="text-center p-2 bg-orange-50 rounded-md border border-orange-200">
                                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Wrench size={12} /> Last Tire Change</p>
                                        <p className="font-semibold text-base text-orange-800">
                                            {vehicle.lastTireChangeActivity?.toLocaleString() || '0'} km
                                        </p>
                                    </div>
                                </div>
                                <div className="text-center p-2 bg-gray-100 rounded-md border border-gray-200">
                                    <p className="text-xs text-gray-500">Next PM Due</p>
                                    <p className="font-semibold text-base text-gray-700">
                                        {vehicle.nextService?.toLocaleString() || 'N/A'} km
                                    </p>
                                </div>

                                {vehicle.nextService && vehicle.mileage && vehicle.mileage >= vehicle.nextService && (
                                    <div className="bg-red-50 border border-red-200 rounded-md p-2">
                                        <p className="text-xs text-center text-red-800 font-medium">
                                            ⚠️ PM Due! This vehicle needs maintenance.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 text-center text-xs text-gray-400">
                                Mileage is updated automatically from Fueling Details.
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-lg shadow-sm border">
                    <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Vehicle to Display</h3>
                    <p className="text-gray-600">Please select a station or callsign to view tracking details.</p>
                </div>
            )}
        </div>
    )
}
