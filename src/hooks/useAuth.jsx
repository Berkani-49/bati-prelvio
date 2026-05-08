import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [teamOwnerId, setTeamOwnerId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Quand l'utilisateur change, vérifier s'il est membre d'une équipe
  useEffect(() => {
    if (!user) { setTeamOwnerId(null); return }
    supabase
      .from('equipe_membres')
      .select('owner_id')
      .eq('member_id', user.id)
      .eq('statut', 'actif')
      .maybeSingle()
      .then(({ data }) => {
        setTeamOwnerId(data?.owner_id || null)
      })
  }, [user?.id])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: 'https://bati-prelvio.vercel.app' },
    })
    if (error) throw error
    return data
  }

  async function resetPasswordForEmail(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://bati-prelvio.vercel.app/reset-password',
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function deleteAccount() {
    const { data, error } = await supabase.functions.invoke('delete-account')
    if (error) throw new Error(error.message || 'Erreur lors de la suppression du compte')
    if (data?.error) throw new Error(data.error)
    ;['cp_nom', 'cp_email', 'cp_tel', 'cp_adresse', 'cp_siret'].forEach(k => localStorage.removeItem(k))
    await supabase.auth.signOut()
  }

  // effectiveUserId : si membre d'une équipe → utilise l'ID du propriétaire pour les inserts
  const effectiveUserId = teamOwnerId || user?.id

  return (
    <AuthContext.Provider value={{ user, loading, teamOwnerId, effectiveUserId, signIn, signUp, signOut, resetPasswordForEmail, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
