"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Notification } from '@/lib/notifications-service'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  markAsRead: (notificationId: string) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  refresh: () => Promise<void>
}

export function useNotifications(unreadOnly = false): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null)
      
      // Récupérer la session Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        throw new Error('Session expirée, veuillez vous reconnecter')
      }

      // Appeler l'API avec le token dans l'en-tête Authorization
      const response = await fetch(`/api/notifications?unreadOnly=${unreadOnly}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
        console.log(`✅ ${data.notifications?.length || 0} notifications chargées`)
      } else {
        throw new Error(data.error || 'Erreur lors du chargement des notifications')
      }
    } catch (err: any) {
      console.error('❌ Erreur chargement notifications:', err)
      setError(err.message)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [unreadOnly])

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      // Récupérer la session Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        throw new Error('Session expirée, veuillez vous reconnecter')
      }

      // Appeler l'API pour marquer comme lue
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Mettre à jour l'état local
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
        console.log('✅ Notification marquée comme lue')
        return true
      } else {
        throw new Error(data.error || 'Erreur lors du marquage')
      }
    } catch (err: any) {
      console.error('❌ Erreur marquage notification:', err)
      setError(err.message)
      return false
    }
  }, [])

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      // Récupérer la session Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        throw new Error('Session expirée, veuillez vous reconnecter')
      }

      // Marquer toutes les notifications non lues comme lues
      const unreadNotifications = notifications.filter(notif => !notif.read)
      
      // Marquer chaque notification individuellement
      const results = await Promise.allSettled(
        unreadNotifications.map(notif => markAsRead(notif.id))
      )

      const successCount = results.filter(result => result.status === 'fulfilled').length
      
      if (successCount > 0) {
        console.log(`✅ ${successCount} notifications marquées comme lues`)
        return true
      } else {
        throw new Error('Aucune notification n\'a pu être marquée comme lue')
      }
    } catch (err: any) {
      console.error('❌ Erreur marquage toutes notifications:', err)
      setError(err.message)
      return false
    }
  }, [notifications, markAsRead])

  const refresh = useCallback(async () => {
    setLoading(true)
    await fetchNotifications()
  }, [fetchNotifications])

  // Charger les notifications au montage
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Rafraîchir automatiquement toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh
  }
}
