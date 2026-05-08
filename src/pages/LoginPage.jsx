import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MailCheck, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const schema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(6, '6 caractères minimum'),
})

function translateError(message) {
  if (!message) return 'Une erreur est survenue'
  if (message.includes('Invalid login credentials'))  return 'Email ou mot de passe incorrect'
  if (message.includes('Email not confirmed'))         return 'Confirmez votre email avant de vous connecter'
  if (message.includes('User already registered'))    return 'Cet email est déjà utilisé — connectez-vous'
  if (message.includes('Password should be'))         return 'Mot de passe trop court (6 caractères minimum)'
  if (message.includes('Unable to validate email'))   return 'Adresse email invalide'
  if (message.includes('rate limit'))                 return 'Trop de tentatives, réessayez dans quelques minutes'
  if (message.includes('network'))                    return 'Problème réseau — vérifiez votre connexion'
  return message
}

const features = [
  'Devis professionnels en 2 minutes',
  'PDF généré & envoyé par email automatiquement',
  'Suivi chantiers & facturation intégrée',
]

export default function LoginPage() {
  const [mode, setMode]           = useState('login')
  const [loading, setLoading]     = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const { signIn, signUp, resetPasswordForEmail } = useAuth()
  const navigate                  = useNavigate()
  const location                  = useLocation()
  const nextPath                  = new URLSearchParams(location.search).get('next') || '/dashboard'

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  function switchMode(next) {
    setMode(next)
    setEmailSent(false)
    setResetSent(false)
    reset()
  }

  async function handleForgot(e) {
    e.preventDefault()
    const email = e.target.email.value.trim()
    if (!email) return
    setLoading(true)
    try {
      await resetPasswordForEmail(email)
      setResetSent(true)
    } catch (err) {
      toast.error(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit({ email, password }) {
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        navigate(nextPath)
      } else {
        const data = await signUp(email, password)
        if (data?.session) {
          toast.success('Compte créé ! Bienvenue')
          navigate(nextPath)
        } else {
          setEmailSent(true)
        }
      }
    } catch (err) {
      toast.error(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  /* ── Écran reset envoyé ── */
  if (resetSent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <img src="/logo.png" alt="Bati Prelvio" className="w-20 h-20 object-contain mx-auto mb-8" />
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <KeyRound size={26} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Email envoyé !</h2>
          <p className="text-gray-500 text-sm mb-1">
            Un lien de réinitialisation a été envoyé à votre adresse.
          </p>
          <p className="text-gray-400 text-xs mb-8">Pas reçu ? Vérifiez vos spams.</p>
          <button type="button" onClick={() => switchMode('login')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            ← Retour à la connexion
          </button>
        </div>
      </div>
    )
  }

  /* ── Écran email envoyé ── */
  if (emailSent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <img src="/logo.png" alt="Bati Prelvio" className="w-20 h-20 object-contain mx-auto mb-8" />
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MailCheck size={26} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Vérifiez votre email</h2>
          <p className="text-gray-500 text-sm mb-1">
            Un lien de confirmation a été envoyé à votre adresse.
          </p>
          <p className="text-gray-400 text-xs mb-8">Pas reçu ? Vérifiez vos spams.</p>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    )
  }

  /* ── Page principale split ── */
  return (
    <div className="min-h-screen bg-white flex">

      {/* ── Panneau gauche — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-[#f8faff] border-r border-gray-100 p-14 relative overflow-hidden">

        {/* Cercles déco */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-100/60 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-blue-50/80 blur-2xl pointer-events-none" />

        {/* Logo */}
        <div className="relative">
          <img src="/logo.png" alt="Bati Prelvio" className="w-44 h-44 object-contain" />
        </div>

        {/* Titre */}
        <div className="relative flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            Gérez vos chantiers<br />
            <span className="text-blue-600">sans prise de tête.</span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed mb-10 max-w-sm">
            L'outil pensé pour les artisans BTP — devis, suivi chantier et facturation en un seul endroit.
          </p>

          <ul className="space-y-4">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-blue-500 mt-0.5 shrink-0" />
                <span className="text-gray-600 text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-gray-400">
          © {new Date().getFullYear()} Bati Prelvio
        </p>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-14">

        {/* Logo mobile uniquement */}
        <div className="lg:hidden mb-10 text-center">
          <img src="/logo.png" alt="Bati Prelvio" className="w-20 h-20 object-contain mx-auto mb-2" />
          <p className="text-gray-500 text-sm font-medium">Bati Prelvio</p>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {mode === 'login' ? 'Bon retour' : mode === 'register' ? 'Créer un compte' : 'Mot de passe oublié'}
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            {mode === 'login'
              ? 'Connectez-vous à votre espace'
              : mode === 'register'
              ? 'Commencez gratuitement, sans carte bancaire'
              : 'Entrez votre email pour recevoir un lien de réinitialisation'}
          </p>

          {/* ── Formulaire mot de passe oublié ── */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="vous@exemple.fr"
                  autoComplete="email"
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
                  : <><KeyRound size={15} /> Envoyer le lien</>}
              </button>
              <div className="text-center pt-2">
                <button type="button" onClick={() => switchMode('login')}
                  className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                  ← Retour à la connexion
                </button>
              </div>
            </form>
          )}

          {/* ── Formulaire login / register ── */}
          {mode !== 'forgot' && (
            <>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    placeholder="vous@exemple.fr"
                    autoComplete="email"
                    className={`w-full h-11 px-4 text-sm bg-white border rounded-xl transition-colors outline-none
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${errors.email ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}`}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Mot de passe
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Mot de passe oublié ?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className={`w-full h-11 px-4 text-sm bg-white border rounded-xl transition-colors outline-none
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${errors.password ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}`}
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
                  )}
                  {mode === 'register' && !errors.password && (
                    <p className="mt-1.5 text-xs text-gray-400">6 caractères minimum</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                  className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                  {mode === 'login'
                    ? <>Pas encore de compte ? <span className="text-blue-600 font-medium">S'inscrire</span></>
                    : <>Déjà un compte ? <span className="text-blue-600 font-medium">Se connecter</span></>
                  }
                </button>
              </div>

              {mode === 'login' && (
                <p className="text-center text-xs text-gray-400 mt-4">
                  Si vous venez de créer votre compte, confirmez d'abord votre email.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
