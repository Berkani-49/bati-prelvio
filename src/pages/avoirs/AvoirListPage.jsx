import { useState, useEffect } from 'react'
import { FileX, Download, MoreHorizontal, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getEntrepriseData, fetchLogoBase64 } from '../../lib/entreprise'
import { generateAvoirPDF } from '../../lib/pdf-avoir'
import { downloadPDF } from '../../lib/pdf'
import Spinner from '../../components/ui/Spinner'
import ConfirmModal from '../../components/ui/ConfirmModal'
import toast from 'react-hot-toast'

const STATUT_LABELS = { emis: 'Émis', rembourse: 'Remboursé' }

function euro(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0)
}

export default function AvoirListPage() {
  const [avoirs, setAvoirs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [menuOpen, setMenuOpen] = useState(null)
  const [menuPos, setMenuPos]   = useState({ top: 0, right: 0 })
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => { fetchAvoirs() }, [])

  async function fetchAvoirs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('avoirs')
      .select('*, clients(nom), factures(numero)')
      .order('created_at', { ascending: false })
    if (error) toast.error('Erreur chargement')
    setAvoirs(data || [])
    setLoading(false)
  }

  function toggleMenu(e, id) {
    if (menuOpen === id) { setMenuOpen(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right })
    setMenuOpen(id)
  }

  async function updateStatut(id, statut) {
    const { error } = await supabase.from('avoirs').update({ statut }).eq('id', id)
    if (error) { toast.error('Erreur mise à jour'); return }
    setAvoirs(prev => prev.map(a => a.id === id ? { ...a, statut } : a))
    setMenuOpen(null)
    toast.success('Statut mis à jour')
  }

  async function handleDownload(a) {
    const [{ data: lignes }, entreprise] = await Promise.all([
      supabase.from('lignes_avoir').select('*').eq('avoir_id', a.id),
      getEntrepriseData(),
    ])
    const logoBase64 = await fetchLogoBase64(entreprise?.logo_url)
    const doc = generateAvoirPDF({
      avoir: a,
      client: a.clients,
      lignes: lignes || [],
      entreprise,
      logoBase64,
      factureNumero: a.factures?.numero,
    })
    downloadPDF(doc, `avoir-${a.numero}.pdf`)
    toast.success('PDF téléchargé')
    setMenuOpen(null)
  }

  async function doDelete() {
    const { error } = await supabase.from('avoirs').delete().eq('id', confirmId)
    if (error) { toast.error('Erreur suppression'); return }
    setAvoirs(prev => prev.filter(a => a.id !== confirmId))
    setConfirmId(null)
    toast.success('Avoir supprimé')
  }

  const filtered = avoirs.filter(a =>
    a.numero?.toLowerCase().includes(search.toLowerCase()) ||
    a.clients?.nom?.toLowerCase().includes(search.toLowerCase())
  )

  const openAvoir = filtered.find(a => a.id === menuOpen)

  return (
    <div className="p-6 max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Avoirs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{avoirs.length} avoir{avoirs.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="w-full h-8 pl-8 pr-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 card">
          <FileX size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Aucun avoir</p>
          <p className="text-gray-400 text-sm mt-1">Les avoirs se créent depuis une facture (menu → Créer un avoir)</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N° Avoir</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Facture liée</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total TTC</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-amber-700">{a.numero}</td>
                  <td className="px-4 py-3 text-gray-700">{a.clients?.nom || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{a.factures?.numero || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                    {new Date(a.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-700">{euro(a.total_ttc)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.statut === 'rembourse' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {STATUT_LABELS[a.statut] || a.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={e => toggleMenu(e, a.id)}
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

      {menuOpen && openAvoir && (
        <div
          style={{ top: menuPos.top, right: menuPos.right }}
          className="fixed z-50 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
        >
          <button
            onClick={() => handleDownload(openAvoir)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Download size={14} /> Télécharger PDF
          </button>
          <div className="h-px bg-gray-100 my-1" />
          <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Changer statut</p>
          {['emis', 'rembourse'].map(s => (
            <button
              key={s}
              onClick={() => updateStatut(openAvoir.id, s)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {STATUT_LABELS[s]}
            </button>
          ))}
          <div className="h-px bg-gray-100 my-1" />
          <button
            onClick={() => { setMenuOpen(null); setConfirmId(openAvoir.id) }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Supprimer
          </button>
        </div>
      )}

      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />}

      {confirmId && (
        <ConfirmModal
          title="Supprimer cet avoir ?"
          message="Cette action est irréversible."
          confirmLabel="Supprimer"
          onConfirm={doDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}
