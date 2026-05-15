import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { FileText, Receipt, Download, CheckCircle, Clock, XCircle, AlertCircle, Phone, Mail, MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { generateDevisPDF, downloadPDF, generateFacturePDF } from '../../lib/pdf'
import { getEntrepriseData, fetchLogoBase64 } from '../../lib/entreprise'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

function euro(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0)
}

function StatutBadge({ statut }) {
  const cfg = {
    brouillon:  { label: 'Brouillon',   cls: 'bg-gray-100 text-gray-600' },
    envoye:     { label: 'En attente',  cls: 'bg-amber-100 text-amber-700' },
    envoyee:    { label: 'Émise',       cls: 'bg-orange-100 text-orange-700' },
    accepte:    { label: 'Accepté',     cls: 'bg-green-100 text-green-700' },
    refuse:     { label: 'Refusé',      cls: 'bg-red-100 text-red-700' },
    payee:      { label: 'Payée',       cls: 'bg-green-100 text-green-700' },
    en_retard:  { label: 'En retard',   cls: 'bg-red-100 text-red-700' },
    annulee:    { label: 'Annulée',     cls: 'bg-gray-100 text-gray-500' },
  }
  const { label, cls } = cfg[statut] || { label: statut, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
}

function StatutIcon({ statut }) {
  if (['payee', 'accepte'].includes(statut)) return <CheckCircle size={14} className="text-green-600" />
  if (['en_retard', 'refuse'].includes(statut)) return <XCircle size={14} className="text-red-500" />
  if (['envoye', 'envoyee'].includes(statut)) return <Clock size={14} className="text-amber-500" />
  return <AlertCircle size={14} className="text-gray-400" />
}

export default function PortailClientPage() {
  const { token } = useParams()
  const [client, setClient]       = useState(null)
  const [devis, setDevis]         = useState([])
  const [factures, setFactures]   = useState([])
  const [entreprise, setEntreprise] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [activeTab, setActiveTab] = useState('devis')
  const [downloading, setDownloading] = useState(null)

  useEffect(() => { loadData() }, [token])

  async function loadData() {
    try {
      // RPC sécurisé — ne retourne QUE les données du token, aucune fuite possible
      const [{ data: portail, error: rpcErr }, entrepriseData] = await Promise.all([
        supabase.rpc('get_portail_data', { p_token: token }),
        getEntrepriseData(),
      ])

      if (rpcErr || !portail) {
        setError('Lien invalide ou expiré.')
        setLoading(false)
        return
      }

      setClient(portail.client)
      setDevis(portail.devis || [])
      setFactures(portail.factures || [])
      setEntreprise(entrepriseData)
      setLoading(false)
    } catch {
      setError('Une erreur est survenue.')
      setLoading(false)
    }
  }

  async function downloadDevisPDF(d) {
    setDownloading(d.id)
    try {
      const logoBase64 = await fetchLogoBase64(entreprise?.logo_url)
      const doc = generateDevisPDF({
        devis: d, client, lignes: d.lignes || [], entreprise, logoBase64,
      })
      downloadPDF(doc, `devis-${d.numero}.pdf`)
    } catch {
      toast.error('Erreur téléchargement')
    } finally {
      setDownloading(null)
    }
  }

  async function downloadFacturePDF(f) {
    setDownloading(f.id)
    try {
      const logoBase64 = await fetchLogoBase64(entreprise?.logo_url)
      const doc = generateFacturePDF({
        facture: f, client, lignes: f.lignes || [], entreprise, logoBase64,
      })
      downloadPDF(doc, `facture-${f.numero}.pdf`)
    } catch {
      toast.error('Erreur téléchargement')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Spinner size={28} /></div>
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <XCircle size={40} className="text-red-400 mb-3" />
        <h1 className="text-lg font-semibold text-gray-900">Lien invalide</h1>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
        <p className="text-xs text-gray-400 mt-4">Contactez votre prestataire pour obtenir un nouveau lien.</p>
      </div>
    )
  }

  const totalDevisAccepte   = devis.filter(d => d.statut === 'accepte').reduce((s, d) => s + (d.total_ttc || 0), 0)
  const totalFacturesPaye   = factures.filter(f => f.statut === 'payee').reduce((s, f) => s + (f.total_ttc || 0), 0)
  const totalFacturesRestant = factures.filter(f => ['envoyee', 'en_retard'].includes(f.statut)).reduce((s, f) => s + (f.total_ttc || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3 mb-1">
            {entreprise?.logo_url && (
              <img src={entreprise.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
            )}
            <span className="font-bold text-lg">{entreprise?.nom || 'Votre prestataire'}</span>
          </div>
          <p className="text-slate-400 text-sm">Espace client de {client.nom}</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Infos client */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <span className="text-orange-700 font-bold text-sm">{client.nom.slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{client.nom}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                {client.email && <span className="flex items-center gap-1 text-xs text-gray-500"><Mail size={11} />{client.email}</span>}
                {client.tel   && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone size={11} />{client.tel}</span>}
                {client.adresse && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={11} />{client.adresse}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Résumé financier */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Devis acceptés</p>
            <p className="text-lg font-bold text-gray-900">{euro(totalDevisAccepte)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Factures payées</p>
            <p className="text-lg font-bold text-green-700">{euro(totalFacturesPaye)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Reste à payer</p>
            <p className={`text-lg font-bold ${totalFacturesRestant > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
              {euro(totalFacturesRestant)}
            </p>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => setActiveTab('devis')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'devis' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <FileText size={14} /> Devis ({devis.length})
          </button>
          <button onClick={() => setActiveTab('factures')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'factures' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Receipt size={14} /> Factures ({factures.length})
          </button>
        </div>

        {/* Liste devis */}
        {activeTab === 'devis' && (
          <div className="space-y-2">
            {devis.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <FileText size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Aucun devis disponible</p>
              </div>
            ) : devis.map(d => (
              <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <StatutIcon statut={d.statut} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{d.numero}</span>
                    <StatutBadge statut={d.statut} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">{euro(d.total_ttc)}</p>
                  <button onClick={() => downloadDevisPDF(d)} disabled={downloading === d.id}
                    className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 mt-1 disabled:opacity-50">
                    <Download size={11} />{downloading === d.id ? 'PDF…' : 'PDF'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Liste factures */}
        {activeTab === 'factures' && (
          <div className="space-y-2">
            {factures.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <Receipt size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Aucune facture disponible</p>
              </div>
            ) : factures.map(f => (
              <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <StatutIcon statut={f.statut} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{f.numero}</span>
                    <StatutBadge statut={f.statut} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(f.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {f.date_echeance && <span className="ml-2">· Échéance : {new Date(f.date_echeance + 'T12:00:00').toLocaleDateString('fr-FR')}</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">{euro(f.total_ttc)}</p>
                  <button onClick={() => downloadFacturePDF(f)} disabled={downloading === f.id}
                    className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 mt-1 disabled:opacity-50">
                    <Download size={11} />{downloading === f.id ? 'PDF…' : 'PDF'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Espace client sécurisé · {entreprise?.nom || 'Bati Prelvio'}
        </p>
      </div>
    </div>
  )
}
