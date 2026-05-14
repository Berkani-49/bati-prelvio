import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Save, Trash2, CalendarDays } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const JOURS_LONG = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

const COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-orange-100 text-orange-800 border-orange-200',
]

function getMonday(d) {
  const date = new Date(d)
  const day  = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function toISO(d) { return d.toISOString().slice(0, 10) }
function formatDay(d) { return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }
function isToday(d) { return toISO(d) === toISO(new Date()) }

const colorMap = {}
let colorIdx = 0
function getColor(name) {
  if (!colorMap[name]) {
    colorMap[name] = COLORS[colorIdx % COLORS.length]
    colorIdx++
  }
  return colorMap[name]
}

export default function PlanningPage() {
  const { effectiveUserId } = useAuth()
  const [weekStart, setWeekStart]       = useState(getMonday(new Date()))
  const [affectations, setAffectations] = useState([])
  const [chantiers, setChantiers]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [modal, setModal]               = useState(null)
  const [form, setForm]                 = useState({ ouvrier_nom: '', chantier_id: '', heure_debut: '', heure_fin: '', notes: '' })
  const [saving, setSaving]             = useState(false)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => { loadChantiers() }, [])
  useEffect(() => { loadAffectations() }, [weekStart])

  async function loadChantiers() {
    const { data } = await supabase.from('chantiers').select('id, nom').in('statut', ['en_attente', 'en_cours']).order('nom')
    setChantiers(data || [])
  }

  async function loadAffectations() {
    setLoading(true)
    const from = toISO(weekStart)
    const to   = toISO(addDays(weekStart, 6))
    const { data, error } = await supabase
      .from('planning_affectations')
      .select('*, chantiers(nom)')
      .gte('date', from)
      .lte('date', to)
      .order('heure_debut')
    if (error) toast.error('Erreur chargement')
    setAffectations(data || [])
    setLoading(false)
  }

  function openNewModal(date) {
    setForm({ ouvrier_nom: '', chantier_id: '', heure_debut: '08:00', heure_fin: '17:00', notes: '' })
    setModal({ date })
  }

  function openEditModal(aff) {
    setForm({
      ouvrier_nom: aff.ouvrier_nom || '',
      chantier_id: aff.chantier_id || '',
      heure_debut: aff.heure_debut || '',
      heure_fin:   aff.heure_fin   || '',
      notes:       aff.notes       || '',
    })
    setModal({ date: aff.date, affectation: aff })
  }

  async function saveAffectation() {
    if (!form.ouvrier_nom.trim()) { toast.error("Nom de l'ouvrier requis"); return }
    setSaving(true)
    try {
      const payload = {
        ouvrier_nom: form.ouvrier_nom.trim(),
        chantier_id: form.chantier_id || null,
        date:        modal.date,
        heure_debut: form.heure_debut || null,
        heure_fin:   form.heure_fin   || null,
        notes:       form.notes       || null,
      }
      if (modal.affectation) {
        const { error } = await supabase.from('planning_affectations').update(payload).eq('id', modal.affectation.id)
        if (error) throw error
        toast.success('Modifié')
      } else {
        const { error } = await supabase.from('planning_affectations').insert({ ...payload, user_id: effectiveUserId })
        if (error) throw error
        toast.success('Affectation ajoutée')
      }
      setModal(null)
      loadAffectations()
    } catch (err) {
      toast.error(err.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function deleteAffectation(id) {
    const { error } = await supabase.from('planning_affectations').delete().eq('id', id)
    if (error) { toast.error('Erreur'); return }
    toast.success('Supprimé')
    setModal(null)
    loadAffectations()
  }

  function getAffForDay(day) {
    return affectations.filter(a => a.date === toISO(day))
  }

  const weekLabel = `${formatDay(weekDays[0])} — ${formatDay(weekDays[6])} ${weekDays[6].getFullYear()}`

  return (
    <div className="p-4 md:p-6 max-w-6xl space-y-4 md:space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Planning équipes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Affectez vos ouvriers aux chantiers</p>
        </div>
      </div>

      {/* Navigation semaine */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 border border-gray-200"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="flex-1 text-sm font-medium text-gray-700 text-center">{weekLabel}</span>
        <button
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 border border-gray-200"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => setWeekStart(getMonday(new Date()))}
          className="ml-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          Auj.
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {/* ── Vue desktop : grille 7 colonnes ── */}
          <div className="hidden md:grid grid-cols-7 gap-2">
            {weekDays.map((day, idx) => {
              const affs  = getAffForDay(day)
              const today = isToday(day)
              return (
                <div key={idx} className="min-h-[160px]">
                  <div className={`text-center py-2 mb-2 rounded-lg ${today ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-600'}`}>
                    <p className="text-xs font-semibold">{JOURS[idx]}</p>
                    <p className={`text-lg font-bold leading-tight ${today ? 'text-white' : 'text-gray-900'}`}>
                      {day.getDate()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {affs.map(a => (
                      <button
                        key={a.id}
                        onClick={() => openEditModal(a)}
                        className={`w-full text-left px-2 py-1.5 rounded-md text-xs border cursor-pointer hover:opacity-80 transition-opacity ${getColor(a.ouvrier_nom)}`}
                      >
                        <p className="font-semibold truncate">{a.ouvrier_nom}</p>
                        {a.chantiers?.nom && <p className="truncate opacity-70">{a.chantiers.nom}</p>}
                        {(a.heure_debut || a.heure_fin) && (
                          <p className="opacity-60">{a.heure_debut?.slice(0,5)} — {a.heure_fin?.slice(0,5)}</p>
                        )}
                      </button>
                    ))}
                    <button
                      onClick={() => openNewModal(toISO(day))}
                      className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Vue mobile : liste par jour ── */}
          <div className="md:hidden space-y-3">
            {weekDays.map((day, idx) => {
              const affs  = getAffForDay(day)
              const today = isToday(day)
              return (
                <div key={idx} className={`rounded-xl border overflow-hidden ${today ? 'border-primary-400' : 'border-gray-200'}`}>
                  {/* En-tête jour */}
                  <div className={`flex items-center justify-between px-4 py-2.5 ${today ? 'bg-primary-600' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${today ? 'text-white' : 'text-gray-900'}`}>
                        {JOURS_LONG[idx]} {day.getDate()}
                      </p>
                      {today && <span className="text-xs text-primary-200 font-medium">Aujourd'hui</span>}
                    </div>
                    <button
                      onClick={() => openNewModal(toISO(day))}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        today
                          ? 'bg-white/20 text-white hover:bg-white/30'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Plus size={12} /> Ajouter
                    </button>
                  </div>

                  {/* Affectations du jour */}
                  {affs.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-gray-400 italic bg-white">Aucune affectation</p>
                  ) : (
                    <div className="bg-white divide-y divide-gray-100">
                      {affs.map(a => (
                        <button
                          key={a.id}
                          onClick={() => openEditModal(a)}
                          className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${getColor(a.ouvrier_nom).split(' ')[0].replace('100', '500')}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{a.ouvrier_nom}</p>
                            {a.chantiers?.nom && <p className="text-xs text-gray-500 truncate">{a.chantiers.nom}</p>}
                          </div>
                          {(a.heure_debut || a.heure_fin) && (
                            <p className="text-xs text-gray-400 shrink-0">
                              {a.heure_debut?.slice(0,5)}{a.heure_fin ? ` → ${a.heure_fin.slice(0,5)}` : ''}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Modal ajout/édition */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {modal.affectation ? "Modifier l'affectation" : 'Nouvelle affectation'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <CalendarDays size={12} />
                  {new Date(modal.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ouvrier / membre *</label>
                <input
                  value={form.ouvrier_nom}
                  onChange={e => setForm(f => ({ ...f, ouvrier_nom: e.target.value }))}
                  placeholder="Prénom Nom"
                  className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
                <select
                  value={form.chantier_id}
                  onChange={e => setForm(f => ({ ...f, chantier_id: e.target.value }))}
                  className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">— Aucun chantier —</option>
                  {chantiers.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
                  <input type="time" value={form.heure_debut}
                    onChange={e => setForm(f => ({ ...f, heure_debut: e.target.value }))}
                    className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                  <input type="time" value={form.heure_fin}
                    onChange={e => setForm(f => ({ ...f, heure_fin: e.target.value }))}
                    className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Tâches à effectuer…"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
              {modal.affectation ? (
                <button
                  onClick={() => deleteAffectation(modal.affectation.id)}
                  className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              ) : <span />}
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Annuler</Button>
                <Button size="sm" loading={saving} onClick={saveAffectation}>
                  <Save size={13} /> {modal.affectation ? 'Enregistrer' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
