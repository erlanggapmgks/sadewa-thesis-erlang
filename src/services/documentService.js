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
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function getRequestById(requestId) {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*, extracted_documents(*)')
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
