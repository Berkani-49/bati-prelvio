import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2, X, Save, Search, Timer, FileDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { downloadCSV } from '../../lib/csv'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ConfirmModal from '../../components/ui/ConfirmModal'
import toast from 'react-hot-toast'

function calcHeures(hDebut, hFin, pauseMin) {
  if (!hDebut || !hFin) return null
  const [hd, md] = hDebut.split(':').map(Number)
  const [hf, mf] = hFin.split(':').map(Number)
  const totalMin = (hf * 60 + mf) - (hd * 60 + md) - (pauseMin || 0)
  if (totalMin <= 0) return null
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

const EMPTY_FORM = {
  ouvrier_nom: '', chantier_id: '', date: new Date().toISOString().slice(0, 10),
  heure_debut: '08:00', heure_fin: '17:00', pause_min: '30', notes: '',
}

export default function PointagePage() {
  const { effectiveUserId } = useAuth()
  const [pointages, setPointages]   = useState([])
  const [chantiers, setChantiers]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editId, setEditId]         = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [confirmId, setConfirmId]   = useState(null)
  const [search, setSearch]         = useState('')
  const [filterChantier, setFilterChantier] = useState('')
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    loadChantiers()
    loadPointages()
  }, [])

  async function loadChantiers() {
    const { data } = await supabase.from('chantiers').select('id, nom').order('nom')
    setChantiers(data || [])
  }

  async function loadPointages() {
    setLoading(true)
    const { data, error } = await supabase
      .from('pointages')
      .select('*, chantiers(nom)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) toast.error('Erreur chargement')
    setPointages(data || [])
    setLoading(false)
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(p) {
    setForm({
      ouvrier_nom: p.ouvrier_nom || '',
      chantier_id: p.chantier_id || '',
      date:        p.date || new Date().toISOString().slice(0, 10),
      heure_debut: p.heure_debut || '',
      heure_fin:   p.heure_fin   || '',
      pause_min:   String(p.pause_min ?? 30),
      notes:       p.notes || '',
    })
    setEditId(p.id)
    setShowForm(true)
  }

  async function save() {
    if (!form.ouvrier_nom.trim()) { toast.error('Nom requis'); return }
    if (!form.date)                { toast.error('Date requise'); return }
    setSaving(true)
    try {
      const payload = {
        ouvrier_nom: form.ouvrier_nom.trim(),
        chantier_id: form.chantier_id || null,
        date:        form.date,
        heure_debut: form.heure_debut || null,
        heure_fin:   form.heure_fin   || null,
        pause_min:   form.pause_min   ? parseInt(form.pause_min) : 0,
        notes:       form.notes       || null,
      }
      if (editId) {
        const { error } = await supabase.from('pointages').update(payload).eq('id', editId)
        if (error) throw error
        toast.success('Pointage modifié')
      } else {
        const { error } = await supabase.from('pointages').insert({ ...payload, user_id: effectiveUserId })
        if (error) throw error
        toast.success('Pointage enregistré')
      }
      setShowForm(false)
      loadPointages()
    } catch (err) {
      toast.error(err.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function doDelete() {
    const { error } = await supabase.from('pointages').delete().eq('id', confirmId)
    if (error) { toast.error('Erreur'); return }
    setPointages(prev => prev.filter(p => p.id !== confirmId))
    setConfirmId(null)
    toast.success('Supprimé')
  }

  const filtered = pointages.filter(p => {
    const matchSearch   = !search || p.ouvrier_nom?.toLowerCase().includes(search.toLowerCase())
    const matchChantier = !filterChantier || p.chantier_id === filterChantier
    const matchDate     = !filterDate || p.date === filterDate
    return matchSearch && matchChantier && matchDate
  })

  // Total heures filtrées
  const totalMin = filtered.reduce((acc, p) => {
    if (!p.heure_debut || !p.heure_fin) return acc
    const [hd, md] = p.heure_debut.split(':').map(Number)
    const [hf, mf] = p.heure_fin.split(':').map(Number)
    return acc + (hf * 60 + mf) - (hd * 60 + md) - (p.pause_min || 0)
  }, 0)
  const totalHeures = totalMin > 0 ? `${Math.floor(totalMin / 60)}h${String(totalMin % 60).padStart(2, '0')}` : '—'

  function exportPointageCSV() {
    downloadCSV(
      `pointage-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Ouvrier', 'Chantier', 'Date', 'Début', 'Fin', 'Pause (min)', 'Durée', 'Notes'],
      filtered.map(p => {
        const [hd, md] = (p.heure_debut || '0:0').split(':').map(Number)
        const [hf, mf] = (p.heure_fin   || '0:0').split(':').map(Number)
        const min = p.heure_debut && p.heure_fin
          ? (hf * 60 + mf) - (hd * 60 + md) - (p.pause_min || 0)
          : 0
        const duree = min > 0 ? `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}` : ''
        return [
          p.ouvrier_nom,
          p.chantiers?.nom || '',
          new Date(p.date + 'T12:00:00').toLocaleDateString('fr-FR'),
          p.heure_debut?.slice(0, 5) || '',
          p.heure_fin?.slice(0, 5)   || '',
          p.pause_min || 0,
          duree,
          p.notes || '',
        ]
      })
    )
    toast.success('Export CSV téléchargé')
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pointage terrain</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} pointage{filtered.length > 1 ? 's' : ''}
            {filtered.length > 0 && <span className="ml-2 font-medium text-gray-700">· {totalHeures} total</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <Button size="sm" variant="secondary" onClick={exportPointageCSV}>
              <FileDown size={14} /> Export CSV
            </Button>
          )}
          <Button size="sm" onClick={openNew}><Plus size={14} /> Nouveau pointage</Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[160px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ouvrier…"
            className="w-full h-8 pl-8 pr-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterChantier}
          onChange={e => setFilterChantier(e.target.value)}
          className="h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Tous les chantiers</option>
          {chantiers.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {(search || filterChantier || filterDate) && (
          <button
            onClick={() => { setSearch(''); setFilterChantier(''); setFilterDate('') }}
            className="h-8 px-3 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 card">
          <Timer size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Aucun pointage</p>
          {!search && !filterChantier && !filterDate && (
            <button onClick={openNew} className="mt-4">
              <Button size="sm"><Plus size={14} /> Nouveau pointage</Button>
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ouvrier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Chantier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Horaires</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Durée</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => {
                const duree = calcHeures(p.heure_debut, p.heure_fin, p.pause_min)
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.ouvrier_nom}</p>
                      {p.notes && <p className="text-xs text-gray-400 truncate max-w-[140px]">{p.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.chantiers?.nom || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(p.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 hidden sm:table-cell">
                      {p.heure_debut && p.heure_fin
                        ? `${p.heure_debut.slice(0,5)} → ${p.heure_fin.slice(0,5)}`
                        : '—'}
                      {p.pause_min > 0 && <span className="text-xs text-gray-400 ml-1">(-{p.pause_min}min)</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {duree
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold"><Clock size={11} />{duree}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-xs">✏️</button>
                        <button onClick={() => setConfirmId(p.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer / modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{editId ? 'Modifier le pointage' : 'Nouveau pointage'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ouvrier *</label>
                <input
                  value={form.ouvrier_nom}
                  onChange={e => setForm(f => ({ ...f, ouvrier_nom: e.target.value }))}
                  placeholder="Prénom Nom"
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
                  <select
                    value={form.chantier_id}
                    onChange={e => setForm(f => ({ ...f, chantier_id: e.target.value }))}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">— Aucun —</option>
                    {chantiers.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
                  <input type="time" value={form.heure_debut} onChange={e => setForm(f => ({ ...f, heure_debut: e.target.value }))}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                  <input type="time" value={form.heure_fin} onChange={e => setForm(f => ({ ...f, heure_fin: e.target.value }))}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pause (min)</label>
                  <input type="number" min="0" value={form.pause_min} onChange={e => setForm(f => ({ ...f, pause_min: e.target.value }))}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              {form.heure_debut && form.heure_fin && (
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg">
                  <Clock size={14} className="text-orange-600" />
                  <span className="text-sm text-orange-700 font-medium">
                    Durée : {calcHeures(form.heure_debut, form.heure_fin, parseInt(form.pause_min) || 0) || '—'}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Tâches effectuées, remarques…"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              </div>
            </div>

            <div className="flex gap-2 justify-end px-5 py-4 border-t border-gray-100">
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button size="sm" loading={saving} onClick={save}>
                <Save size={13} /> {editId ? 'Enregistrer' : 'Pointer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmId && (
        <ConfirmModal
          title="Supprimer ce pointage ?"
          message="Cette action est irréversible."
          confirmLabel="Supprimer"
          onConfirm={doDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}
