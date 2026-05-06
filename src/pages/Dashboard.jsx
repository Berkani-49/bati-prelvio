import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, TrendingUp, CheckCircle, Clock, Plus, HardHat, Receipt, Euro } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

function euro(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0)
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${color} shrink-0`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user }          = useAuth()
  const [stats, setStats] = useState(null)
  const [recentDevis, setRecentDevis]     = useState([])
  const [recentFactures, setRecentFactures] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [
      { data: devis },
      { data: accepted },
      { data: chantiers },
      { data: factures },
      { data: facPaid },
    ] = await Promise.all([
      supabase.from('devis').select('id, numero, statut, total_ttc, created_at, clients(nom)').order('created_at', { ascending: false }),
      supabase.from('devis').select('total_ttc').eq('statut', 'accepte'),
      supabase.from('chantiers').select('id, statut'),
      supabase.from('factures').select('id, numero, statut, total_ttc, created_at, clients(nom)').order('created_at', { ascending: false }),
      supabase.from('factures').select('total_ttc').eq('statut', 'payee'),
    ])

    const allDevis    = devis    || []
    const allChantiers = chantiers || []
    const allFactures = factures || []

    const caDevisAccepte = (accepted || []).reduce((s, d) => s + (d.total_ttc || 0), 0)
    const caFacturePaye  = (facPaid  || []).reduce((s, f) => s + (f.total_ttc || 0), 0)

    setStats({
      devisTotal:      allDevis.length,
      devisEnCours:    allDevis.filter(d => d.statut === 'envoye').length,
      caDevisAccepte,
      chantiersEnCours: allChantiers.filter(c => c.statut === 'en_cours').length,
      chantiersTermines: allChantiers.filter(c => c.statut === 'termine').length,
      facturesTotal:    allFactures.length,
      facturesEnRetard: allFactures.filter(f => f.statut === 'en_retard').length,
      caFacturePaye,
    })

    setRecentDevis(allDevis.slice(0, 4))
    setRecentFactures(allFactures.slice(0, 4))
    setLoading(false)
  }

  const firstName = user?.email?.split('@')[0] || 'là'

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner /></div>
  )

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bonjour, {firstName} 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link to="/devis/nouveau">
          <Button size="sm"><Plus size={14} /> Nouveau devis</Button>
        </Link>
      </div>

      {/* Stats row 1 — Devis */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Devis</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText}    label="Total devis"    value={stats.devisTotal}             color="bg-slate-600" />
          <StatCard icon={TrendingUp}  label="CA accepté"     value={euro(stats.caDevisAccepte)}   color="bg-primary-600" sub="Devis acceptés" />
          <StatCard icon={Clock}       label="En attente"     value={stats.devisEnCours}            color="bg-amber-500"   sub="Envoyés non traités" />
          <StatCard icon={CheckCircle} label="Chantiers actifs" value={stats.chantiersEnCours}     color="bg-blue-500"    sub="En cours" />
        </div>
      </div>

      {/* Stats row 2 — Facturation */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Facturation</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Receipt}     label="Total factures"     value={stats.facturesTotal}       color="bg-violet-600" />
          <StatCard icon={Euro}        label="CA encaissé"        value={euro(stats.caFacturePaye)} color="bg-green-600"   sub="Factures payées" />
          <StatCard icon={HardHat}     label="Chantiers terminés" value={stats.chantiersTermines}   color="bg-teal-500" />
          <StatCard icon={Clock}       label="Factures en retard" value={stats.facturesEnRetard}    color="bg-red-500"    sub="À relancer" />
        </div>
      </div>

      {/* Deux colonnes : devis récents + factures récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Devis récents */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Devis récents</h2>
            <Link to="/devis" className="text-sm text-primary-600 hover:text-primary-800 font-medium">Voir tous →</Link>
          </div>
          {recentDevis.length === 0 ? (
            <div className="card p-8 text-center">
              <FileText size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Aucun devis</p>
              <Link to="/devis/nouveau" className="inline-block mt-3">
                <Button size="sm"><Plus size={14} /> Créer un devis</Button>
              </Link>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">N°</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Client</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">TTC</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentDevis.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{d.numero}</td>
                      <td className="px-4 py-2.5 text-gray-600 truncate max-w-[100px]">{d.clients?.nom || '—'}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{euro(d.total_ttc)}</td>
                      <td className="px-4 py-2.5 text-center"><Badge statut={d.statut} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Factures récentes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Factures récentes</h2>
            <Link to="/factures" className="text-sm text-primary-600 hover:text-primary-800 font-medium">Voir toutes →</Link>
          </div>
          {recentFactures.length === 0 ? (
            <div className="card p-8 text-center">
              <Receipt size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Aucune facture</p>
              <Link to="/factures/nouvelle" className="inline-block mt-3">
                <Button size="sm"><Plus size={14} /> Créer une facture</Button>
              </Link>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">N°</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Client</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">TTC</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentFactures.map(f => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{f.numero}</td>
                      <td className="px-4 py-2.5 text-gray-600 truncate max-w-[100px]">{f.clients?.nom || '—'}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{euro(f.total_ttc)}</td>
                      <td className="px-4 py-2.5 text-center"><Badge statut={f.statut} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
