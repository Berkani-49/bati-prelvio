import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MailCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
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

export default function LoginPage() {
  const [mode, setMode]             = useState('login')
  const [loading, setLoading]       = useState(false)
  const [emailSent, setEmailSent]   = useState(false)
  const { signIn, signUp }          = useAuth()
  const navigate                    = useNavigate()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  function switchMode(next) {
    setMode(next)
    setEmailSent(false)
    reset()
  }

  async function onSubmit({ email, password }) {
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        navigate('/dashboard')
      } else {
        const data = await signUp(email, password)
        if (data?.session) {
          toast.success('Compte créé ! Bienvenue 🎉')
          navigate('/dashboard')
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

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center">
            <img src="/logo.png" alt="Bati Prelvio" className="w-16 h-16 object-contain mb-4 drop-shadow-lg" />
            <h1 className="text-2xl font-bold text-white">Bati Prelvio</h1>
          </div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center space-y-4">
            <div className="flex items-center justify-center w-14 h-14 bg-primary-100 rounded-full mx-auto">
              <MailCheck size={26} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Vérifiez votre email</h2>
            <p className="text-sm text-gray-500">
              Un lien de confirmation a été envoyé à votre adresse email. Cliquez dessus pour activer votre compte.
            </p>
            <p className="text-xs text-gray-400">Pas reçu ? Vérifiez vos spams.</p>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center">
          <img src="/logo.png" alt="Bati Prelvio" className="w-20 h-20 object-contain mb-4 drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-white">Bati Prelvio</h1>
          <p className="text-slate-400 text-sm mt-1">Gestion devis & chantiers BTP</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'login' ? 'Connexion' : 'Créer un compte'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {mode === 'login' ? 'Accédez à votre espace Bati Prelvio' : 'Commencez gratuitement'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Adresse email"
              type="email"
              placeholder="vous@exemple.fr"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              hint={mode === 'register' ? '6 caractères minimum' : undefined}
              {...register('password')}
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              {mode === 'login'
                ? "Pas encore de compte ? S'inscrire"
                : 'Déjà un compte ? Se connecter'}
            </button>
          </div>

          {mode === 'login' && (
            <p className="text-center text-xs text-gray-400">
              Si vous venez de créer votre compte, confirmez d'abord votre email.
            </p>
          )}
        </div>

        <p className="text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Bati Prelvio — Tous droits réservés
        </p>
      </div>
    </div>
  )
}
