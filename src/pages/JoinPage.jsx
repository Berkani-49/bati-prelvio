import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Users, CheckCircle, Loader, LogIn } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function JoinPage() {
  const { token }             = useParams()
  const { user, signIn, signUp } = useAuth()
  const navigate              = useNavigate()

  const [mode, setMode]       = useState('login') // 'login' | 'register'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [accepting, setAccepting]   = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState(null)

  // Si l'utilisateur est déjà connecté, accepter directement
  useEffect(() => {
    if (user && token && !done) acceptInvite()
  }, [user, token])

  async function acceptInvite() {
    setAccepting(true)
    const { data, error: err } = await supabase.functions.invoke('accept-invitation', {
      body: { invite_token: token },
    })
    setAccepting(false)

    if (err || data?.error) {
      setError(data?.error || err?.message || 'Erreur lors de l\'acceptation')
      return
    }

    setDone(true)
    toast.success('Invitation acceptée ! Bienvenue dans l\'équipe.')
    setTimeout(() => navigate('/dashboard'), 1800)
  }

  async function handleAuth(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'register') {
        await signUp(email, password)
        toast.success('Compte créé ! Vérifiez votre email pour confirmer.')
      } else {
        await signIn(email, password)
      }
      // useEffect va détecter user et appeler acceptInvite
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (accepting) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader size={28} className="animate-spin text-orange-600" />
    </div>
  )

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation acceptée !</h1>
        <p className="text-gray-500 text-sm">Vous êtes maintenant membre de l'équipe. Redirection…</p>
      </div>
    </div>
  )

  if (error && !user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users size={24} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation invalide</h1>
        <p className="text-gray-500 text-sm">{error}</p>
        <Link to="/" className="inline-block mt-4 text-sm text-orange-600 hover:underline">Retour à l'accueil</Link>
      </div>
    </div>
  )

  // Pas connecté → afficher le formulaire login/register
  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users size={24} className="text-orange-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Invitation d'équipe</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'login'
              ? 'Connectez-vous pour accepter l\'invitation'
              : 'Créez votre compte pour rejoindre l\'équipe'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader size={15} className="animate-spin" /> : <LogIn size={15} />}
            {submitting ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {mode === 'login' ? (
            <>Pas encore de compte ?{' '}
              <button onClick={() => setMode('register')} className="text-orange-600 hover:underline font-medium">Créer un compte</button>
            </>
          ) : (
            <>Déjà un compte ?{' '}
              <button onClick={() => setMode('login')} className="text-orange-600 hover:underline font-medium">Se connecter</button>
            </>
          )}
        </p>
      </div>
    </div>
  )

  return null
}
