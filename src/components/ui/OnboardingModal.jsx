import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Wrench, Zap, ArrowRight, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Button from './Button'
import toast from 'react-hot-toast'

const METIERS = [
  { value: 'plombier',     label: 'Plombier',        emoji: '🔧' },
  { value: 'electricien',  label: 'Électricien',      emoji: '⚡' },
  { value: 'maconnerie',   label: 'Maçonnerie',       emoji: '🧱' },
  { value: 'peinture',     label: 'Peinture',         emoji: '🖌️' },
  { value: 'menuiserie',   label: 'Menuiserie',       emoji: '🪵' },
  { value: 'toiture',      label: 'Toiture',          emoji: '🏠' },
  { value: 'carrelage',    label: 'Carrelage',        emoji: '🪟' },
  { value: 'autre',        label: 'Autre / Multi',    emoji: '🔨' },
]

const STEPS = ['Bienvenue', 'Votre métier', 'Votre entreprise']

const schema = z.object({
  nom:    z.string().min(1, 'Nom obligatoire'),
  tel:    z.string().optional().default(''),
  email:  z.string().email('Email invalide').or(z.literal('')).default(''),
  siret:  z.string().optional().default(''),
})

export default function OnboardingModal({ onComplete }) {
  const { user, effectiveUserId } = useAuth()
  const [step, setStep]     = useState(0)
  const [metier, setMetier] = useState('autre')
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nom: '', tel: '', email: user?.email || '', siret: '' },
  })

  async function finish(data) {
    setSaving(true)
    try {
      await supabase.from('entreprise').upsert({
        user_id: effectiveUserId,
        nom:     data.nom,
        tel:     data.tel || null,
        email:   data.email || null,
        siret:   data.siret || null,
        metier,
      }, { onConflict: 'user_id' })

      localStorage.setItem('cp_nom',    data.nom)
      localStorage.setItem('cp_email',  data.email || '')
      localStorage.setItem('cp_tel',    data.tel || '')
      localStorage.setItem('cp_siret',  data.siret || '')
      localStorage.setItem('cp_metier', metier)
      localStorage.setItem('cp_onboarded', '1')

      toast.success('Bienvenue ! Votre espace est prêt.')
      onComplete()
    } catch (err) {
      toast.error(err.message || 'Erreur')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Progress bar */}
        <div className="flex">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 transition-colors ${i <= step ? 'bg-primary-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        {/* Step 0 — Bienvenue */}
        {step === 0 && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Building2 size={28} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue sur Bati Prelvio</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              En 2 minutes, configurons votre espace pour que tout soit prêt :<br />
              devis, chantiers, facturation — taillés pour votre activité.
            </p>
            <div className="space-y-2 text-left mb-8">
              {[
                'Devis PDF professionnels en 2 minutes',
                'Suivi chantiers, équipes et pointage',
                'Facturation et relances automatiques',
              ].map(f => (
                <div key={f} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl">
                  <Check size={16} className="text-green-500 shrink-0" />
                  <span className="text-sm text-gray-700">{f}</span>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={() => setStep(1)}>
              Démarrer la configuration <ArrowRight size={16} />
            </Button>
          </div>
        )}

        {/* Step 1 — Métier */}
        {step === 1 && (
          <div className="p-8">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-5">
              <Wrench size={22} className="text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Votre activité</h2>
            <p className="text-sm text-gray-500 mb-6">
              On adapte le catalogue de prestations à votre métier.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-8">
              {METIERS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMetier(m.value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    metier === m.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{m.emoji}</span>
                  <span>{m.label}</span>
                  {metier === m.value && <Check size={14} className="ml-auto text-primary-600" />}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(0)}>Retour</Button>
              <Button className="flex-1" onClick={() => setStep(2)}>
                Continuer <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Entreprise */}
        {step === 2 && (
          <div className="p-8">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-5">
              <Building2 size={22} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Votre entreprise</h2>
            <p className="text-sm text-gray-500 mb-6">
              Ces informations apparaîtront sur vos devis et factures PDF.
            </p>
            <form onSubmit={handleSubmit(finish)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise *</label>
                <input
                  {...register('nom')}
                  placeholder="Bâti Pro SARL"
                  className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.nom && <p className="text-xs text-red-600 mt-1">{errors.nom.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    {...register('tel')}
                    type="tel"
                    placeholder="06 12 34 56 78"
                    className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SIRET / BCE</label>
                  <input
                    {...register('siret')}
                    placeholder="0XXX.XXX.XXX"
                    className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="contact@votreentreprise.fr"
                  className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                  Retour
                </Button>
                <Button type="submit" className="flex-1" loading={saving}>
                  <Zap size={15} /> Lancer mon espace
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
