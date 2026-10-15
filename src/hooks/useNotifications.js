// State notifikasi warga untuk komponen UI (mis. lonceng di header).
//
// Menyediakan daftar notif + jumlah belum dibaca, me-refresh otomatis saat
// ada perubahan realtime, dan mengekspos aksi untuk menandai dibaca.
//
// Usage:
//   const { items, unreadCount, loading, markRead, markAllRead, refresh } = useNotifications()

import { useCallback, useEffect, useState } from 'react'
import { useAuthContext } from '../context/AuthContext'
import * as notificationService from '../services/notificationService'

export function useNotifications() {
  const { user } = useAuthContext()
  const userId = user?.id ?? null

  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) {
      setItems([])
      setUnreadCount(0)
      setLoading(false)
      return
    }
    const [list, count] = await Promise.all([
      notificationService.getMyNotifications(userId),
      notificationService.countUnread(userId),
    ])
    return { list, count }
  }, [userId])

  // Fetch awal + langganan realtime. Satu effect per user agar `cancelled`
  // membuang hasil async yang datang setelah user berganti/unmount — tanpa
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

    const unsubscribe = notificationService.subscribeToNotifications(userId, async () => {
      const result = await refresh()
      if (cancelled || !result) return
      setItems(result.list)
      setUnreadCount(result.count)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [userId, refresh])

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
