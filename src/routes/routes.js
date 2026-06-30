// All route path strings in one place.
// Never hardcode paths like "/citizen/dashboard" inside components — import from here.
// This makes renaming a route a one-line change.

export const ROUTES = {
  // Public
  HOME: '/',
  VILLAGE_PROFILE: '/profil-desa',
  NEWS: '/berita',
  NEWS_DETAIL: '/berita/:id',
  CONTACT: '/kontak',
  LOGIN: '/login',
  REGISTER: '/register',

  // Citizen (Warga)
  CITIZEN_DASHBOARD: '/citizen/dashboard',
  CITIZEN_REQUEST: '/citizen/request',
  CITIZEN_TRACK: '/citizen/track',
  CITIZEN_PROFILE: '/citizen/profile',
  CITIZEN_LETTER_VIEW: '/citizen/requests/:id/surat',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_REQUESTS: '/admin/requests',
  ADMIN_REQUEST_DETAIL: '/admin/requests/:id',
  ADMIN_CITIZENS: '/admin/citizens',
  ADMIN_USERS: '/admin/users',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_LETTER_PRINT: '/admin/requests/:id/surat',

  // Fallback
  NOT_FOUND: '*',
}
