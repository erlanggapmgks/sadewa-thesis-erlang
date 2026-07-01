// Guards a route so only authenticated users with the correct role can access it.
// Unauthenticated users → redirected to /login
// Wrong role → redirected to their own dashboard
//
// Usage in routes/index.jsx:
//   <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
//     <CitizenLayout />
//   </ProtectedRoute>

import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { ROUTES } from './routes'

const ROLE_HOME = {
  citizen:     ROUTES.CITIZEN_DASHBOARD,
  admin:       ROUTES.ADMIN_DASHBOARD,
  kepala_desa: ROUTES.KADES_DASHBOARD,
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gray-500 text-sm">Memuat...</span>
      </div>
    )
  }

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={ROLE_HOME[role] ?? ROUTES.LOGIN} replace />
  }

  return children
}
