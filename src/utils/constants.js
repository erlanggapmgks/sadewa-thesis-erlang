// App-wide constants used everywhere in the project.
// Add new document types, statuses, and roles here — not scattered in components.

export const APP_NAME = 'SADEWA'
export const APP_FULL_NAME = 'Sistem Administrasi Desa Wates'

// User roles — must match the "role" column value in Supabase's users table
export const ROLES = {
  CITIZEN: 'citizen',
  ADMIN: 'admin',
}

// Document types citizens can request
export const DOCUMENT_TYPES = {
  SURAT_KETERANGAN_DOMISILI: 'surat_keterangan_domisili',
  SURAT_PENGANTAR: 'surat_pengantar',
  SURAT_KETERANGAN_TIDAK_MAMPU: 'surat_keterangan_tidak_mampu',
  SURAT_KETERANGAN_USAHA: 'surat_keterangan_usaha',
  SURAT_KETERANGAN_KELAHIRAN: 'surat_keterangan_kelahiran',
  SURAT_KETERANGAN_KEMATIAN: 'surat_keterangan_kematian',
}

export const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_TYPES.SURAT_KETERANGAN_DOMISILI]: 'Surat Keterangan Domisili',
  [DOCUMENT_TYPES.SURAT_PENGANTAR]: 'Surat Pengantar',
  [DOCUMENT_TYPES.SURAT_KETERANGAN_TIDAK_MAMPU]: 'Surat Keterangan Tidak Mampu',
  [DOCUMENT_TYPES.SURAT_KETERANGAN_USAHA]: 'Surat Keterangan Usaha',
  [DOCUMENT_TYPES.SURAT_KETERANGAN_KELAHIRAN]: 'Surat Keterangan Kelahiran',
  [DOCUMENT_TYPES.SURAT_KETERANGAN_KEMATIAN]: 'Surat Keterangan Kematian',
}

// Request status flow: pending → approved / rejected → completed
export const REQUEST_STATUS = {
  PENDING:   'pending',
  APPROVED:  'approved',
  REJECTED:  'rejected',
  COMPLETED: 'completed',
}

export const REQUEST_STATUS_LABELS = {
  pending:   'Menunggu Tinjauan',
  approved:  'Disetujui',
  rejected:  'Ditolak',
  completed: 'Selesai',
}

// For displaying service_type from DB
export const SERVICE_TYPE_LABELS = {
  domisili:  'Surat Keterangan Domisili',
  pengantar: 'Surat Pengantar',
  sktm:      'Surat Keterangan Tidak Mampu',
  usaha:     'Surat Keterangan Usaha',
  kelahiran: 'Surat Keterangan Kelahiran',
  kematian:  'Surat Keterangan Kematian',
}
