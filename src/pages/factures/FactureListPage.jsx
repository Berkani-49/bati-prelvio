import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Receipt, MoreHorizontal, Search, Download, Send, Pencil, FileDown } from 'lucide-react'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { exportFacturesCSV } from '../../lib/csv'
import { supabase } from '../../lib/supabase'
import { getEntrepriseData, fetchLogoBase64 } from '../../lib/entreprise'
import { generateFacturePDF, downloadPDF, getPDFBase64 } from '../../lib/pdf'
import { sendFactureEmail } from '../../lib/email'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const STATUTS = ['tous', 'brouillon', 'envoyee', 'payee', 'en_retard']

const STATUT_LABELS = {
  tous:      'Toutes',
  brouillon: 'Brouillon',
  envoyee:   'Envoyée',
  payee:     'Payée',
  en_retard: 'En retard',
}

function euro(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0)
}

export default function FactureListPage() {
  const navigate                = useNavigate()
  const [factures, setFactures] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filtre, setFiltre]     = useState('tous')
  const [search, setSearch]     = useState('')
  const [menuOpen, setMenuOpen] = useState(null)
  const [menuPos, setMenuPos]   = useState({ top: 0, right: 0 })
  const [sending, setSending]   = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => { fetchFactures() }, [filtre])

  async function fetchFactures() {
    setLoading(true)
    let query = supabase
      .from('factures')
      .select('*, clients(nom, email)')
      .order('created_at', { ascending: false })

    if (filtre !== 'tous') query = query.eq('statut', filtre)

    const { data, error } = await query
    if (error) toast.error('Erreur chargement')
    setFactures(data || [])
    setLoading(false)
  }

  function toggleMenu(e, id) {
    if (menuOpen === id) { setMenuOpen(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right })
    setMenuOpen(id)
  }

  async function updateStatut(id, statut) {
    const { error } = await supabase.from('factures').update({ statut }).eq('id', id)
    if (error) { toast.error('Erreur mise à jour'); return }
    setFactures(prev => prev.map(f => f.id === id ? { ...f, statut } : f))
    setMenuOpen(null)
    toast.success('Statut mis à jour')
  }

  async function handleDownload(f) {
    const [{ data: lignes }, entreprise] = await Promise.all([
      supabase.from('lignes_facture').select('*').eq('facture_id', f.id),
      getEntrepriseData(),
    ])
    const logoBase64 = await fetchLogoBase64(entreprise?.logo_url)
    const doc = generateFacturePDF({ facture: f, client: f.clients, lignes: lignes || [], entreprise, logoBase64 })
    downloadPDF(doc, `facture-${f.numero}.pdf`)
    toast.success('PDF téléchargé')
    setMenuOpen(null)
  }

  async function handleSendEmail(f) {
    if (!f.clients?.email) {
      toast.error('Ce client n\'a pas d\'email enregistré')
      setMenuOpen(null)
      return
    }

    setSending(f.id)
    setMenuOpen(null)
    try {
      const [{ data: lignes }, entreprise] = await Promise.all([
        supabase.from('lignes_facture').select('*').eq('facture_id', f.id),
        getEntrepriseData(),
      ])
      const logoBase64 = await fetchLogoBase64(entreprise?.logo_url)
      const doc     = generateFacturePDF({ facture: f, client: f.clients, lignes: lignes || [], entreprise, logoBase64 })
      const pdf64   = getPDFBase64(doc)

      await sendFactureEmail({
        to:             f.clients.email,
        clientName:     f.clients.nom,
        factureNumero:  f.numero,
        pdfBase64:      pdf64,
      })

      await supabase.from('factures').update({ statut: 'envoyee' }).eq('id', f.id)
      setFactures(prev => prev.map(x => x.id === f.id ? { ...x, statut: 'envoyee' } : x))
      toast.success(`Facture envoyée à ${f.clients.email}`)
    } catch (err) {
      toast.error(err.message || 'Erreur envoi email')
    } finally {
      setSending(null)
    }
  }

  function handleDelete(id) {
    setMenuOpen(null)
    setConfirmId(id)
  }

  async function doDelete() {
    const { error } = await supabase.from('factures').delete().eq('id', confirmId)
    if (error) { toast.error('Erreur suppression'); return }
    setFactures(prev => prev.filter(f => f.id !== confirmId))
    setConfirmId(null)
    toast.success('Facture supprimée')
  }

  const filtered = factures.filter(f =>
    f.numero?.toLowerCase().includes(search.toLowerCase()) ||
    f.clients?.nom?.toLowerCase().includes(search.toLowerCase())
  )

  const openFacture = filtered.find(f => f.id === menuOpen)

  return (
    <div className="p-6 max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Factures</h1>
          <p className="text-sm text-gray-500 mt-0.5">{factures.length} facture{factures.length > 1 ? 's' : ''}</p>
        </div>
        <Link to="/factures/nouvelle">
          <Button size="sm"><Plus size={14} /> Nouvelle facture</Button>
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

        <Button size="sm" variant="secondary" onClick={() => exportFacturesCSV(filtered)} title="Exporter en CSV">
          <FileDown size={14} /> CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 card">
          <Receipt size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Aucune facture trouvée</p>
          {!search && (
            <Link to="/factures/nouvelle" className="mt-4">
              <Button size="sm"><Plus size={14} /> Créer une facture</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N° Facture</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Échéance</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total TTC</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(f => (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{f.numero}</td>
                  <td className="px-4 py-3 text-gray-700">{f.clients?.nom || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {f.date_echeance ? new Date(f.date_echeance).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{euro(f.total_ttc)}</td>
                  <td className="px-4 py-3 text-center">
                    {sending === f.id
                      ? <Spinner size={14} />
                      : <Badge statut={f.statut} />
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={e => toggleMenu(e, f.id)}
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

      {menuOpen && openFacture && (
        <div
          style={{ top: menuPos.top, right: menuPos.right }}
          className="fixed z-50 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
        >
          <button
            onClick={() => { navigate(`/factures/${openFacture.id}/edit`); setMenuOpen(null) }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Pencil size={14} /> Modifier
          </button>
          <button
            onClick={() => handleDownload(openFacture)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Download size={14} /> Télécharger PDF
          </button>
          <button
            onClick={() => handleSendEmail(openFacture)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Send size={14} /> Envoyer par email
          </button>

          <div className="h-px bg-gray-100 my-1" />
          <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Changer statut</p>

          {['brouillon', 'envoyee', 'payee', 'en_retard'].map(s => (
            <button
              key={s}
              onClick={() => updateStatut(openFacture.id, s)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {STATUT_LABELS[s]}
            </button>
          ))}

          <div className="h-px bg-gray-100 my-1" />
          <button
            onClick={() => handleDelete(openFacture.id)}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Supprimer
          </button>
        </div>
      )}

      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />}

      {confirmId && (
        <ConfirmModal
          title="Supprimer cette facture ?"
          message="Cette action est irréversible."
          confirmLabel="Supprimer"
          onConfirm={doDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}
