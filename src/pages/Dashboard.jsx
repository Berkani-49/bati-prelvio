import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, TrendingUp, CheckCircle, Clock, Plus, HardHat, Receipt, Euro, Truck, AlertTriangle, CalendarDays, Bell, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useAutoRelance } from '../hooks/useAutoRelance'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { SkeletonDashboard } from '../components/ui/Skeleton'

function euro(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0)
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card p-4 md:p-5 flex items-start gap-3 md:gap-4">
      <div className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl ${color} shrink-0`}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
        <p className="text-xl md:text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 hidden md:block">{sub}</p>}
      </div>
    </div>
  )
}

function RecentCard({ item }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.numero}</p>
        <p className="text-xs text-gray-500 truncate">{item.clients?.nom || '—'}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-gray-900">{euro(item.total_ttc)}</p>
        <Badge statut={item.statut} />
      </div>
    </div>
  )
}

function buildAlertes({ devis, factures, vehicules, chantiers }) {
  const alertes = []
  const today = new Date()

  // Devis envoyés sans réponse depuis 7j+
  const devisSansReponse = (devis || []).filter(d => {
    if (d.statut !== 'envoye') return false
    const age = (today - new Date(d.created_at)) / 86400000
    return age >= 7
  })
  if (devisSansReponse.length > 0) {
    alertes.push({
      id: 'devis-sans-reponse',
      type: 'warning',
      icon: FileText,
      title: `${devisSansReponse.length} devis sans réponse depuis 7j+`,
      desc: 'Pensez à relancer vos clients.',
      link: '/devis',
      linkLabel: 'Voir les devis',
    })
  }

  // Factures en retard
  const facturesEnRetard = (factures || []).filter(f => f.statut === 'en_retard')
  if (facturesEnRetard.length > 0) {
    const total = facturesEnRetard.reduce((s, f) => s + (f.total_ttc || 0), 0)
    alertes.push({
      id: 'factures-retard',
      type: 'danger',
      icon: Receipt,
      title: `${facturesEnRetard.length} facture${facturesEnRetard.length > 1 ? 's' : ''} en retard`,
      desc: `${euro(total)} impayé${facturesEnRetard.length > 1 ? 's' : ''} à relancer.`,
      link: '/factures',
      linkLabel: 'Voir les factures',
    })
  }

  // Véhicules avec échéance dans 30j
  const in30 = new Date(); in30.setDate(today.getDate() + 30)
  const vehs = (vehicules || []).filter(v =>
    ['date_controle_tech', 'date_assurance', 'date_revision'].some(f => v[f] && new Date(v[f]) <= in30)
  )
  if (vehs.length > 0) {
    alertes.push({
      id: 'vehicules-alerte',
      type: 'warning',
      icon: Truck,
      title: `${vehs.length} véhicule${vehs.length > 1 ? 's' : ''} avec échéance sous 30j`,
      desc: 'Contrôle technique, assurance ou révision à planifier.',
      link: '/vehicules',
      linkLabel: 'Voir les véhicules',
    })
  }

  // Chantiers en cours sans activité récente (aucune tâche / note récente)
  const chantiersEnCours = (chantiers || []).filter(c => c.statut === 'en_cours')
  if (chantiersEnCours.length >= 3) {
    alertes.push({
      id: 'chantiers-actifs',
      type: 'info',
      icon: HardHat,
      title: `${chantiersEnCours.length} chantiers en cours`,
      desc: 'Pensez à mettre à jour le journal et les tâches.',
      link: '/chantiers',
      linkLabel: 'Voir les chantiers',
    })
  }

  return alertes
}

const ALERTE_STYLES = {
  danger:  { bar: 'bg-red-500',    bg: 'bg-red-50 border-red-200',    icon: 'text-red-500',    text: 'text-red-800'  },
  warning: { bar: 'bg-amber-500',  bg: 'bg-amber-50 border-amber-200', icon: 'text-amber-500', text: 'text-amber-800'},
  info:    { bar: 'bg-orange-500',   bg: 'bg-orange-50 border-orange-200',   icon: 'text-orange-500',  text: 'text-orange-800' },
}

export default function Dashboard() {
  const { user }          = useAuth()
  useAutoRelance(user?.id)
  const [stats, setStats] = useState(null)
  const [recentDevis, setRecentDevis]         = useState([])
  const [recentFactures, setRecentFactures]   = useState([])
  const [alertes, setAlertes]                 = useState([])
  const [loading, setLoading]                 = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [
      { data: devis },
      { data: accepted },
      { data: chantiers },
      { data: factures },
      { data: facPaid },
      { data: vehicules },
    ] = await Promise.all([
      supabase.from('devis').select('id, numero, statut, total_ttc, created_at, clients(nom)').order('created_at', { ascending: false }),
      supabase.from('devis').select('total_ttc').eq('statut', 'accepte'),
      supabase.from('chantiers').select('id, statut'),
      supabase.from('factures').select('id, numero, statut, total_ttc, created_at, clients(nom)').order('created_at', { ascending: false }),
      supabase.from('factures').select('total_ttc').eq('statut', 'payee'),
      supabase.from('vehicules').select('id, statut, date_controle_tech, date_assurance, date_revision'),
    ])

    const allDevis     = devis     || []
    const allChantiers = chantiers || []
    const allFactures  = factures  || []
    const allVehicules = vehicules || []

    const caDevisAccepte = (accepted || []).reduce((s, d) => s + (d.total_ttc || 0), 0)
    const caFacturePaye  = (facPaid  || []).reduce((s, f) => s + (f.total_ttc || 0), 0)

    const today = new Date()
    const in30  = new Date(); in30.setDate(today.getDate() + 30)
    const vehiculesAlertes = allVehicules.filter(v =>
      ['date_controle_tech', 'date_assurance', 'date_revision'].some(field => {
        if (!v[field]) return false
        return new Date(v[field]) <= in30
      })
    ).length

    setStats({
      devisTotal:         allDevis.length,
      devisEnCours:       allDevis.filter(d => d.statut === 'envoye').length,
      caDevisAccepte,
      chantiersEnCours:   allChantiers.filter(c => c.statut === 'en_cours').length,
      chantiersTermines:  allChantiers.filter(c => c.statut === 'termine').length,
      facturesTotal:      allFactures.length,
      facturesEnRetard:   allFactures.filter(f => f.statut === 'en_retard').length,
      caFacturePaye,
      vehiculesTotal:     allVehicules.length,
      vehiculesEnService: allVehicules.filter(v => v.statut === 'en_service').length,
      vehiculesAlertes,
    })

    setRecentDevis(allDevis.slice(0, 4))
    setRecentFactures(allFactures.slice(0, 4))
    setAlertes(buildAlertes({ devis: allDevis, factures: allFactures, vehicules: allVehicules, chantiers: allChantiers }))
    setLoading(false)
  }

  const firstName  = user?.email?.split('@')[0] || 'là'
  const metier     = localStorage.getItem('cp_metier') || 'autre'
  const metierLabel = metier === 'plombier' ? '🔧 Plombier' : metier === 'electricien' ? '⚡ Électricien' : null

  if (loading) return <SkeletonDashboard />

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900">
            Bonjour, {firstName} 👋
            {metierLabel && (
              <span className="ml-2 text-sm font-medium text-gray-400 align-middle">{metierLabel}</span>
            )}
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link to="/devis/nouveau">
          <Button size="sm"><Plus size={14} /><span className="hidden sm:inline">Nouveau devis</span><span className="sm:hidden">Devis</span></Button>
        </Link>
      </div>

      {/* Stats — Devis */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Devis</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={FileText}    label="Total devis"      value={stats.devisTotal}           color="bg-slate-600" />
          <StatCard icon={TrendingUp}  label="CA accepté"       value={euro(stats.caDevisAccepte)} color="bg-primary-600" sub="Devis acceptés" />
          <StatCard icon={Clock}       label="En attente"       value={stats.devisEnCours}         color="bg-amber-500"   sub="Envoyés non traités" />
          <StatCard icon={CheckCircle} label="Chantiers actifs" value={stats.chantiersEnCours}     color="bg-orange-500"    sub="En cours" />
        </div>
      </div>

      {/* Stats — Facturation */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Facturation</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Receipt}     label="Total factures"      value={stats.facturesTotal}       color="bg-violet-600" />
          <StatCard icon={Euro}        label="CA encaissé"         value={euro(stats.caFacturePaye)} color="bg-green-600"   sub="Factures payées" />
          <StatCard icon={HardHat}     label="Chantiers terminés"  value={stats.chantiersTermines}   color="bg-teal-500" />
          <StatCard icon={Clock}       label="Factures en retard"  value={stats.facturesEnRetard}    color="bg-red-500"    sub="À relancer" />
        </div>
      </div>

      {/* Stats — Terrain */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Terrain</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Truck}         label="Véhicules"          value={stats.vehiculesTotal}       color="bg-slate-600" />
          <StatCard icon={Truck}         label="En service"         value={stats.vehiculesEnService}   color="bg-orange-500"  sub="Actuellement déployés" />
          <StatCard icon={AlertTriangle} label="Alertes maintenance" value={stats.vehiculesAlertes}    color={stats.vehiculesAlertes > 0 ? 'bg-amber-500' : 'bg-gray-400'} sub="Échéances dans 30j" />
          <Link to="/planning" className="card p-4 md:p-5 flex items-start gap-3 md:gap-4 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl bg-teal-500 shrink-0">
              <CalendarDays size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500">Planning</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5 group-hover:text-teal-600">Voir →</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Alertes intelligentes */}
      {alertes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={14} className="text-gray-500" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alertes</p>
          </div>
          {alertes.map(a => {
            const s = ALERTE_STYLES[a.type]
            const Icon = a.icon
            return (
              <div key={a.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${s.bg} overflow-hidden relative`}>
                <div className={`absolute left-0 inset-y-0 w-1 ${s.bar}`} />
                <Icon size={16} className={`${s.icon} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${s.text}`}>{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
                </div>
                <Link to={a.link} className={`shrink-0 flex items-center gap-1 text-xs font-medium ${s.text} hover:underline`}>
                  {a.linkLabel} <ChevronRight size={12} />
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Devis récents + Factures récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Devis récents */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Devis récents</h2>
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
            <>
              {/* Table desktop */}
              <div className="card overflow-hidden hidden sm:block">
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
              {/* Cards mobile */}
              <div className="card overflow-hidden sm:hidden">
                {recentDevis.map(d => <RecentCard key={d.id} item={d} type="devis" />)}
              </div>
            </>
          )}
        </div>

        {/* Factures récentes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Factures récentes</h2>
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
            <>
              {/* Table desktop */}
              <div className="card overflow-hidden hidden sm:block">
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
              {/* Cards mobile */}
              <div className="card overflow-hidden sm:hidden">
                {recentFactures.map(f => <RecentCard key={f.id} item={f} type="facture" />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
