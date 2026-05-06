import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Users, X, Search, Pencil, Trash2 } from 'lucide-react'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const schema = z.object({
  nom:     z.string().min(1, 'Nom obligatoire'),
  email:   z.string().email('Email invalide').or(z.literal('')),
  tel:     z.string().optional().default(''),
  adresse: z.string().optional().default(''),
})

function ClientModal({ client, onClose, onSaved }) {
  const { user } = useAuth()
  const isEdit = !!client?.id

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nom:     client?.nom     || '',
      email:   client?.email   || '',
      tel:     client?.tel     || '',
      adresse: client?.adresse || '',
    },
  })

  async function onSubmit(data) {
    try {
      if (isEdit) {
        const { error } = await supabase
          .from('clients')
          .update(data)
          .eq('id', client.id)
        if (error) throw error
        toast.success('Client modifié')
      } else {
        const { error } = await supabase
          .from('clients')
          .insert({ ...data, user_id: user.id })
        if (error) throw error
        toast.success('Client ajouté')
      }
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Erreur')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Modifier le client' : 'Nouveau client'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input
            label="Nom *"
            placeholder="Jean Dupont ou SARL Martin"
            error={errors.nom?.message}
            {...register('nom')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="client@exemple.fr"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Téléphone"
            type="tel"
            placeholder="06 12 34 56 78"
            {...register('tel')}
          />
          <Input
            label="Adresse"
            placeholder="12 rue de la Paix, 75001 Paris"
            {...register('adresse')}
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={isSubmitting} className="flex-1">
              {isEdit ? 'Enregistrer' : 'Ajouter le client'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const [clients, setClients]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => { fetchClients() }, [])

  async function fetchClients() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*, devis(id)')
      .order('created_at', { ascending: false })

    if (error) toast.error('Erreur chargement')
    setClients(data || [])
    setLoading(false)
  }

  function handleDelete(id) {
    setConfirmId(id)
  }

  async function doDelete() {
    const { error } = await supabase.from('clients').delete().eq('id', confirmId)
    if (error) { toast.error('Erreur suppression'); return }
    setClients(prev => prev.filter(c => c.id !== confirmId))
    setConfirmId(null)
    toast.success('Client supprimé')
  }

  const filtered = clients.filter(c =>
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} client{clients.length > 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setModal({})}>
          <Plus size={14} /> Nouveau client
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="w-full h-8 pl-8 pr-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 card">
          <Users size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {search ? 'Aucun client trouvé' : 'Aucun client encore'}
          </p>
          {!search && (
            <Button size="sm" className="mt-4" onClick={() => setModal({})}>
              <Plus size={14} /> Ajouter un client
            </Button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Téléphone</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Devis</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.nom}</p>
                    {c.adresse && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{c.adresse}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{c.tel || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {c.devis?.length || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModal(c)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <ClientModal
          client={modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchClients() }}
        />
      )}

      {confirmId && (
        <ConfirmModal
          title="Supprimer ce client ?"
          message="Ses devis associés ne seront pas supprimés."
          confirmLabel="Supprimer"
          onConfirm={doDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}
