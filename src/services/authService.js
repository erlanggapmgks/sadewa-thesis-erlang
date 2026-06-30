import { supabase } from './supabase'
import { ROUTES } from '../routes/routes'

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, message: translateError(error.message) }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const home = profile?.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.CITIZEN_DASHBOARD
  return { ok: true, home }
}

export async function register(email, password, fullName, nik) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, nik } },
  })
  if (error) return { ok: false, message: translateError(error.message) }
  return { ok: true }
}

export async function logout() {
  await supabase.auth.signOut()
  return { ok: true }
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) return { ok: false, message: error.message }
  return { ok: true, profile: data }
}

export async function getAllProfiles(filterRole = null) {
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (filterRole) query = query.eq('role', filterRole)
  const { data } = await query
  return data ?? []
}

export async function updateUserRole(userId, newRole) {
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
  if (error) return { ok: false, message: error.message }
  return { ok: true }
}

function translateError(msg) {
  if (msg.includes('Invalid login credentials')) return 'Email atau kata sandi salah.'
  if (msg.includes('Email not confirmed')) return 'Email belum dikonfirmasi. Periksa inbox Anda.'
  if (msg.includes('User already registered')) return 'Email ini sudah terdaftar.'
  if (msg.includes('Password should be')) return 'Kata sandi minimal 8 karakter.'
  return msg
}
