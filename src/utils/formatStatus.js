// Converts raw database status values into human-readable labels and Tailwind color classes.
// Centralizing this here means you only update status display in one place.

import { REQUEST_STATUS } from './constants'

const STATUS_CONFIG = {
  [REQUEST_STATUS.PENDING]: {
    label: 'Menunggu',
    color: 'bg-yellow-100 text-yellow-800',
  },
  [REQUEST_STATUS.KADES_REVIEW]: {
    label: 'Menunggu TTD Kades',
    color: 'bg-purple-100 text-purple-800',
  },
  [REQUEST_STATUS.SIGNED]: {
    label: 'Sudah Ditandatangani',
    color: 'bg-emerald-100 text-emerald-800',
  },
  [REQUEST_STATUS.APPROVED]: {
    label: 'Disetujui',
    color: 'bg-green-100 text-green-800',
  },
  [REQUEST_STATUS.REJECTED]: {
    label: 'Ditolak',
    color: 'bg-red-100 text-red-800',
  },
  [REQUEST_STATUS.COMPLETED]: {
    label: 'Selesai',
    color: 'bg-gray-100 text-gray-800',
  },
}

export function getStatusLabel(status) {
  return STATUS_CONFIG[status]?.label ?? status
}

export function getStatusColor(status) {
  return STATUS_CONFIG[status]?.color ?? 'bg-gray-100 text-gray-800'
}

export function getStatusConfig(status) {
  return STATUS_CONFIG[status] ?? { label: status, color: 'bg-gray-100 text-gray-800' }
}
