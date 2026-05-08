import { useState, useEffect } from 'react'
import { TrendingUp, Euro, FileText, Receipt, FileDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { downloadCSV } from '../lib/csv'
import toast from 'react-hot-toast'

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

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

function BarChartSVG({ data, height = 220 }) {
  if (!data || data.length === 0) return null

  const maxVal = Math.max(...data.map(d => Math.max(d.devis, d.encaisse)), 1)
  const totalW  = 560
  const padLeft = 44
  const padRight = 10
  const chartW  = totalW - padLeft - padRight
  const padTop  = 20
  const padBottom = 40
  const chartH  = height - padTop - padBottom
  const n       = data.length
  const groupW  = chartW / n
  const barW    = Math.min(groupW * 0.30, 18)
  const barGap  = Math.min(groupW * 0.08, 5)

  const yLabel = v => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
    if (v >= 1000)    return `${Math.round(v / 1000)}k`
    return `${Math.round(v)}`
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${totalW} ${height}`} className="w-full min-w-[300px]">
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const y = padTop + chartH * (1 - f)
          return (
            <g key={f}>
              <line x1={padLeft} y1={y} x2={totalW - padRight} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              <text x={padLeft - 5} y={y + 4} fontSize={8} fill="#9ca3af" textAnchor="end">
                {yLabel(maxVal * f)}
              </text>
            </g>
          )
        })}

        {data.map((d, i) => {
          const cx    = padLeft + i * groupW + groupW / 2
          const devisH = (d.devis / maxVal) * chartH
          const encH   = (d.encaisse / maxVal) * chartH
          const showLabel = n <= 12 || i % 2 === 0

          return (
            <g key={i}>
              <rect
                x={cx - barW - barGap / 2}
                y={padTop + chartH - devisH}
                width={barW}
                height={Math.max(devisH, 0)}
                rx={2}
                fill="#3b82f6"
                opacity={0.82}
              />
              <rect
                x={cx + barGap / 2}
                y={padTop + chartH - encH}
                width={barW}
                height={Math.max(encH, 0)}
                rx={2}
                fill="#10b981"
                opacity={0.82}
              />
              {showLabel && (
                <text x={cx} y={padTop + chartH + 14} fontSize={9} fill="#6b7280" textAnchor="middle">
                  {d.label}
                </text>
              )}
              {n > 12 && showLabel && (
                <text x={cx} y={padTop + chartH + 25} fontSize={8} fill="#9ca3af" textAnchor="middle">
                  {String(d.year).slice(2)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function TopClients({ devis, factures }) {
  const map = {}

  devis.filter(d => d.statut === 'accepte').forEach(d => {
    const nom = d.clients?.nom || 'Inconnu'
    if (!map[nom]) map[nom] = { devis: 0, encaisse: 0 }
    map[nom].devis += d.total_ttc || 0
  })

  factures.filter(f => f.statut === 'payee').forEach(f => {
    const nom = f.clients?.nom || 'Inconnu'
    if (!map[nom]) map[nom] = { devis: 0, encaisse: 0 }
    map[nom].encaisse += f.total_ttc || 0
  })

  const sorted = Object.entries(map)
    .map(([nom, v]) => ({ nom, ...v }))
    .sort((a, b) => (b.devis + b.encaisse) - (a.devis + a.encaisse))
    .slice(0, 5)

  if (sorted.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">Top 5 clients</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Client</th>
            <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">CA devis acceptés</th>
            <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">CA encaissé</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map(c => (
            <tr key={c.nom} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 font-medium text-gray-900">{c.nom}</td>
              <td className="px-4 py-2.5 text-right text-gray-700">{euro(c.devis)}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-green-700">{euro(c.encaisse)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function RapportsPage() {
  const [period, setPeriod]       = useState('12')
  const [loading, setLoading]     = useState(true)
  const [stats, setStats]         = useState(null)
  const [chartData, setChartData] = useState([])
  const [allDevis, setAllDevis]   = useState([])
  const [allFactures, setAllFactures] = useState([])

  useEffect(() => { loadData() }, [period])

  async function loadData() {
    setLoading(true)
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - parseInt(period))
    const since = cutoff.toISOString()

    const [{ data: devis }, { data: factures }] = await Promise.all([
      supabase.from('devis').select('*, clients(nom)').gte('created_at', since).order('created_at'),
      supabase.from('factures').select('*, clients(nom)').gte('created_at', since).order('created_at'),
    ])

    const d = devis    || []
    const f = factures || []

    setAllDevis(d)
    setAllFactures(f)

    const caAccepte  = d.filter(x => x.statut === 'accepte').reduce((s, x) => s + (x.total_ttc || 0), 0)
    const caFacture  = f.reduce((s, x) => s + (x.total_ttc || 0), 0)
    const caEncaisse = f.filter(x => x.statut === 'payee').reduce((s, x) => s + (x.total_ttc || 0), 0)
    const txTransfo  = d.length > 0
      ? Math.round(d.filter(x => x.statut === 'accepte').length / d.length * 100)
      : 0

    setStats({ caAccepte, caFacture, caEncaisse, txTransfo, nbDevis: d.length, nbFactures: f.length })

    const now    = new Date()
    const months = []
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ year: dt.getFullYear(), month: dt.getMonth(), label: MOIS[dt.getMonth()] })
    }

    setChartData(months.map(m => {
      const devisM = d
        .filter(x => {
          const dt = new Date(x.created_at)
          return dt.getFullYear() === m.year && dt.getMonth() === m.month && x.statut === 'accepte'
        })
        .reduce((s, x) => s + (x.total_ttc || 0), 0)

      const encaisseM = f
        .filter(x => {
          const dt = new Date(x.created_at)
          return dt.getFullYear() === m.year && dt.getMonth() === m.month && x.statut === 'payee'
        })
        .reduce((s, x) => s + (x.total_ttc || 0), 0)

      return { label: m.label, year: m.year, devis: devisM, encaisse: encaisseM }
    }))

    setLoading(false)
  }

  function exportConsolide() {
    downloadCSV(
      `rapport-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Type', 'N°', 'Client', 'Statut', 'Total HT (€)', 'TVA (€)', 'Total TTC (€)', 'Date'],
      [
        ...allDevis.map(d => [
          'Devis', d.numero, d.clients?.nom || '', d.statut,
          (d.total_ht  || 0).toFixed(2),
          (d.total_tva || 0).toFixed(2),
          (d.total_ttc || 0).toFixed(2),
          new Date(d.created_at).toLocaleDateString('fr-FR'),
        ]),
        ...allFactures.map(f => [
          'Facture', f.numero, f.clients?.nom || '', f.statut,
          (f.total_ht  || 0).toFixed(2),
          (f.total_tva || 0).toFixed(2),
          (f.total_ttc || 0).toFixed(2),
          new Date(f.created_at).toLocaleDateString('fr-FR'),
        ]),
      ]
    )
    toast.success('Export CSV téléchargé')
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rapports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Analyse de votre activité</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {[['6', '6 mois'], ['12', '12 mois'], ['24', '2 ans']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setPeriod(v)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  period === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <Button size="sm" variant="secondary" onClick={exportConsolide}>
            <FileDown size={14} /> Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={TrendingUp}
              label="CA devis acceptés"
              value={euro(stats.caAccepte)}
              color="bg-blue-500"
              sub={`${stats.nbDevis} devis sur la période`}
            />
            <StatCard
              icon={Receipt}
              label="CA facturé"
              value={euro(stats.caFacture)}
              color="bg-violet-500"
              sub={`${stats.nbFactures} factures`}
            />
            <StatCard
              icon={Euro}
              label="CA encaissé"
              value={euro(stats.caEncaisse)}
              color="bg-green-600"
              sub="Factures payées"
            />
            <StatCard
              icon={FileText}
              label="Taux de transformation"
              value={`${stats.txTransfo}%`}
              color="bg-amber-500"
              sub="Devis → Accepté"
            />
          </div>

          {/* Graphique */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <h2 className="text-sm font-semibold text-gray-700">CA mensuel</h2>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
                  Devis acceptés
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
                  Encaissé
                </span>
              </div>
            </div>
            {chartData.every(d => d.devis === 0 && d.encaisse === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <TrendingUp size={32} className="mb-2 text-gray-300" />
                <p className="text-sm">Aucune donnée sur cette période</p>
              </div>
            ) : (
              <BarChartSVG data={chartData} height={220} />
            )}
          </div>

          {/* Top clients */}
          <TopClients devis={allDevis} factures={allFactures} />
        </>
      )}
    </div>
  )
}
