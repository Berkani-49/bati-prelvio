import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useSubscription() {
  const { effectiveUserId } = useAuth()
  const [plan, setPlan] = useState('free')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!effectiveUserId) { setLoading(false); return }

    supabase
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', effectiveUserId)
      .maybeSingle()
      .then(({ data }) => {
        const isActive = data && ['active', 'trialing'].includes(data.status)
        setPlan(isActive ? data.plan : 'free')
        setStatus(data?.status || null)
        setLoading(false)
      })
  }, [effectiveUserId])

  return { plan, status, loading, isPro: plan === 'pro' }
}
