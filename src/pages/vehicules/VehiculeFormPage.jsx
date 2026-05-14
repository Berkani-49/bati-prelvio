import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const schema = z.object({
  nom:               z.string().min(1, 'Nom obligatoire'),
  type:              z.enum(['vehicule', 'engin', 'outil', 'autre']),
  statut:            z.enum(['disponible', 'en_service', 'maintenance', 'hors_service']),
  immatriculation:   z.string().optional().default(''),
  marque:            z.string().optional().default(''),
  modele:            z.string().optional().default(''),
  annee:             z.string().optional().default(''),
  kilometrage:       z.string().optional().default(''),
  date_controle_tech: z.string().optional().default(''),
  date_assurance:    z.string().optional().default(''),
  date_revision:     z.string().optional().default(''),
  notes:             z.string().optional().default(''),
})

export default function VehiculeFormPage() {
  const { id }              = useParams()
  const isEdit              = !!id
  const { effectiveUserId } = useAuth()
  const navigate            = useNavigate()
  const [loading, setLoading] = useState(isEdit)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: '', type: 'vehicule', statut: 'disponible',
      immatriculation: '', marque: '', modele: '', annee: '',
      kilometrage: '', date_controle_tech: '', date_assurance: '',
      date_revision: '', notes: '',
    },
  })

  useEffect(() => {
    if (!isEdit) return
    supabase.from('vehicules').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error || !data) { toast.error('Introuvable'); navigate('/vehicules'); return }
      reset({
        nom:                data.nom               || '',
        type:               data.type              || 'vehicule',
        statut:             data.statut            || 'disponible',
        immatriculation:    data.immatriculation   || '',
        marque:             data.marque            || '',
        modele:             data.modele            || '',
        annee:              data.annee?.toString() || '',
        kilometrage:        data.kilometrage?.toString() || '',
        date_controle_tech: data.date_controle_tech || '',
        date_assurance:     data.date_assurance    || '',
        date_revision:      data.date_revision     || '',
        notes:              data.notes             || '',
      })
      setLoading(false)
    })
  }, [id, isEdit, navigate, reset])

  async function onSubmit(data) {
    try {
      const payload = {
        nom:               data.nom,
        type:              data.type,
        statut:            data.statut,
        immatriculation:   data.immatriculation  || null,
        marque:            data.marque           || null,
        modele:            data.modele           || null,
        annee:             data.annee            ? parseInt(data.annee)       : null,
        kilometrage:       data.kilometrage      ? parseInt(data.kilometrage) : null,
        date_controle_tech: data.date_controle_tech || null,
        date_assurance:    data.date_assurance   || null,
        date_revision:     data.date_revision    || null,
        notes:             data.notes            || null,
      }

      if (isEdit) {
        const { error } = await supabase.from('vehicules').update(payload).eq('id', id)
        if (error) throw error
        toast.success('Modifié')
      } else {
        const { error } = await supabase.from('vehicules').insert({ ...payload, user_id: effectiveUserId })
        if (error) throw error
        toast.success('Ajouté')
      }
      navigate('/vehicules')
    } catch (err) {
      toast.error(err.message || 'Erreur')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/vehicules" className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Modifier' : 'Ajouter un véhicule / matériel'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Parc véhicules & matériel</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Infos générales */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Informations générales</h2>

          <Input label="Nom *" placeholder="Camion benne, Pelleteuse CAT…" error={errors.nom?.message} {...register('nom')} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" {...register('type')}>
                <option value="vehicule">Véhicule</option>
                <option value="engin">Engin</option>
                <option value="outil">Outil</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" {...register('statut')}>
                <option value="disponible">Disponible</option>
                <option value="en_service">En service</option>
                <option value="maintenance">Maintenance</option>
                <option value="hors_service">Hors service</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Marque" placeholder="Renault, Caterpillar…" {...register('marque')} />
            <Input label="Modèle" placeholder="Master, 320D…" {...register('modele')} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="Immatriculation" placeholder="AB-123-CD" {...register('immatriculation')} />
            <Input label="Année" type="number" placeholder="2019" {...register('annee')} />
            <Input label="Kilométrage" type="number" placeholder="85000" {...register('kilometrage')} />
          </div>
        </div>

        {/* Maintenance */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Maintenance & documents</h2>
          <p className="text-xs text-gray-400">Les alertes s'affichent 30 jours avant échéance.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Contrôle technique" type="date" {...register('date_controle_tech')} />
            <Input label="Assurance" type="date" {...register('date_assurance')} />
            <Input label="Prochaine révision" type="date" {...register('date_revision')} />
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6">
          <h2 className="section-title mb-3">Notes</h2>
          <textarea
            rows={3}
            placeholder="Informations complémentaires, historique, remarques…"
            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            {...register('notes')}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting}>
            <Save size={14} /> {isEdit ? 'Enregistrer' : 'Ajouter'}
          </Button>
          <Link to="/vehicules">
            <Button type="button" variant="secondary">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
