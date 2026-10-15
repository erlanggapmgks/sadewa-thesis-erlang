// State notifikasi in-app untuk komponen UI (mis. lonceng di header).
//
// Menyediakan daftar notif + jumlah belum dibaca, me-refresh otomatis saat
// ada perubahan realtime, dan mengekspos aksi untuk menandai dibaca.
//
// Dua mode:
//   • Warga (default): notif personal milik user yang login.
//       const { items, unreadCount, ... } = useNotifications()
//   • Staff (per-peran): notif yang menyasar sebuah peran.
//       const { items, unreadCount, ... } = useNotifications({ role: 'admin' })
//       (role: 'admin' | 'kepala_desa')

import { useCallback, useEffect, useState } from 'react'
import { useAuthContext } from '../context/AuthContext'
import * as notificationService from '../services/notificationService'

export function useNotifications({ role = null } = {}) {
  const { user } = useAuthContext()
  const userId = user?.id ?? null

  // Mode staff aktif bila `role` diberikan; selain itu mode warga (per-user).
  const isStaff = Boolean(role)
  // Kunci sumber data: kalau staff pakai role, kalau tidak pakai userId.
  // Keduanya memastikan effect/refresh terikat ke sumber yang benar.
  const sourceKey = isStaff ? role : userId

  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!sourceKey) {
      setItems([])
      setUnreadCount(0)
      setLoading(false)
      return
    }
    const [list, count] = isStaff
      ? await Promise.all([
          notificationService.getRoleNotifications(role),
          notificationService.countUnreadForRole(role),
        ])
      : await Promise.all([
          notificationService.getMyNotifications(userId),
          notificationService.countUnread(userId),
        ])
    return { list, count }
  }, [isStaff, role, userId, sourceKey])

  // Fetch awal + langganan realtime. Satu effect per sumber agar `cancelled`
  // membuang hasil async yang datang setelah sumber berganti/unmount — tanpa
  // menyentuh ref saat render.
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const result = await refresh()
      if (cancelled || !result) return
      setItems(result.list)
      setUnreadCount(result.count)
      setLoading(false)
    }

    load()

    const onChange = async () => {
      const result = await refresh()
      if (cancelled || !result) return
      setItems(result.list)
      setUnreadCount(result.count)
    }

    const unsubscribe = isStaff
      ? notificationService.subscribeToRoleNotifications(role, onChange)
      : notificationService.subscribeToNotifications(userId, onChange)

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [isStaff, role, userId, refresh])

  // Tandai sebagian notif dibaca (optimistic + sinkron ke server).
  const markRead = useCallback(async (ids) => {
    const idList = Array.isArray(ids) ? ids : [ids]
    if (idList.length === 0) return
    setItems(prev => prev.map(n => (idList.includes(n.id) ? { ...n, read: true } : n)))
    setUnreadCount(prev => {
      const nowRead = items.filter(n => idList.includes(n.id) && !n.read).length
      return Math.max(0, prev - nowRead)
    })
    await notificationService.markRead(idList)
  }, [items])

  // Tandai semua dibaca.
  const markAllRead = useCallback(async () => {
    if (unreadCount === 0) return
    setItems(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    await notificationService.markAllRead()
  }, [unreadCount])

  return { items, unreadCount, loading, markRead, markAllRead, refresh }
}
