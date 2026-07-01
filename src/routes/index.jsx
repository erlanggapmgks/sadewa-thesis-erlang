// Master router — defines every URL in the app and which component renders for it.
// Each role group is wrapped in ProtectedRoute so only authorized users can enter.

import { createBrowserRouter } from 'react-router-dom'
import { ROUTES } from './routes'
import { ROLES } from '../utils/constants'
import ProtectedRoute from './ProtectedRoute'

// Layouts
import AuthLayout from '../layouts/AuthLayout'
import CitizenLayout from '../layouts/CitizenLayout'
import AdminLayout from '../layouts/AdminLayout'
import KadesLayout from '../layouts/KadesLayout'

// Auth pages
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'

// Citizen pages
import CitizenDashboard from '../pages/citizen/DashboardPage'
import CitizenRequest from '../pages/citizen/RequestDocumentPage'
import CitizenTrack from '../pages/citizen/TrackRequestPage'
import CitizenProfile from '../pages/citizen/ProfilePage'

// Kepala Desa pages
import KadesDashboard from '../pages/kades/DashboardPage'
import KadesRequests from '../pages/kades/RequestsPage'
import KadesRequestDetail from '../pages/kades/RequestDetailPage'

// Admin pages
import AdminDashboard from '../pages/admin/DashboardPage'
import AdminRequests from '../pages/admin/ManageRequestsPage'
import AdminRequestDetail from '../pages/admin/RequestDetailPage'
import AdminCitizens from '../pages/admin/CitizensPage'
import AdminUsers from '../pages/admin/ManageUsersPage'
import AdminSettings from '../pages/admin/SettingsPage'
import AdminReports from '../pages/admin/ReportingPage'
import LetterPrintPage from '../pages/admin/LetterPrintPage'

// Misc
import NotFoundPage from '../pages/NotFoundPage'
import VerifyLetterPage from '../pages/VerifyLetterPage'
import LandingPage from '../pages/LandingPage'
import VillageProfilePage from '../pages/VillageProfilePage'
import BeritaPage from '../pages/BeritaPage'
import BeritaDetailPage from '../pages/BeritaDetailPage'
import ContactPage from '../pages/ContactPage'

export const router = createBrowserRouter([
  // Public landing page
  { path: ROUTES.HOME, element: <LandingPage /> },
  { path: ROUTES.VILLAGE_PROFILE, element: <VillageProfilePage /> },
  { path: ROUTES.NEWS, element: <BeritaPage /> },
  { path: ROUTES.NEWS_DETAIL, element: <BeritaDetailPage /> },
  { path: ROUTES.CONTACT, element: <ContactPage /> },

  // Auth (login/register — no sidebar, centered layout)
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.REGISTER, element: <RegisterPage /> },
    ],
  },

  // Citizen routes
  {
    element: (
      <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
        <CitizenLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.CITIZEN_DASHBOARD, element: <CitizenDashboard /> },
      { path: ROUTES.CITIZEN_REQUEST, element: <CitizenRequest /> },
      { path: ROUTES.CITIZEN_TRACK, element: <CitizenTrack /> },
      { path: ROUTES.CITIZEN_PROFILE, element: <CitizenProfile /> },
    ],
  },

  // Admin routes
  {
    element: (
      <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.ADMIN_DASHBOARD, element: <AdminDashboard /> },
      { path: ROUTES.ADMIN_REQUESTS, element: <AdminRequests /> },
      { path: ROUTES.ADMIN_REQUEST_DETAIL, element: <AdminRequestDetail /> },
      { path: ROUTES.ADMIN_CITIZENS, element: <AdminCitizens /> },
      { path: ROUTES.ADMIN_USERS, element: <AdminUsers /> },
      { path: ROUTES.ADMIN_SETTINGS, element: <AdminSettings /> },
      { path: ROUTES.ADMIN_REPORTS,  element: <AdminReports /> },
    ],
  },

  // Kepala Desa routes
  {
    element: (
      <ProtectedRoute allowedRoles={[ROLES.KEPALA_DESA]}>
        <KadesLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.KADES_DASHBOARD,      element: <KadesDashboard /> },
      { path: ROUTES.KADES_REQUESTS,       element: <KadesRequests /> },
      { path: ROUTES.KADES_REQUEST_DETAIL, element: <KadesRequestDetail /> },
    ],
  },

  // Admin letter print — outside layout so printing is clean
  {
    path: ROUTES.ADMIN_LETTER_PRINT,
    element: (
      <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
        <LetterPrintPage />
      </ProtectedRoute>
    ),
  },

  // Citizen letter view — same component, citizen role, clean print
  {
    path: ROUTES.CITIZEN_LETTER_VIEW,
    element: (
      <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
        <LetterPrintPage />
      </ProtectedRoute>
    ),
  },

  // Verifikasi surat — publik, tanpa login
  { path: ROUTES.VERIFY_LETTER, element: <VerifyLetterPage /> },

  // 404
  { path: ROUTES.NOT_FOUND, element: <NotFoundPage /> },
])
