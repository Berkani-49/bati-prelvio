import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Clé VAPID publique — à remplacer par la vôtre (voir README)
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function usePushNotifications(userId) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading]       = useState(false)
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY

  // Vérifier si déjà abonné
  useEffect(() => {
    if (!supported || !userId) return
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
    )
  }, [userId, supported])

  async function subscribe() {
    if (!supported || !userId) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') { setLoading(false); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      await supabase.from('push_subscriptions').upsert({
        user_id:      userId,
        endpoint:     sub.endpoint,
        p256dh:       btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
        auth:         btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))),
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'user_id' })

      setSubscribed(true)
    } catch (err) {
      console.error('Push subscription error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    if (!supported) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      await supabase.from('push_subscriptions').delete().eq('user_id', userId)
      setSubscribed(false)
    } catch (err) {
      console.error('Unsubscribe error:', err)
    } finally {
      setLoading(false)
    }
  }

  return { supported, permission, subscribed, loading, subscribe, unsubscribe }
}
