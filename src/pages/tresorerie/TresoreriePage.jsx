import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle, Euro, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Spinner from '../../components/ui/Spinner'

function euro(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0)
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const BUCKETS = [
  { label: 'En retard',   days: null,    color: 'bg-red-500',    light: 'bg-red-50 border-red-200 text-red-700' },
  { label: '0–7 j',       days: 7,       color: 'bg-amber-500',  light: 'bg-amber-50 border-amber-200 text-amber-700' },
  { label: '8–30 j',      days: 30,      color: 'bg-orange-500',   light: 'bg-orange-50 border-orange-200 text-orange-700' },
  { label: '31–60 j',     days: 60,      color: 'bg-violet-500', light: 'bg-violet-50 border-violet-200 text-violet-700' },
  { label: '60+ j',       days: 9999,    color: 'bg-gray-400',   light: 'bg-gray-50 border-gray-200 text-gray-600' },
]

function getBucket(dateEcheance) {
  if (!dateEcheance) return 4
  const today = startOfDay(new Date())
  const ech   = startOfDay(new Date(dateEcheance + 'T12:00:00'))
  const diff  = Math.round((ech - today) / 86400000)
  if (diff < 0)   return 0
  if (diff <= 7)  return 1
  if (diff <= 30) return 2
  if (diff <= 60) return 3
  return 4
}

export default function TresoreriePage() {
  const [factures, setFactures] = useState([])
  const [loading, setLoading]   = useState(true)
  const [horizon, setHorizon]   = useState('90')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data } = await supabase
      .from('factures')
      .select('*, clients(nom)')
      .in('statut', ['envoyee', 'en_retard'])
      .order('date_echeance', { ascending: true, nullsFirst: false })
    setFactures(data || [])
    setLoading(false)
  }

  const today = startOfDay(new Date())
  const cutoff = addDays(today, parseInt(horizon))

  const inHorizon = factures.filter(f => {
    if (!f.date_echeance) return true
    return new Date(f.date_echeance + 'T12:00:00') <= cutoff
  })

  // Totaux par bucket
  const byBucket = BUCKETS.map((b, i) => {
    const items = inHorizon.filter(f => getBucket(f.date_echeance) === i)
    return { ...b, items, total: items.reduce((s, f) => s + (f.total_ttc || 0), 0) }
  })

  const totalAttente  = inHorizon.reduce((s, f) => s + (f.total_ttc || 0), 0)
  const totalEnRetard = byBucket[0].total

  // Courbe prévisionnelle — cumul semaine par semaine
  const weeks = []
  let cumul = 0
  for (let w = 0; w < Math.ceil(parseInt(horizon) / 7); w++) {
    const weekStart = addDays(today, w * 7)
    const weekEnd   = addDays(today, (w + 1) * 7 - 1)
    const weekFacs  = inHorizon.filter(f => {
      if (!f.date_echeance) return false
      const d = new Date(f.date_echeance + 'T12:00:00')
      return d >= weekStart && d <= weekEnd
    })
    const weekTotal = weekFacs.reduce((s, f) => s + (f.total_ttc || 0), 0)
    cumul += weekTotal
    weeks.push({ label: `S${w + 1}`, total: weekTotal, cumul, start: weekStart })
  }

  const maxCumul = Math.max(...weeks.map(w => w.cumul), 1)

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  return (
    <div className="p-4 md:p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Trésorerie</h1>
          <p className="text-sm text-gray-500 mt-0.5">Prévisions d'encaissement basées sur vos factures émises</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {[['30', '30 j'], ['60', '60 j'], ['90', '90 j']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setHorizon(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                horizon === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Euro size={14} className="text-orange-600" />
            <p className="text-xs font-medium text-gray-500">À encaisser</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{euro(totalAttente)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{inHorizon.length} facture{inHorizon.length > 1 ? 's' : ''}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-red-500" />
            <p className="text-xs font-medium text-gray-500">En retard</p>
          </div>
          <p className={`text-xl font-bold ${totalEnRetard > 0 ? 'text-red-600' : 'text-gray-400'}`}>{euro(totalEnRetard)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{byBucket[0].items.length} facture{byBucket[0].items.length > 1 ? 's' : ''}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-amber-500" />
            <p className="text-xs font-medium text-gray-500">Sous 7 jours</p>
          </div>
          <p className="text-xl font-bold text-amber-600">{euro(byBucket[1].total)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{byBucket[1].items.length} facture{byBucket[1].items.length > 1 ? 's' : ''}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-green-600" />
            <p className="text-xs font-medium text-gray-500">8–30 jours</p>
          </div>
          <p className="text-xl font-bold text-orange-600">{euro(byBucket[2].total)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{byBucket[2].items.length} facture{byBucket[2].items.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Graphique cumulatif */}
      {weeks.some(w => w.total > 0) && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Encaissements prévisionnels cumulés</h2>
          <div className="flex items-end gap-1.5 h-40">
            {weeks.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full flex items-end justify-center" style={{ height: '120px' }}>
                  {/* Barre hebdo */}
                  {w.total > 0 && (
                    <div
                      className="absolute bottom-0 w-full bg-orange-200 rounded-t-sm transition-all"
                      style={{ height: `${(w.total / maxCumul) * 120}px` }}
                    />
                  )}
                  {/* Ligne cumul */}
                  <div
                    className="absolute bottom-0 w-2 h-2 rounded-full bg-orange-600 z-10 -mb-1"
                    style={{ bottom: `${(w.cumul / maxCumul) * 120}px` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap">
                      <p className="font-semibold">{euro(w.cumul)} cumulé</p>
                      {w.total > 0 && <p className="text-gray-300">+{euro(w.total)} cette semaine</p>}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{w.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-200 inline-block" />Semaine</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block" />Cumulé</span>
          </div>
        </div>
      )}

      {/* Buckets détail */}
      <div className="space-y-4">
        {byBucket.map((bucket, i) => bucket.items.length > 0 && (
          <div key={i} className="card overflow-hidden">
            <div className={`flex items-center justify-between px-4 py-3 border-b ${bucket.light} border`}>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${bucket.color}`} />
                <span className="text-sm font-semibold">{bucket.label}</span>
                <span className="text-xs opacity-70">{bucket.items.length} facture{bucket.items.length > 1 ? 's' : ''}</span>
              </div>
              <span className="text-sm font-bold">{euro(bucket.total)}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {bucket.items.map(f => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{f.numero}</p>
                    <p className="text-xs text-gray-500 truncate">{f.clients?.nom || '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{euro(f.total_ttc)}</p>
                    {f.date_echeance && (
                      <p className="text-xs text-gray-400">
                        Échéance {new Date(f.date_echeance + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {inHorizon.length === 0 && (
          <div className="card p-12 text-center">
            <CheckCircle size={36} className="text-green-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Aucune facture en attente</p>
            <p className="text-gray-400 text-sm mt-1">Toutes vos factures sont payées !</p>
          </div>
        )}
      </div>
    </div>
  )
}
