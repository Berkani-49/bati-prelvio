import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { KeyRound, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [ready, setReady]         = useState(false)
  const navigate                  = useNavigate()

  useEffect(() => {
    // The Supabase client may have already processed the hash before this component mounted
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { toast.error('Les mots de passe ne correspondent pas'); return }
    if (password.length < 6)  { toast.error('6 caractères minimum'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Mot de passe mis à jour !')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
        <span className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Vérification du lien…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <img src="/logo.png" alt="Bati Prelvio" className="w-16 h-16 object-contain mx-auto mb-8" />

        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <KeyRound size={22} className="text-blue-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Nouveau mot de passe</h2>
        <p className="text-gray-400 text-sm mb-8 text-center">Choisissez un mot de passe sécurisé (6 caractères minimum)</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className="w-full h-11 px-4 text-sm bg-white border border-gray-200 hover:border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className="w-full h-11 px-4 text-sm bg-white border border-gray-200 hover:border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 mt-2"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <>Mettre à jour <ArrowRight size={15} /></>}
          </button>
        </form>
      </div>
    </div>
  )
}
