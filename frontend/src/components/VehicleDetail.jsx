import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Car, Calendar, MapPin, Gauge, Wrench, User, ArrowLeft, AlertTriangle, ShieldCheck, Tag, X } from 'lucide-react';
import api from '../api';

const diagramPaths = {
    ambulance: '/ambulance.jpeg',
    van: '/ambulance.jpeg',
    bike: '/bike.jpg',
    default: '/diagram-default.png'
};

const coordinateMaps = {
    ambulance: {
        'Front Bumper': { top: '85%', left: '68%' },
        'Hood': { top: '48%', left: '15%' },
        'Front Windshield': { top: '68%', left: '70%' },
        'Rear Bumper': { top: '85%', left: '90%' },
        'Rear Doors': { top: '72%', left: '91%' },
        'Rear Windows': { top: '66%', left: '91%' },
        'Driver Door': { top: '22%', left: '26%' },
        'Left Panel': { top: '22%', left: '42%' },
        'Front Left Tire': { top: '33%', left: '18%' },
        'Rear Left Tire': { top: '33%', left: '50%' },
        'Passenger Door': { top: '22%', left: '77%' },
        'Sliding Door': { top: '22%', left: '64%' },
        'Right Panel': { top: '22%', left: '88%' },
        'Front Right Tire': { top: '33%', left: '84%' },
        'Rear Right Tire': { top: '33%', left: '60%' },
        'Roof': { top: '48%', left: '35%' },
    },
    van: {
        'Front Bumper': { top: '85%', left: '68%' },
        'Rear Bumper': { top: '85%', left: '90%' },
        'Roof': { top: '48%', left: '30%' },
        'Hood': { top: '48%', left: '15%' },
        'Driver Door': { top: '22%', left: '26%' },
        'Passenger Door': { top: '22%', left: '77%' },
        'Sliding Door': { top: '22%', left: '64%' },
        'Front Windshield': { top: '68%', left: '70%' },
        'Rear Windows': { top: '66%', left: '91%' },
        'Left Panel': { top: '22%', left: '42%' },
        'Right Panel': { top: '22%', left: '88%' },
        'Front Left Tire': { top: '33%', left: '18%' },
        'Front Right Tire': { top: '33%', left: '84%' },
        'Rear Left Tire': { top: '33%', left: '50%' },
        'Rear Right Tire': { top: '33%', left: '60%' },
    },
    bike: {
        'Front Fender': { top: '30%', left: '18%' }, 'Rear Fender': { top: '30%', left: '50%' },
        'Fuel Tank': { top: '20%', left: '30%' }, 'Seat': { top: '20%', left: '40%' },
        'Handlebars': { top: '15%', left: '22%' }, 'Exhaust': { top: '35%', left: '45%' },
        'Front Wheel': { top: '33%', left: '18%' }, 'Rear Wheel': { top: '33%', left: '50%' },
    },
    default: {
        'Front': { top: '86%', left: '70%' }, 'Back': { top: '86%', left: '91%' },
        'Left Side': { top: '22%', left: '35%' }, 'Right Side': { top: '22%', left: '70%' },
        'Top': { top: '48%', left: '35%' },
    }
};

const getVehicleType = (vehicleName) => {
    const name = (vehicleName || '').toLowerCase();
    if (name.includes('ambulance')) return 'ambulance';
    if (name.includes('mortuary van')) return 'van';
    if (name.includes('bike')) return 'bike';
    return 'default';
};

const getRatingColor = (rating) => {
    if (rating >= 8) return 'text-green-500';
    if (rating >= 6) return 'text-yellow-500';
    return 'text-red-500';
};

const getScoreBarColor = (score) => {
    if (score >= 95) return 'bg-teal-500';
    if (score >= 85) return 'bg-orange-400';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
};

const DetailItem = ({ icon: Icon, label, value }) => (
    <div>
        <div className="flex items-center text-gray-400 text-sm mb-1">
            <Icon className="h-4 w-4 mr-2" />
            <span>{label}</span>
        </div>
        <p className="font-bold text-gray-800 text-base">{value || 'N/A'}</p>
    </div>
);

const ScoreBar = ({ category, score }) => {
    const barColorClass = getScoreBarColor(score);
    return (
        <div>
            <div className="flex justify-between items-center text-sm font-medium text-gray-700 mb-1">
                <span>{category}</span>
                <span className="text-gray-500">{score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className={`${barColorClass} h-1.5 rounded-full`} style={{ width: `${score}%` }}></div>
            </div>
        </div>
    );
};

const RatingCircle = ({ rating }) => {
    const radius = 54;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const progress = rating / 10;
    const offset = circumference * (1 - progress);
    const colorClass = getRatingColor(rating);

    return (
        <div className="relative flex items-center justify-center w-36 h-36">
            <svg className="w-full h-full transform -rotate-90">
                <circle className="text-gray-200" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx="72" cy="72" />
                <circle className={colorClass} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="72" cy="72" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-500">Overall Rating</span>
                <div className="flex items-baseline" style={{ lineHeight: '1' }}>
                    <span className={`text-3xl font-bold ${colorClass}`}>
                        {rating.toFixed(1)}
                    </span>
                    <span className="text-lg font-semibold text-gray-400">/10</span>
                </div>
            </div>
        </div>
    );
};

export default function VehicleDetail() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [damageFilter, setDamageFilter] = useState('All');
    const [filteredDamagePoints, setFilteredDamagePoints] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        const fetchVehicleData = async () => {
            try {
                const response = await api.get(`/vehicles/${id}`);
                setData(response.data);
            } catch (err) {
                setError('Failed to fetch vehicle data.');
            } finally {
                setLoading(false);
            }
        };
        fetchVehicleData();
    }, [id]);

    useEffect(() => {
        if (data && data.damagePoints) {
            if (damageFilter === 'All') {
                setFilteredDamagePoints(data.damagePoints);
            } else {
                setFilteredDamagePoints(data.damagePoints.filter(p => p.type === damageFilter));
            }
        }
    }, [data, damageFilter]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading vehicle details...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!data) return <div className="p-8 text-center text-gray-500">Vehicle not found.</div>;

    const vehicle = data;
    const inspections = vehicle.inspections || [];
    const latestInspection = inspections.length > 0 ? inspections[0] : null;
    const damagePoints = vehicle.damagePoints || [];
    const uniqueDamageTypes = ['All', ...new Set(damagePoints.map(p => p.type))];

    const vehicleType = getVehicleType(vehicle.name);
    const diagramSrc = diagramPaths[vehicleType];
    const coordinateMap = coordinateMaps[vehicleType];

    const getDamageMarkerStyle = (type) => {
        switch (type) {
            case 'D': return 'bg-red-600 border-red-800';
            case 'S': return 'bg-blue-500 border-blue-700 text-white';
            case 'B': return 'bg-orange-600 border-orange-800';
            default: return 'bg-green-500 border-green-700';
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 bg-gray-100 min-h-full flex justify-center">
            <div className="w-full max-w-6xl">
                <div className="mb-4">
                    <Link to="/vehicles" className="inline-flex items-center text-sm text-green-600 hover:text-green-700 hover:underline font-medium">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Vehicle Profiles
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow-lg border p-8">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-6 border-b">
                        <div className="flex items-center flex-grow">
                            <div className="w-48 h-32 bg-white rounded-lg flex items-center justify-center border mr-6 p-2 shadow-sm">
                                <img
                                    src={`http://localhost:5000/${vehicle.images.main}`}
                                    alt={vehicle.callsign}
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                                />
                                <div style={{ display: 'none' }} className="items-center justify-center w-full h-full">
                                    <Car className="h-20 w-20 text-gray-300" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">{vehicle.callsign}</h1>
                                <p className="text-gray-500 text-lg">{vehicle.name} - {vehicle.year} ({vehicle.model})</p>
                            </div>
                        </div>
                        <div className="mt-6 md:mt-0">
                            {latestInspection && latestInspection.overallRating != null ? (
                                <RatingCircle rating={latestInspection.overallRating} />
                            ) : (
                                <div className="text-center p-4 bg-gray-50 rounded-full border w-36 h-36 flex items-center justify-center">
                                    <p className="text-sm text-gray-500">No Rating</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6">Car Detail</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8">
                            <DetailItem icon={ShieldCheck} label="Ownership" value={vehicle.ownerName} />
                            <DetailItem icon={Wrench} label="Engine Capacity" value={vehicle.engineCapacity ? `${vehicle.engineCapacity} cc` : 'N/A'} />
                            <DetailItem icon={Gauge} label="Mileage" value={`${vehicle.mileage?.toLocaleString() || 0} km`} />
                            <DetailItem icon={Car} label="Fuel Type" value={vehicle.fuelType} />
                            <DetailItem icon={Calendar} label="Inspection Date" value={latestInspection ? new Date(latestInspection.date).toLocaleDateString() : 'N/A'} />
                            <DetailItem icon={Tag} label="Chassis No." value={vehicle.chassisNo} />
                            <DetailItem icon={Wrench} label="Engine No." value={vehicle.engineNo} />
                            <DetailItem icon={User} label="Registration No." value={vehicle.registrationNo} />
                            <DetailItem icon={MapPin} label="Location" value={latestInspection?.location} />
                            <DetailItem icon={MapPin} label="Registered City" value={vehicle.registeredCity} />
                            <DetailItem icon={Wrench} label="Transmission" value={vehicle.transmission} />
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-gray-800">Damage Report</h2>
                            {/* --- UPDATED: Show filter only if there are points to filter --- */}
                            {damagePoints.length > 0 && (
                                <div className="w-56">
                                    <label htmlFor="damage-filter" className="sr-only">Filter Damage</label>
                                    <select id="damage-filter" value={damageFilter} onChange={(e) => setDamageFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white">
                                        {uniqueDamageTypes.map(type => (
                                            <option key={type} value={type}>
                                                {type === 'All' ? 'Show All Damage' : `Show ${type} Only`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="relative w-full max-w-2xl mx-auto border rounded-lg p-2 bg-gray-50">
                                <img src={diagramSrc} className="w-full h-auto" alt={`${vehicle.name} Diagram`} />
                                {filteredDamagePoints.map((point, index) => {
                                    const coords = coordinateMap[point.location];
                                    if (!coords) return null;

                                    return (
                                        <div
                                            key={index}
                                            className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 cursor-pointer shadow-lg ${getDamageMarkerStyle(point.type)}`}
                                            style={{ top: coords.top, left: coords.left, transform: 'translate(-50%, -50%)' }}
                                            title={`${point.type}: ${point.location} - ${point.notes || 'No notes'}`}
                                        >
                                            {point.type}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8">
                                <h3 className="text-xl font-semibold text-gray-700 mb-4">Damage Images</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* --- UPDATED: Conditional rendering for when no damage exists --- */}
                                    {damagePoints.length > 0 ? (
                                        filteredDamagePoints.map((point, index) => (
                                            <div key={index} className="flex gap-5 items-center p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
                                                onClick={() => setPreviewImage(`http://localhost:5000/${point.imagePath}`)}>
                                                <div className="relative w-36 h-24 border rounded-md p-1 bg-white flex-shrink-0">
                                                    <img src={`http://localhost:5000/${point.imagePath}`} className="w-full h-full object-contain rounded" alt={point.location} />
                                                </div>
                                                <div className="flex flex-col items-start gap-1.5">
                                                    <p className="font-bold text-gray-800 text-lg">{point.location}</p>
                                                    {point.notes && (
                                                        <p className="text-sm text-gray-600 italic">{point.notes}</p>
                                                    )}
                                                    <div>
                                                        <span className={`px-3 py-1 text-xs font-bold text-white rounded-full ${getDamageMarkerStyle(point.type).split(' ')[0]}`}>
                                                            {point.type === 'D' ? 'Dent' : point.type === 'S' ? 'Scratch' : point.type === 'B' ? 'Broken' : 'OK'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="md:col-span-2 text-center p-8 bg-gray-50 rounded-lg border h-48 flex items-center justify-center">
                                            <ShieldCheck className="h-10 w-10 text-green-500 mb-2" />
                                            <p className="font-semibold text-lg text-gray-700 ml-3">No Damage Reported</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Inspection Scores</h2>
                        {latestInspection && latestInspection.checklist && latestInspection.checklist.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                                {latestInspection.checklist.map((item, index) => (
                                    <ScoreBar key={index} category={item.category} score={item.score} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-gray-50 rounded-lg flex items-center justify-center border">
                                <AlertTriangle className="h-5 w-5 mr-3 text-yellow-500" />
                                <p className="font-medium text-gray-700">No inspection scores found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {previewImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative bg-white p-2 rounded-lg shadow-xl max-w-4xl max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={previewImage}
                            alt="Damage preview"
                            className="max-w-full max-h-[85vh] object-contain"
                        />
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-4 -right-4 bg-white rounded-full p-1.5 text-gray-700 hover:text-black hover:scale-110 transition-transform shadow-lg"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}