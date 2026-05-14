import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Appelle mark_factures_en_retard() une fois par session,
// en remplacement de pg_cron (non disponible sur le plan gratuit Supabase).
export function useAutoRelance(userId) {
  useEffect(() => {
    if (!userId) return
    const key = `relance_checked_${new Date().toISOString().slice(0, 10)}`
    if (sessionStorage.getItem(key)) return // déjà fait aujourd'hui dans cet onglet
    supabase.rpc('mark_factures_en_retard').then(() => {
      sessionStorage.setItem(key, '1')
    })
  }, [userId])
}
