import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Truck, Search, MoreHorizontal, AlertTriangle, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ConfirmModal from '../../components/ui/ConfirmModal'
import toast from 'react-hot-toast'

const TYPES = {
  vehicule: 'Véhicule',
  engin:    'Engin',
  outil:    'Outil',
  autre:    'Autre',
}

const STATUT_STYLES = {
  disponible:   'bg-green-100 text-green-700',
  en_service:   'bg-orange-100 text-orange-700',
  maintenance:  'bg-amber-100 text-amber-700',
  hors_service: 'bg-red-100 text-red-700',
}

const STATUT_LABELS = {
  disponible:   'Disponible',
  en_service:   'En service',
  maintenance:  'Maintenance',
  hors_service: 'Hors service',
}

const ALL_STATUTS = ['tous', 'disponible', 'en_service', 'maintenance', 'hors_service']

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000)
  return diff
}

function AlertBadge({ label, days }) {
  if (days === null) return null
  if (days < 0)   return <span className="text-xs text-red-600 font-medium flex items-center gap-1"><AlertTriangle size={11} /> {label} expiré</span>
  if (days <= 30) return <span className="text-xs text-amber-600 font-medium flex items-center gap-1"><AlertTriangle size={11} /> {label} dans {days}j</span>
  return null
}

export default function VehiculeListPage() {
  const [vehicules, setVehicules] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filtre, setFiltre]       = useState('tous')
  const [search, setSearch]       = useState('')
  const [menuOpen, setMenuOpen]   = useState(null)
  const [menuPos, setMenuPos]     = useState({ top: 0, right: 0 })
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => { fetchVehicules() }, [filtre])

  async function fetchVehicules() {
    setLoading(true)
    let query = supabase
      .from('vehicules')
      .select('*')
      .order('created_at', { ascending: false })
    if (filtre !== 'tous') query = query.eq('statut', filtre)
    const { data, error } = await query
    if (error) toast.error('Erreur chargement')
    setVehicules(data || [])
    setLoading(false)
  }

  function toggleMenu(e, id) {
    if (menuOpen === id) { setMenuOpen(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right })
    setMenuOpen(id)
  }

  async function updateStatut(id, statut) {
    const { error } = await supabase.from('vehicules').update({ statut }).eq('id', id)
    if (error) { toast.error('Erreur'); return }
    setVehicules(prev => prev.map(v => v.id === id ? { ...v, statut } : v))
    setMenuOpen(null)
    toast.success('Statut mis à jour')
  }

  async function doDelete() {
    const { error } = await supabase.from('vehicules').delete().eq('id', confirmId)
    if (error) { toast.error('Erreur suppression'); return }
    setVehicules(prev => prev.filter(v => v.id !== confirmId))
    setConfirmId(null)
    toast.success('Supprimé')
  }

  const filtered = vehicules.filter(v =>
    v.nom?.toLowerCase().includes(search.toLowerCase()) ||
    v.immatriculation?.toLowerCase().includes(search.toLowerCase()) ||
    v.marque?.toLowerCase().includes(search.toLowerCase())
  )

  const openV = filtered.find(v => v.id === menuOpen)

  const alertsCount = vehicules.filter(v => {
    const ct = daysUntil(v.date_controle_tech)
    const as = daysUntil(v.date_assurance)
    const rv = daysUntil(v.date_revision)
    return (ct !== null && ct <= 30) || (as !== null && as <= 30) || (rv !== null && rv <= 30)
  }).length

  return (
    <div className="p-4 md:p-6 max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Parc véhicules & matériel</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {vehicules.length} engin{vehicules.length > 1 ? 's' : ''}
            {alertsCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">· {alertsCount} alerte{alertsCount > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <Link to="/vehicules/nouveau">
          <Button size="sm"><Plus size={14} /> Ajouter</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {ALL_STATUTS.map(s => (
            <button
              key={s}
              onClick={() => setFiltre(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filtre === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'tous' ? 'Tous' : STATUT_LABELS[s]}
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

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 card">
          <Truck size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Aucun véhicule / matériel</p>
          {!search && (
            <Link to="/vehicules/nouveau" className="mt-4">
              <Button size="sm"><Plus size={14} /> Ajouter</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(v => {
            const ctDays = daysUntil(v.date_controle_tech)
            const asDays = daysUntil(v.date_assurance)
            const rvDays = daysUntil(v.date_revision)
            const hasAlert = (ctDays !== null && ctDays <= 30) || (asDays !== null && asDays <= 30) || (rvDays !== null && rvDays <= 30)

            return (
              <div key={v.id} className={`card p-4 space-y-3 relative ${hasAlert ? 'ring-1 ring-amber-200' : ''}`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Truck size={18} className="text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{v.nom}</p>
                      <p className="text-xs text-gray-400">{TYPES[v.type] || v.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_STYLES[v.statut]}`}>
                      {STATUT_LABELS[v.statut]}
                    </span>
                    <button
                      onClick={e => toggleMenu(e, v.id)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  </div>
                </div>

                {/* Infos */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                  {v.immatriculation && <span>🔖 {v.immatriculation}</span>}
                  {v.marque && <span>🏭 {v.marque} {v.modele || ''}</span>}
                  {v.annee && <span>📅 {v.annee}</span>}
                  {v.kilometrage != null && <span>📍 {v.kilometrage.toLocaleString('fr-FR')} km</span>}
                </div>

                {/* Alertes */}
                {(hasAlert) && (
                  <div className="border-t border-amber-100 pt-2 space-y-0.5">
                    <AlertBadge label="Contrôle tech." days={ctDays} />
                    <AlertBadge label="Assurance" days={asDays} />
                    <AlertBadge label="Révision" days={rvDays} />
                  </div>
                )}

                {/* Dates discrètes */}
                {!hasAlert && (v.date_controle_tech || v.date_assurance || v.date_revision) && (
                  <div className="border-t border-gray-100 pt-2 flex flex-wrap gap-2">
                    {v.date_controle_tech && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={11} /> CT {new Date(v.date_controle_tech).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {v.date_assurance && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={11} /> Assur. {new Date(v.date_assurance).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {v.date_revision && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={11} /> Rév. {new Date(v.date_revision).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {menuOpen && openV && (
        <div
          style={{ top: menuPos.top, right: menuPos.right }}
          className="fixed z-50 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
        >
          <Link
            to={`/vehicules/${openV.id}/edit`}
            className="flex w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 items-center gap-2"
            onClick={() => setMenuOpen(null)}
          >
            Modifier
          </Link>
          <div className="h-px bg-gray-100 my-1" />
          <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Changer statut</p>
          {['disponible', 'en_service', 'maintenance', 'hors_service'].map(s => (
            <button
              key={s}
              onClick={() => updateStatut(openV.id, s)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {STATUT_LABELS[s]}
            </button>
          ))}
          <div className="h-px bg-gray-100 my-1" />
          <button
            onClick={() => { setMenuOpen(null); setConfirmId(openV.id) }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Supprimer
          </button>
        </div>
      )}

      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />}

      {confirmId && (
        <ConfirmModal
          title="Supprimer ?"
          message="Cette action est irréversible."
          confirmLabel="Supprimer"
          onConfirm={doDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}
