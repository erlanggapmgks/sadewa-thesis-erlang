import { supabase } from './supabase'

export async function uploadDocument(file, userId, filename) {
  const path = `${userId}/${Date.now()}_${filename}`
  const { error } = await supabase.storage
    .from('documents')
    .upload(path, file, { upsert: true })
  if (error) return { ok: false, message: error.message }

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(path)

  return { ok: true, url: publicUrl }
}

export async function createDocumentRequest(payload) {
  const { data, error } = await supabase
    .from('service_requests')
    .insert([payload])
    .select()
    .single()
  if (error) return { ok: false, message: error.message }
  return { ok: true, request: data }
}

export async function saveExtractedDocument(requestId, extracted) {
  const { error } = await supabase
    .from('extracted_documents')
    .insert([{ request_id: requestId, ...extracted }])
  if (error) return { ok: false, message: error.message }
  return { ok: true }
}

export async function getMyRequests(userId) {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('hidden_for_citizen', false) // sembunyikan yang sudah "dihapus" warga
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function findCitizenByNik(nik) {
  if (!nik) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, nik')
    .eq('nik', nik)
    .single()
  if (error) return null
  return data
}

export async function getRequestById(requestId) {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*, profiles!user_id(full_name, email, nik), extracted_documents(*)')
    .eq('id', requestId)
    .single()
  if (error) return null
  return data
}

export async function getAllRequests(filters = {}) {
  let query = supabase
    .from('service_requests')
    .select('*, profiles!user_id(full_name, email, nik)')
    .order('created_at', { ascending: false })
  if (filters.status) query = query.eq('status', filters.status)
  const { data, error } = await query
  if (error) return []
  return data
}

export async function updateRequestStatus(requestId, status, adminNotes, reviewerId) {
  const { data, error } = await supabase
    .from('service_requests')
    .update({ status, admin_notes: adminNotes, reviewed_by: reviewerId })
    .eq('id', requestId)
    .select()
    .single()
  if (error) return { ok: false, message: error.message }
  return { ok: true, request: data }
}

// ── Hapus pengajuan — semantik per peran (lihat supabase/schema.sql §10) ────────
//
//  • Warga & Kades  : SOFT DELETE — hanya menyembunyikan dari daftar peran itu
//                     via RPC (kolom hidden_for_citizen / hidden_for_kades).
//  • Admin          : HARD DELETE — menghapus baris permanen dari database.

const RLS_DELETE_HINT =
  'Tidak ada data yang terhapus. Kemungkinan izin hapus (RLS policy) belum diatur di Supabase (lihat schema.sql §10).'

// ── Admin: hard delete permanen ─────────────────────────────────────────────────

export async function deleteRequest(requestId) {
  // extracted_documents punya ON DELETE CASCADE, jadi akan ikut terhapus saat
  // request dihapus. Kita minta .select() agar tahu apakah baris BENAR terhapus:
  // kalau RLS memblokir, Supabase tidak error tapi mengembalikan 0 baris.
  const { data, error } = await supabase
    .from('service_requests')
    .delete()
    .eq('id', requestId)
    .select('id')
  if (error) return { ok: false, message: error.message }
  if (!data || data.length === 0) return { ok: false, message: RLS_DELETE_HINT }
  return { ok: true, deleted: data.length }
}

export async function deleteRequests(ids) {
  if (!ids || ids.length === 0) return { ok: true, deleted: 0 }
  const { data, error } = await supabase
    .from('service_requests')
    .delete()
    .in('id', ids)
    .select('id')
  if (error) return { ok: false, message: error.message }
  if (!data || data.length === 0) return { ok: false, message: RLS_DELETE_HINT }
  return { ok: true, deleted: data.length }
}

// ── Warga: soft delete (sembunyikan dari riwayat sendiri) ────────────────────────

export async function hideRequestsForCitizen(ids) {
  if (!ids || ids.length === 0) return { ok: true, affected: 0 }
  const { data, error } = await supabase.rpc('hide_requests_for_citizen', { ids })
  if (error) return { ok: false, message: error.message }
  if (!data || data === 0) return { ok: false, message: RLS_DELETE_HINT }
  return { ok: true, affected: data }
}

export async function hideRequestForCitizen(requestId) {
  return hideRequestsForCitizen([requestId])
}

// ── Kades: soft delete (sembunyikan dari daftar kades) ───────────────────────────

export async function hideRequestsForKades(ids) {
  if (!ids || ids.length === 0) return { ok: true, affected: 0 }
  const { data, error } = await supabase.rpc('hide_requests_for_kades', { ids })
  if (error) return { ok: false, message: error.message }
  if (!data || data === 0) return { ok: false, message: RLS_DELETE_HINT }
  return { ok: true, affected: data }
}

export async function hideRequestForKades(requestId) {
  return hideRequestsForKades([requestId])
}

export async function getKadesRequests() {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*, profiles!user_id(full_name, email, nik)')
    .in('status', ['kades_review', 'signed', 'rejected', 'completed'])
    .eq('hidden_for_kades', false) // sembunyikan yang sudah "dihapus" kades
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function updateKadesStatus(requestId, status, kadesNotes, kadesReviewerId) {
  const updates = {
    status,
    kades_notes: kadesNotes,
    kades_reviewed_by: kadesReviewerId,
    ...(status === 'signed' ? { signed_at: new Date().toISOString() } : {}),
  }
  const { data, error } = await supabase
    .from('service_requests')
    .update(updates)
    .eq('id', requestId)
    .select()
    .single()
  if (error) return { ok: false, message: error.message }
  return { ok: true, request: data }
}
