// Notifikasi in-app untuk warga.
//
// Sumber data: tabel `notifications` di Supabase, yang diisi otomatis oleh
// trigger database setiap status pengajuan surat berubah (lihat
// supabase/notifications.sql). Service ini hanya MEMBACA & MENANDAI dibaca —
// notif tidak pernah dibuat dari sisi klien.
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
