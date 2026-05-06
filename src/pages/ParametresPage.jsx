import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Save, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import ConfirmModal from '../components/ui/ConfirmModal'
import toast from 'react-hot-toast'

const schema = z.object({
  nom:     z.string().min(1, 'Nom obligatoire'),
  email:   z.string().email('Email invalide').or(z.literal('')),
  tel:     z.string().optional().default(''),
  adresse: z.string().optional().default(''),
  siret:   z.string().optional().default(''),
})

function syncLocalStorage(data) {
  localStorage.setItem('cp_nom',     data.nom     || '')
  localStorage.setItem('cp_email',   data.email   || '')
  localStorage.setItem('cp_tel',     data.tel     || '')
  localStorage.setItem('cp_adresse', data.adresse || '')
  localStorage.setItem('cp_siret',   data.siret   || '')
}

export default function ParametresPage() {
  const { user, deleteAccount }   = useAuth()
  const navigate                  = useNavigate()
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nom: '', email: '', tel: '', adresse: '', siret: '' },
  })

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('entreprise')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        reset({
          nom:     data.nom     || '',
          email:   data.email   || '',
          tel:     data.tel     || '',
          adresse: data.adresse || '',
          siret:   data.siret   || '',
        })
        syncLocalStorage(data)
      }
      setLoading(false)
    }
    if (user) load()
  }, [user, reset])

  async function onSubmit(formData) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('entreprise')
        .upsert({ user_id: user.id, ...formData }, { onConflict: 'user_id' })

      if (error) throw error

      syncLocalStorage(formData)
      toast.success('Paramètres enregistrés')
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await deleteAccount()
      toast.success('Compte supprimé')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression')
      setDeleting(false)
    }
    setConfirmDelete(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner /></div>
  )

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-xl">
          <Building2 size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ces informations apparaissent sur vos devis et factures PDF
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <h2 className="section-title">Informations entreprise</h2>

        <Input
          label="Nom de l'entreprise *"
          placeholder="Bâti Pro SARL"
          error={errors.nom?.message}
          {...register('nom')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Numéro BCE"
            placeholder="0XXX.XXX.XXX"
            {...register('siret')}
          />
          <Input
            label="Téléphone"
            type="tel"
            placeholder="06 12 34 56 78"
            {...register('tel')}
          />
        </div>

        <Input
          label="Email professionnel"
          type="email"
          placeholder="contact@votreentreprise.fr"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Adresse"
          placeholder="12 rue de la Paix, 75001 Paris"
          {...register('adresse')}
        />

        <div className="pt-2 border-t border-gray-100">
          <Button type="submit" loading={saving}>
            <Save size={14} /> Enregistrer les paramètres
          </Button>
        </div>
      </form>

      <div className="card p-5 bg-blue-50 border-blue-100">
        <p className="text-sm text-blue-800 font-medium mb-1">💡 À savoir</p>
        <p className="text-sm text-blue-700">
          Le nom, numéro BCE, email, téléphone et adresse de votre entreprise sont utilisés automatiquement
          lors de la génération des PDFs (devis et factures).
        </p>
      </div>

      {/* Section RGPD — Suppression de compte */}
      <div className="card p-6 border border-red-100">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Zone de danger</h2>
        <p className="text-sm text-gray-500 mb-4">
          La suppression de votre compte est <strong>définitive et irréversible</strong>.
          Toutes vos données (clients, devis, chantiers, factures) seront supprimées
          conformément à votre droit à l'effacement (RGPD Art. 17).
        </p>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
          {deleting ? 'Suppression en cours…' : 'Supprimer mon compte'}
        </button>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Supprimer définitivement votre compte ?"
          message="Cette action est irréversible. Toutes vos données (clients, devis, chantiers, factures) seront supprimées immédiatement."
          confirmLabel="Oui, supprimer mon compte"
          onConfirm={handleDeleteAccount}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
