import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, HardHat, MoreHorizontal, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { SkeletonListPage } from '../../components/ui/Skeleton'
import ConfirmModal from '../../components/ui/ConfirmModal'
import toast from 'react-hot-toast'

const STATUTS = ['tous', 'en_attente', 'en_cours', 'termine', 'annule']

const STATUT_LABELS = {
  tous:       'Tous',
  en_attente: 'En attente',
  en_cours:   'En cours',
  termine:    'Terminé',
  annule:     'Annulé',
}

export default function ChantierListPage() {
  const [chantiers, setChantiers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filtre, setFiltre]       = useState('tous')
  const [search, setSearch]       = useState('')
  const [menuOpen, setMenuOpen]   = useState(null)
  const [menuPos, setMenuPos]     = useState({ top: 0, right: 0 })
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => { fetchChantiers() }, [filtre])

  async function fetchChantiers() {
    setLoading(true)
    let query = supabase
      .from('chantiers')
      .select('*, clients(nom)')
      .order('created_at', { ascending: false })

    if (filtre !== 'tous') query = query.eq('statut', filtre)

    const { data, error } = await query
    if (error) toast.error('Erreur chargement')
    setChantiers(data || [])
    setLoading(false)
  }

  function toggleMenu(e, id) {
    if (menuOpen === id) { setMenuOpen(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right })
    setMenuOpen(id)
  }

  async function updateStatut(id, statut) {
    const { error } = await supabase.from('chantiers').update({ statut }).eq('id', id)
    if (error) { toast.error('Erreur mise à jour'); return }
    setChantiers(prev => prev.map(c => c.id === id ? { ...c, statut } : c))
    setMenuOpen(null)
    toast.success('Statut mis à jour')
  }

  function handleDelete(id) {
    setMenuOpen(null)
    setConfirmId(id)
  }

  async function doDelete() {
    const { error } = await supabase.from('chantiers').delete().eq('id', confirmId)
    if (error) { toast.error('Erreur suppression'); return }
    setChantiers(prev => prev.filter(c => c.id !== confirmId))
    setConfirmId(null)
    toast.success('Chantier supprimé')
  }

  const filtered = chantiers.filter(c =>
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.clients?.nom?.toLowerCase().includes(search.toLowerCase())
  )

  const openChantier = filtered.find(c => c.id === menuOpen)

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR')
  }

  if (loading) return <SkeletonListPage rows={5} />

  return (
    <div className="p-4 md:p-6 max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chantiers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{chantiers.length} chantier{chantiers.length > 1 ? 's' : ''}</p>
        </div>
        <Link to="/chantiers/nouveau">
          <Button size="sm"><Plus size={14} /> Nouveau chantier</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {STATUTS.map(s => (
            <button
              key={s}
              onClick={() => setFiltre(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filtre === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {STATUT_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full h-8 pl-8 pr-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 card">
          <HardHat size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Aucun chantier trouvé</p>
          {!search && (
            <Link to="/chantiers/nouveau" className="mt-4">
              <Button size="sm"><Plus size={14} /> Créer un chantier</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Chantier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Début</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Fin prévue</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/chantiers/${c.id}`} className="font-medium text-gray-900 hover:text-primary-600 transition-colors">{c.nom}</Link>
                    {c.adresse && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{c.adresse}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.clients?.nom || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{formatDate(c.date_debut)}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{formatDate(c.date_fin)}</td>
                  <td className="px-4 py-3 text-center"><Badge statut={c.statut} /></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={e => toggleMenu(e, c.id)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {menuOpen && openChantier && (
        <div
          style={{ top: menuPos.top, right: menuPos.right }}
          className="fixed z-50 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
        >
          <Link
            to={`/chantiers/${openChantier.id}/edit`}
            className="flex w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 items-center gap-2"
            onClick={() => setMenuOpen(null)}
          >
            Modifier
          </Link>

          <div className="h-px bg-gray-100 my-1" />
          <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Changer statut</p>

          {['en_attente', 'en_cours', 'termine', 'annule'].map(s => (
            <button
              key={s}
              onClick={() => updateStatut(openChantier.id, s)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {STATUT_LABELS[s]}
            </button>
          ))}

          <div className="h-px bg-gray-100 my-1" />
          <button
            onClick={() => handleDelete(openChantier.id)}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Supprimer
          </button>
        </div>
      )}

      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />}

      {confirmId && (
        <ConfirmModal
          title="Supprimer ce chantier ?"
          message="Cette action est irréversible."
          confirmLabel="Supprimer"
          onConfirm={doDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}
