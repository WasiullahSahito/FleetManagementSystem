import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles = [] }) {
    const { user, loading } = useAuth()

    if (loading) return <div>Loading...</div>

    if (!user) return <Navigate to="/login" />

    if (roles.length > 0 && !roles.includes(user.role)) {
        return <div className="text-center p-8">Access denied</div>
    }

    return children
}
