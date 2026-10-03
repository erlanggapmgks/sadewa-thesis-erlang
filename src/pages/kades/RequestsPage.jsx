import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routes'
import { supabase } from '../../services/supabase'
import { getKadesRequests, hideRequestForKades, hideRequestsForKades } from '../../services/documentService'
import { formatDate } from '../../utils/formatDate'
import { SERVICE_TYPE_LABELS } from '../../utils/constants'

const HERO_GRADIENT = '#1e5fb8'
const CARD_SHADOW = { boxShadow: '0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)' }

const STATUS_MAP = {
  kades_review: { bg: 'rgba(30,95,184,0.1)',  text: '#1e5fb8', label: 'Menunggu TTD' },
  signed:       { bg: 'rgba(22,163,114,0.1)',  text: '#16a372', label: 'Sudah Ditandatangani' },
  rejected:     { bg: 'rgba(239,68,68,0.1)',   text: '#ef4444', label: 'Ditolak' },
  completed:    { bg: 'rgba(22,163,114,0.1)',  text: '#16a372', label: 'Sudah Ditandatangani' },
}

const FILTER_OPTIONS = [
  { value: 'semua',        label: 'Semua Status' },
  { value: 'kades_review', label: 'Menunggu TTD' },
  { value: 'signed',       label: 'Sudah Ditandatangani' },
  { value: 'rejected',     label: 'Ditolak' },
]

// Pengajuan hanya bisa dihapus jika sudah berada di status final:
// berhasil (completed/signed/approved) atau ditolak (rejected).
const DELETABLE_STATUSES = ['completed', 'signed', 'approved', 'rejected']

const DEMO_REQUESTS = [
  {
    id: 'demo-req-006', service_type: 'sktm',     status: 'kades_review', created_at: '2026-06-29T10:00:00Z',
    profiles: { full_name: 'Andi Susanto', nik: '3401012345678902' },
  },
  {
    id: 'demo-req-007', service_type: 'domisili',  status: 'kades_review', created_at: '2026-06-29T09:00:00Z',
    profiles: { full_name: 'Rina Wijaya', nik: '3401098765432102' },
  },
  {
    id: 'demo-req-008', service_type: 'pengantar', status: 'signed',       created_at: '2026-06-28T14:00:00Z',
    profiles: { full_name: 'Budi Hartono', nik: '3401011112222302' },
  },
]

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}
function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function Checkbox({ checked, indeterminate, onChange, ariaLabel }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate) && !checked
  }, [indeterminate, checked])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      className="w-4 h-4 rounded border-[#d1d5db] text-[#1e5fb8] cursor-pointer accent-[#1e5fb8]"
    />
  )
}

function DeleteConfirmModal({ open, onCancel, onConfirm, deleting, count = 1 }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-[400px] bg-white rounded-xl p-6" style={CARD_SHADOW}>
        <h3 className="font-medium text-[18px] text-[#1a1a1a] tracking-[-0.5px]">
          {count > 1 ? `Hapus ${count} Permohonan?` : 'Hapus Permohonan?'}
        </h3>
        <p className="mt-2 text-[14px] leading-6 text-[#6b7280]">
          {count > 1
            ? `${count} permohonan terpilih akan dihapus secara permanen dari daftar. Tindakan ini tidak dapat dibatalkan.`
            : 'Permohonan ini akan dihapus secara permanen dari daftar. Tindakan ini tidak dapat dibatalkan.'}
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="h-10 px-4 rounded-lg text-[14px] font-medium text-[#1a1a1a] bg-white border border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors cursor-pointer disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="h-10 px-4 rounded-lg text-[14px] font-medium text-white hover:opacity-90 transition-opacity cursor-pointer border-0 disabled:opacity-60"
            style={{ background: '#ef4444' }}
          >
            {deleting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function KadesRequestsPage() {
  const navigate = useNavigate()
  const [requests, setRequests]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('semua')
  const [selected, setSelected]         = useState(() => new Set())
  const [confirmOpen, setConfirmOpen]   = useState(false)
  const [deleting, setDeleting]         = useState(false)

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleConfirmDelete() {
    const ids = [...selected]
    if (ids.length === 0) return
    setDeleting(true)

    if (!supabase) {
      setRequests(prev => prev.filter(r => !selected.has(r.id)))
      setDeleting(false)
      setConfirmOpen(false)
      setSelected(new Set())
      return
    }

    // Kades: soft delete — sembunyikan dari daftar kades (warga/admin tetap melihat).
    const res = ids.length === 1 ? await hideRequestForKades(ids[0]) : await hideRequestsForKades(ids)
    setDeleting(false)
    if (res.ok) {
      setRequests(prev => prev.filter(r => !selected.has(r.id)))
      setConfirmOpen(false)
      setSelected(new Set())
    } else {
      alert(`Gagal menghapus permohonan: ${res.message}`)
    }
  }

  useEffect(() => {
    async function load() {
      if (!supabase) { setRequests(DEMO_REQUESTS); setLoading(false); return }
      const data = await getKadesRequests()
      setRequests(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = requests.filter(r => {
    const q = search.toLowerCase()
    const name = (r.profiles?.full_name ?? '').toLowerCase()
    const label = (SERVICE_TYPE_LABELS[r.service_type] ?? '').toLowerCase()
    const matchSearch = q === '' || r.id.toLowerCase().includes(q) || name.includes(q) || label.includes(q)
    // Filter "Sudah Ditandatangani" mencakup signed (belum diproses admin) dan
    // completed (sudah diproses admin) — keduanya adalah TTD dari perspektif Kades.
    const matchStatus = statusFilter === 'semua'
      || (statusFilter === 'signed' && (r.status === 'signed' || r.status === 'completed'))
      || (statusFilter !== 'signed' && r.status === statusFilter)
    return matchSearch && matchStatus
  })

  const waitingCount = requests.filter(r => r.status === 'kades_review').length

  // Baris yang bisa dihapus pada daftar terfilter saat ini.
  const deletableFiltered = filtered.filter(r => DELETABLE_STATUSES.includes(r.status))
  const selectedCount = selected.size
  const allSelected = deletableFiltered.length > 0 && deletableFiltered.every(r => selected.has(r.id))
  const someSelected = deletableFiltered.some(r => selected.has(r.id))

  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) deletableFiltered.forEach(r => next.delete(r.id))
      else deletableFiltered.forEach(r => next.add(r.id))
      return next
    })
  }

  return (
    <div>
      <section style={{ background: HERO_GRADIENT }} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <h1 className="font-medium text-white leading-tight tracking-[0.37px]" style={{ fontSize: 'clamp(22px, 5vw, 36px)', lineHeight: '1.2' }}>Daftar Pengajuan</h1>
          <p className="mt-2 text-[14px] sm:text-[16px] leading-6 tracking-[-0.31px]" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {waitingCount > 0
              ? `${waitingCount} surat menunggu tanda tangan Anda`
              : 'Tidak ada surat yang menunggu tanda tangan'}
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 pb-12">
        {/* Search + filter */}
        <div className="relative -mt-4 bg-white border border-[#e5e7eb] rounded-lg p-4" style={CARD_SHADOW}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><SearchIcon /></div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama warga, ID permohonan, atau jenis layanan..."
                className="w-full h-[42px] bg-white border border-[#e5e7eb] rounded-lg pl-[38px] pr-4 text-[14px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1e5fb8] focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-[42px] bg-white border border-[#e5e7eb] rounded-lg px-3 text-[14px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1e5fb8] cursor-pointer w-full sm:w-auto"
            >
              {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 bg-white border border-[#e5e7eb] rounded-lg overflow-hidden" style={CARD_SHADOW}>
          {selectedCount > 0 ? (
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between gap-3" style={{ background: '#fef2f2' }}>
              <span className="text-[14px] font-medium text-[#1a1a1a]">{selectedCount} permohonan terpilih</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="h-9 px-3 rounded-lg text-[13px] font-medium text-[#1a1a1a] bg-white border border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors cursor-pointer"
                >
                  Batal Pilih
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-medium text-white hover:opacity-90 transition-opacity cursor-pointer border-0 whitespace-nowrap"
                  style={{ background: '#ef4444' }}
                >
                  <TrashIcon />
                  Hapus Terpilih
                </button>
              </div>
            </div>
          ) : (
            <div className="px-6 py-5 border-b border-[#e5e7eb] flex items-center justify-between">
              <h2 className="font-medium text-[18px] text-[#1a1a1a] tracking-[-0.89px]">Daftar Surat</h2>
              <span className="text-[13px] text-[#6b7280]">{filtered.length} permohonan</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 flex justify-center">
              <svg className="animate-spin w-6 h-6 text-[#1e5fb8]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#1e5fb8" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5e7eb]">
                      <th className="px-4 py-3 w-10">
                        <Checkbox
                          checked={allSelected}
                          indeterminate={someSelected}
                          onChange={toggleAll}
                          ariaLabel="Pilih semua permohonan"
                        />
                      </th>
                      {['No. Permohonan', 'Warga', 'Layanan', 'Tanggal', 'Status', 'Aksi'].map(col => (
                        <th key={col} className="px-4 py-3 text-left text-[13px] font-medium text-[#6b7280] whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-14 text-center text-[14px] text-[#6b7280]">
                          Tidak ada permohonan ditemukan
                        </td>
                      </tr>
                    ) : filtered.map(req => {
                      const status = STATUS_MAP[req.status] ?? STATUS_MAP.kades_review
                      return (
                        <tr key={req.id} className="border-b border-[#e5e7eb] last:border-0 hover:bg-[#fafafa] transition-colors">
                          <td className="px-4 py-4">
                            {DELETABLE_STATUSES.includes(req.status) && (
                              <Checkbox
                                checked={selected.has(req.id)}
                                onChange={() => toggleOne(req.id)}
                                ariaLabel={`Pilih permohonan REQ-${req.id.slice(-6).toUpperCase()}`}
                              />
                            )}
                          </td>
                          <td className="px-4 py-4 text-[12px] text-[#6b7280] whitespace-nowrap" style={{ fontFamily: 'Menlo, monospace' }}>
                            REQ-{req.id.slice(-6).toUpperCase()}
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-[13px] font-medium text-[#1a1a1a]">{req.profiles?.full_name ?? '—'}</p>
                            <p className="text-[11px] text-[#9ca3af] mt-0.5" style={{ fontFamily: 'Menlo, monospace' }}>
                              {req.profiles?.nik ?? '—'}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-[13px] text-[#1a1a1a] max-w-[200px]">
                            {SERVICE_TYPE_LABELS[req.service_type] ?? req.service_type}
                          </td>
                          <td className="px-4 py-4 text-[13px] text-[#6b7280] whitespace-nowrap">
                            {formatDate(req.created_at)}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                              style={{ background: status.bg, color: status.text }}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(ROUTES.KADES_REQUEST_DETAIL.replace(':id', req.id))}
                                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-white hover:opacity-90 transition-opacity border-0 cursor-pointer whitespace-nowrap"
                                style={{ background: '#1e5fb8' }}
                              >
                                Tinjau <ArrowRightIcon />
                              </button>
                              {DELETABLE_STATUSES.includes(req.status) && (
                                <button
                                  type="button"
                                  onClick={() => { setSelected(new Set([req.id])); setConfirmOpen(true) }}
                                  title="Hapus permohonan"
                                  aria-label="Hapus permohonan"
                                  className="flex items-center justify-center h-8 w-8 rounded-lg text-[#ef4444] bg-white border border-[#fecaca] hover:bg-[#fef2f2] transition-colors cursor-pointer shrink-0"
                                >
                                  <TrashIcon />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden">
                {filtered.length === 0 ? (
                  <p className="px-4 py-14 text-center text-[14px] text-[#6b7280]">Tidak ada permohonan ditemukan</p>
                ) : filtered.map(req => {
                  const status = STATUS_MAP[req.status] ?? STATUS_MAP.kades_review
                  return (
                    <div key={req.id} className="px-4 py-4 border-b border-[#f3f4f6] last:border-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-3 min-w-0">
                          {DELETABLE_STATUSES.includes(req.status) && (
                            <div className="pt-0.5">
                              <Checkbox
                                checked={selected.has(req.id)}
                                onChange={() => toggleOne(req.id)}
                                ariaLabel={`Pilih permohonan REQ-${req.id.slice(-6).toUpperCase()}`}
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-[14px] text-[#1a1a1a] truncate">
                              {SERVICE_TYPE_LABELS[req.service_type] ?? req.service_type}
                            </p>
                            <p className="text-[11px] text-[#9ca3af] mt-0.5" style={{ fontFamily: 'Menlo, monospace' }}>
                              REQ-{req.id.slice(-6).toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0 whitespace-nowrap"
                          style={{ background: status.bg, color: status.text }}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[13px] font-medium text-[#1a1a1a]">{req.profiles?.full_name ?? '—'}</p>
                          <p className="text-[12px] text-[#9ca3af] mt-0.5">{formatDate(req.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => navigate(ROUTES.KADES_REQUEST_DETAIL.replace(':id', req.id))}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-white border-0 cursor-pointer shrink-0"
                            style={{ background: '#1e5fb8' }}
                          >
                            Tinjau <ArrowRightIcon />
                          </button>
                          {DELETABLE_STATUSES.includes(req.status) && (
                            <button
                              type="button"
                              onClick={() => { setSelected(new Set([req.id])); setConfirmOpen(true) }}
                              aria-label="Hapus permohonan"
                              className="flex items-center justify-center h-8 w-8 rounded-lg text-[#ef4444] bg-white border border-[#fecaca] hover:bg-[#fef2f2] transition-colors cursor-pointer shrink-0"
                            >
                              <TrashIcon />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        open={confirmOpen}
        count={selectedCount}
        deleting={deleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
