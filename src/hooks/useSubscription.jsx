import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export const FREE_DEVIS_LIMIT    = 10
export const FREE_FACTURES_LIMIT = 3

export function useSubscription() {
  const { effectiveUserId } = useAuth()
  const [plan, setPlan]                       = useState('free')
  const [status, setStatus]                   = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [devisThisMonth, setDevisThisMonth]   = useState(0)
  const [facturesThisMonth, setFacturesThisMonth] = useState(0)

  useEffect(() => {
    if (!effectiveUserId) { setLoading(false); return }

    const startOfMonth = new Date(
      new Date().getFullYear(), new Date().getMonth(), 1
    ).toISOString()

    Promise.all([
      supabase
        .from('subscriptions')
        .select('plan, status, current_period_end')
        .eq('user_id', effectiveUserId)
        .maybeSingle(),
      supabase
        .from('devis')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', effectiveUserId)
        .gte('created_at', startOfMonth),
      supabase
        .from('factures')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', effectiveUserId)
        .gte('created_at', startOfMonth),
    ]).then(([{ data: sub }, { count: devisCount }, { count: facturesCount }]) => {
      const isActive = sub && ['active', 'trialing'].includes(sub.status)
      setPlan(isActive ? sub.plan : 'free')
      setStatus(sub?.status || null)
      setDevisThisMonth(devisCount || 0)
      setFacturesThisMonth(facturesCount || 0)
      setLoading(false)
    })
  }, [effectiveUserId])

  const isPro             = plan === 'pro'
  const canCreateDevis    = isPro || devisThisMonth    < FREE_DEVIS_LIMIT
  const canCreateFacture  = isPro || facturesThisMonth < FREE_FACTURES_LIMIT

  return {
    plan,
    status,
    loading,
    isPro,
    devisThisMonth,
    devisLimit:       FREE_DEVIS_LIMIT,
    canCreateDevis,
    facturesThisMonth,
    facturesLimit:    FREE_FACTURES_LIMIT,
    canCreateFacture,
  }
}
