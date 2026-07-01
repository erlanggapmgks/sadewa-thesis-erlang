import { supabase } from './supabase'

export async function getVillageSetting(key) {
  if (!supabase) return null
  const { data } = await supabase
    .from('village_settings')
    .select('value')
    .eq('key', key)
    .single()
  return data?.value ?? null
}

export async function setVillageSetting(key, value) {
  if (!supabase) return false
  const { error } = await supabase
    .from('village_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
  return !error
}

export async function uploadSignature(file) {
  if (!supabase) return { ok: false, message: 'Supabase tidak terhubung' }
  const ext  = file.name.split('.').pop()
  const path = `signatures/ttd_kepala_desa.${ext}`
  const { error } = await supabase.storage
    .from('documents')
    .upload(path, file, { upsert: true })
  if (error) return { ok: false, message: error.message }
  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(path)
  return { ok: true, url: `${publicUrl}?t=${Date.now()}` }
}

export async function verifyLetter(letterId) {
  if (!supabase) return { valid: false }
  const { data, error } = await supabase.rpc('verify_letter', { letter_id: letterId })
  if (error) return { valid: false }
  return data ?? { valid: false }
}
