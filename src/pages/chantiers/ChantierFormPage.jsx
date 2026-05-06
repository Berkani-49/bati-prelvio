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
  nom:         z.string().min(1, 'Nom obligatoire'),
  client_id:   z.string().optional(),
  adresse:     z.string().optional().default(''),
  statut:      z.enum(['en_attente', 'en_cours', 'termine', 'annule']),
  date_debut:  z.string().optional().default(''),
  date_fin:    z.string().optional().default(''),
  description: z.string().optional().default(''),
})

export default function ChantierFormPage() {
  const { id }          = useParams()
  const isEdit          = !!id
  const { user }        = useAuth()
  const navigate        = useNavigate()
  const [loading, setLoading]   = useState(isEdit)
  const [clients, setClients]   = useState([])

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: '', client_id: '', adresse: '',
      statut: 'en_attente', date_debut: '', date_fin: '', description: '',
    },
  })

  useEffect(() => {
    supabase.from('clients').select('id, nom').order('nom').then(({ data }) => {
      setClients(data || [])
    })

    if (isEdit) {
      supabase
        .from('chantiers')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error || !data) { toast.error('Chantier introuvable'); navigate('/chantiers'); return }
          reset({
            nom:         data.nom         || '',
            client_id:   data.client_id   || '',
            adresse:     data.adresse     || '',
            statut:      data.statut      || 'en_attente',
            date_debut:  data.date_debut  || '',
            date_fin:    data.date_fin    || '',
            description: data.description || '',
          })
          setLoading(false)
        })
    }
  }, [id, isEdit, navigate, reset])

  async function onSubmit(data) {
    try {
      const payload = {
        ...data,
        client_id:  data.client_id  || null,
        date_debut: data.date_debut || null,
        date_fin:   data.date_fin   || null,
      }

      if (isEdit) {
        const { error } = await supabase.from('chantiers').update(payload).eq('id', id)
        if (error) throw error
        toast.success('Chantier modifié')
      } else {
        const { error } = await supabase.from('chantiers').insert({ ...payload, user_id: user.id })
        if (error) throw error
        toast.success('Chantier créé')
      }
      navigate('/chantiers')
    } catch (err) {
      toast.error(err.message || 'Erreur')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/chantiers"
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Modifier le chantier' : 'Nouveau chantier'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEdit ? 'Modifiez les informations du chantier' : 'Renseignez les informations du chantier'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div>
          <h2 className="section-title mb-4">Informations générales</h2>
          <div className="space-y-4">
            <Input
              label="Nom du chantier *"
              placeholder="Rénovation salle de bain — Dupont"
              error={errors.nom?.message}
              {...register('nom')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('client_id')}
              >
                <option value="">— Aucun client —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>

            <Input
              label="Adresse du chantier"
              placeholder="12 rue de la Paix, 75001 Paris"
              {...register('adresse')}
            />
          </div>
        </div>

        <div>
          <h2 className="section-title mb-4">Planification</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('statut')}
              >
                <option value="en_attente">En attente</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
            <div />
            <Input label="Date de début" type="date" {...register('date_debut')} />
            <Input label="Date de fin prévue" type="date" {...register('date_fin')} />
          </div>
        </div>

        <div>
          <h2 className="section-title mb-4">Description</h2>
          <textarea
            rows={4}
            placeholder="Description des travaux, notes, informations importantes…"
            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            {...register('description')}
          />
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Button type="submit" loading={isSubmitting}>
            <Save size={14} /> {isEdit ? 'Enregistrer' : 'Créer le chantier'}
          </Button>
          <Link to="/chantiers">
            <Button type="button" variant="secondary">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
