import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Car, CheckCircle, Settings, MapPin, FileText,
    Menu, X, LogOut, Home, User
} from 'lucide-react';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const location = useLocation();
    const { logout, user } = useAuth();

    const menuItems = [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/vehicles', icon: Car, label: 'Vehicle  Profiles' },
        { path: '/inspections', icon: CheckCircle, label: 'Inspections' },
        { path: '/maintenance', icon: Settings, label: 'Maintenance' },
        { path: '/fueling', icon: MapPin, label: 'Fueling Details' },
        { path: '/tracking', icon: MapPin, label: 'Km Tracking' },
        { path: '/reports', icon: FileText, label: 'Reports' }
    ];

    return (
        <div className={`bg-white text-gray-800 border-r border-gray-200 ${isOpen ? 'w-64' : 'w-20'} transition-all duration-300 relative flex flex-col`}>
            <div className="p-4 border-b border-gray-200 h-20 flex items-center justify-between">
                {isOpen && <img src="/logo.png" alt="SIEHS Logo" className="h-12 w-auto" />}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                >
                    {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            <nav className="mt-6 flex-grow">
                <ul className="space-y-2 px-4">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`flex items-center p-3 rounded-lg hover:bg-green-50 hover:text-green-700 transition-colors ${location.pathname === item.path ? 'bg-green-600 text-white font-semibold shadow-md' : 'text-gray-500'}`}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className={`ml-4 ${!isOpen && 'hidden'}`}>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="w-full p-4 border-t border-gray-200">
                <div className={`flex items-center mb-4 ${!isOpen && 'justify-center'}`}>
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className={`ml-3 ${!isOpen && 'hidden'}`}>
                        <p className="font-semibold text-gray-800">{user?.username}</p>
                        <p className="text-sm text-green-600 capitalize">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className={`flex items-center w-full p-3 rounded-lg hover:bg-gray-100 hover:cursor-pointer transition-colors text-gray-500 ${!isOpen && 'justify-center'}`}
                >
                    <LogOut className="h-5 w-5" />
                    <span className={`ml-4 ${!isOpen && 'hidden'}`}>Logout</span>
                </button>
            </div>
        </div>
    )
}