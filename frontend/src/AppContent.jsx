import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VehicleProfiles from './components/VehicleProfiles';
import InspectionManagement from './components/InspectionManagement';
import MaintenanceRepairs from './components/MaintainanceRepairs';
import FuelingDetails from './components/FuelingDetails';
import KilometerTracking from './components/KilometerTracking';
import ReportingAnalytics from './components/ReportingAnalytics';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import VehicleDetail from './components/VehicleDetail';

export default function AppContent() {
    const { user, loading } = useAuth();

    // Show a loading indicator while the auth status is being determined on app load.
    if (loading) {
        return <div className="flex h-screen items-center justify-center text-gray-500">Loading application...</div>;
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* The Sidebar will only be rendered if there's a logged-in user */}
            {user && <Sidebar />}

            <main className="flex-1 overflow-x-hidden overflow-y-auto">
                <Routes>
                    {/* Public routes that are available to everyone */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* All other routes are protected */}
                    <Route
                        path="/*"
                        element={
                            <ProtectedRoute>
                                {/* This nested Routes component will only be rendered if the user is authenticated */}
                                <Routes>
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/vehicles" element={<VehicleProfiles />} />
                                    <Route path="/vehicles/:id" element={<VehicleDetail />} />
                                    <Route path="/inspections" element={<InspectionManagement />} />
                                    <Route path="/maintenance" element={<MaintenanceRepairs />} />
                                    <Route path="/fueling" element={<FuelingDetails />} />
                                    <Route path="/tracking" element={<KilometerTracking />} />
                                    <Route path="/reports" element={<ReportingAnalytics />} />
                                    {/* A catch-all route to redirect any unknown protected paths back to the dashboard */}
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </main>
        </div>
    );
}