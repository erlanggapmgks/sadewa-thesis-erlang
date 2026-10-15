// Lonceng notifikasi warga — tombol + dropdown daftar notif.
//
// Data berasal dari useNotifications (tabel `notifications` di Supabase yang
// diisi otomatis oleh trigger saat status surat berubah). Badge menampilkan
// jumlah belum dibaca yang SEBENARNYA; dropdown menampilkan daftar terbaru.
// Klik satu notif → tandai dibaca + arahkan ke halaman Lacak Permohonan.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routes'
import { useNotifications } from '../../hooks/useNotifications'
import { formatRelativeTime } from '../../utils/formatDate'

function BellIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  )
}

// Warna titik di kiri item sesuai status surat.
const STATUS_DOT = {
  pending:      '#eab308', // kuning
  kades_review: '#a855f7', // ungu
  signed:       '#10b981', // hijau
  approved:     '#22c55e',
  completed:    '#1e5fb8', // biru
  rejected:     '#ef4444', // merah
}

function dotColor(status) {
  return STATUS_DOT[status] ?? '#9ca3af'
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  // Tutup dropdown saat klik di luar atau tekan Escape.
  useEffect(() => {
    if (!open) return
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function handleItemClick(n) {
    if (!n.read) markRead(n.id)
    setOpen(false)
    navigate(ROUTES.CITIZEN_TRACK)
  }

  const badge = unreadCount > 9 ? '9+' : String(unreadCount)

  return (
    <div ref={wrapRef} className="relative hidden sm:block">
      {/* Tombol lonceng */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#f3f4f6] transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center shrink-0"
        aria-label={unreadCount > 0 ? `Notifikasi, ${unreadCount} belum dibaca` : 'Notifikasi'}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none"
            aria-hidden="true"
          >
            {badge}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-[#e5e7eb] shadow-lg overflow-hidden z-40"
          role="menu"
          aria-label="Daftar notifikasi"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f3f4f6]">
            <span className="font-semibold text-[14px] text-[#1a1a1a]">Notifikasi</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[12px] font-medium text-[#1e5fb8] hover:underline cursor-pointer border-0 bg-transparent p-0"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-[13px] text-[#9ca3af]">Memuat…</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-[13px] text-[#6b7280]">Belum ada notifikasi</p>
                <p className="text-[12px] text-[#9ca3af] mt-1">
                  Notifikasi akan muncul saat ada pembaruan status permohonan surat Anda.
                </p>
              </div>
            ) : (
              <ul className="list-none m-0 p-0">
                {items.map(n => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleItemClick(n)}
                      className="w-full text-left flex gap-3 px-4 py-3 cursor-pointer border-0 border-b border-[#f3f4f6] transition-colors hover:bg-[#f9fafb]"
                      style={{ background: n.read ? 'transparent' : 'rgba(30,95,184,0.04)' }}
                      role="menuitem"
                    >
                      <span
                        className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                        style={{ background: dotColor(n.status) }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={`text-[13px] truncate ${n.read ? 'font-medium text-[#374151]' : 'font-semibold text-[#1a1a1a]'}`}>
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-[#1e5fb8] shrink-0" aria-label="Belum dibaca" />
                          )}
                        </span>
                        {n.body && (
                          <span className="block text-[12px] text-[#6b7280] mt-0.5 line-clamp-2">
                            {n.body}
                          </span>
                        )}
                        <span className="block text-[11px] text-[#9ca3af] mt-1">
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
