// Notifikasi in-app.
//
// Sumber data: tabel `notifications` di Supabase, yang diisi otomatis oleh
// trigger database setiap status pengajuan surat berubah (lihat
// supabase/notifications.sql & supabase/notifications_staff.sql). Service ini
// hanya MEMBACA & MENANDAI dibaca — notif tidak pernah dibuat dari sisi klien.
//
// Dua jenis sasaran notif:
//   • Warga : per-user (kolom user_id).      → getMyNotifications / countUnread
//   • Staff : per-peran (kolom target_role). → getRoleNotifications / countUnreadForRole
//     target_role bernilai 'admin' atau 'kepala_desa'.
//
// Semua fungsi aman dipanggil saat demo mode (supabase === null): mereka
// mengembalikan nilai kosong, bukan melempar error.

import { supabase } from './supabase'

const PAGE_SIZE = 20

// Ambil daftar notif milik user, terbaru dulu.
export async function getMyNotifications(userId, limit = PAGE_SIZE) {
  if (!supabase || !userId) return []
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return data ?? []
}

// Hitung jumlah notif yang belum dibaca (untuk badge).
export async function countUnread(userId) {
  if (!supabase || !userId) return 0
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) return 0
  return count ?? 0
}

// ── Notif peran (admin / kepala_desa) ───────────────────────────────────────

// Ambil daftar notif yang menyasar sebuah peran, terbaru dulu.
export async function getRoleNotifications(role, limit = PAGE_SIZE) {
  if (!supabase || !role) return []
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('target_role', role)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return data ?? []
}

// Hitung notif peran yang belum dibaca.
export async function countUnreadForRole(role) {
  if (!supabase || !role) return 0
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('target_role', role)
    .eq('read', false)
  if (error) return 0
  return count ?? 0
}

// Berlangganan realtime untuk notif sebuah peran.
export function subscribeToRoleNotifications(role, onChange) {
  if (!supabase || !role) return () => {}

  const channel = supabase
    .channel(`notifications:role:${role}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `target_role=eq.${role}`,
      },
      payload => onChange?.(payload)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ── Aksi dibaca (berlaku untuk warga maupun staff via RPC) ───────────────────

// Tandai sebagian notif (daftar id) sebagai dibaca.
export async function markRead(ids) {
  if (!supabase || !ids || ids.length === 0) return { ok: true, affected: 0 }
  const { data, error } = await supabase.rpc('mark_notifications_read', { ids })
  if (error) return { ok: false, message: error.message }
  return { ok: true, affected: data ?? 0 }
}

// Tandai SEMUA notif milik user sebagai dibaca.
export async function markAllRead() {
  if (!supabase) return { ok: true, affected: 0 }
  const { data, error } = await supabase.rpc('mark_all_notifications_read')
  if (error) return { ok: false, message: error.message }
  return { ok: true, affected: data ?? 0 }
}

// Berlangganan perubahan realtime pada notif milik user.
// `onChange` dipanggil setiap ada INSERT/UPDATE. Mengembalikan fungsi
// unsubscribe (atau no-op bila demo mode / tak ada userId).
export function subscribeToNotifications(userId, onChange) {
  if (!supabase || !userId) return () => {}

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      payload => onChange?.(payload)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
