import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Download, MoreHorizontal, FileText, Search, Pencil, FileDown } from 'lucide-react'
import ConfirmModal from '../ui/ConfirmModal'

import { supabase } from '../../lib/supabase'
import { generateDevisPDF, downloadPDF } from '../../lib/pdf'
import { getEntrepriseData, fetchLogoBase64 } from '../../lib/entreprise'
import { exportDevisCSV } from '../../lib/csv'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import toast from 'react-hot-toast'

const STATUTS = ['tous', 'brouillon', 'envoye', 'accepte', 'refuse']

const STATUT_LABELS = {
  tous:      'Tous',
  brouillon: 'Brouillon',
  envoye:    'Envoyé',
  accepte:   'Accepté',
  refuse:    'Refusé',
}

function euro(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0)
}

export default function DevisList() {
  const navigate                = useNavigate()
  const [devis, setDevis]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [filtre, setFiltre]     = useState('tous')
  const [search, setSearch]     = useState('')
  const [menuOpen, setMenuOpen] = useState(null)
  const [menuPos, setMenuPos]   = useState({ top: 0, right: 0 })
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => { fetchDevis() }, [filtre])

  async function fetchDevis() {
    setLoading(true)
    let query = supabase
      .from('devis')
      .select('*, clients(nom, email)')
      .order('created_at', { ascending: false })

    if (filtre !== 'tous') query = query.eq('statut', filtre)

    const { data, error } = await query
    if (error) toast.error('Erreur chargement')
    setDevis(data || [])
    setLoading(false)
  }

  function toggleMenu(e, id) {
    if (menuOpen === id) { setMenuOpen(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({
      top:   rect.bottom + window.scrollY + 4,
      right: window.innerWidth - rect.right,
    })
    setMenuOpen(id)
  }

  async function updateStatut(id, statut) {
    const { error } = await supabase.from('devis').update({ statut }).eq('id', id)
    if (error) { toast.error('Erreur mise à jour'); return }
    setDevis(prev => prev.map(d => d.id === id ? { ...d, statut } : d))
    setMenuOpen(null)
    toast.success('Statut mis à jour')
  }

  async function handleDownload(d) {
    const [{ data: lignes }, entreprise] = await Promise.all([
      supabase.from('lignes_devis').select('*').eq('devis_id', d.id),
      getEntrepriseData(),
    ])
    const logoBase64 = await fetchLogoBase64(entreprise?.logo_url)
    const doc = generateDevisPDF({ devis: d, client: d.clients, lignes: lignes || [], entreprise, logoBase64 })
    downloadPDF(doc, `devis-${d.numero}.pdf`)
    toast.success('PDF téléchargé')
    setMenuOpen(null)
  }

  function handleDelete(id) {
    setMenuOpen(null)
    setConfirmId(id)
  }

  async function doDelete() {
    const { error } = await supabase.from('devis').delete().eq('id', confirmId)
    if (error) { toast.error('Erreur suppression'); return }
    setDevis(prev => prev.filter(d => d.id !== confirmId))
    setConfirmId(null)
    toast.success('Devis supprimé')
  }

  const filtered = devis.filter(d =>
    d.numero?.toLowerCase().includes(search.toLowerCase()) ||
    d.clients?.nom?.toLowerCase().includes(search.toLowerCase())
  )

  const openDevis = filtered.find(x => x.id === menuOpen)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {STATUTS.map(s => (
            <button
              key={s}
              onClick={() => setFiltre(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filtre === s
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
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

        <Button size="sm" variant="secondary" onClick={() => exportDevisCSV(filtered)} title="Exporter en CSV">
          <FileDown size={14} /> CSV
        </Button>

        <Link to="/devis/nouveau">
          <Button size="sm"><Plus size={14} /> Nouveau devis</Button>
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 card">
          <FileText size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Aucun devis trouvé</p>
          <p className="text-gray-400 text-sm mt-1">
            {search ? 'Essayez un autre terme' : 'Créez votre premier devis'}
          </p>
          {!search && (
            <Link to="/devis/nouveau" className="mt-4">
              <Button size="sm"><Plus size={14} /> Créer un devis</Button>
            </Link>
          )}
        </div>
      ) : (
        // overflow-hidden retiré → les dropdowns ne sont plus clippés
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N° Devis</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total TTC</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{d.numero}</td>
                  <td className="px-4 py-3 text-gray-700">{d.clients?.nom || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {new Date(d.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{euro(d.total_ttc)}</td>
                  <td className="px-4 py-3 text-center"><Badge statut={d.statut} /></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={e => toggleMenu(e, d.id)}
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

      {/* Dropdown rendu en position fixed — hors de tout overflow-hidden */}
      {menuOpen && openDevis && (
        <div
          style={{ top: menuPos.top, right: menuPos.right }}
          className="fixed z-50 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
        >
          <button
            onClick={() => { navigate(`/devis/${openDevis.id}/edit`); setMenuOpen(null) }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Pencil size={14} /> Modifier
          </button>
          <button
            onClick={() => handleDownload(openDevis)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Download size={14} /> Télécharger PDF
          </button>

          <div className="h-px bg-gray-100 my-1" />
          <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Changer statut</p>

          {['brouillon', 'envoye', 'accepte', 'refuse'].map(s => (
            <button
              key={s}
              onClick={() => updateStatut(openDevis.id, s)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {STATUT_LABELS[s]}
            </button>
          ))}

          <div className="h-px bg-gray-100 my-1" />
          <button
            onClick={() => handleDelete(openDevis.id)}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Supprimer
          </button>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
      )}

      {confirmId && (
        <ConfirmModal
          title="Supprimer ce devis ?"
          message="Cette action est irréversible."
          confirmLabel="Supprimer"
          onConfirm={doDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}
