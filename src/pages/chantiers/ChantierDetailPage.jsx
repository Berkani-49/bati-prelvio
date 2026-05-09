import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Pencil, CheckCircle2, Circle, Loader2,
  Plus, Trash2, Send, MapPin, Calendar, User,
  ClipboardList, MessageSquare, Info,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'infos',  label: 'Infos',    icon: Info          },
  { id: 'taches', label: 'Tâches',   icon: ClipboardList },
  { id: 'notes',  label: 'Journal',  icon: MessageSquare },
]

const TACHE_STATUTS = { a_faire: 'À faire', en_cours: 'En cours', fait: 'Fait' }

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ChantierDetailPage() {
  const { id }              = useParams()
  const { user, effectiveUserId } = useAuth()
  const navigate            = useNavigate()

  const [chantier, setChantier] = useState(null)
  const [taches, setTaches]     = useState([])
  const [notes, setNotes]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('infos')
  const [newTache, setNewTache] = useState('')
  const [addingTache, setAddingTache] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [sendingNote, setSendingNote] = useState(false)
  const notesEndRef = useRef(null)

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [
      { data: c, error: ce },
      { data: t },
      { data: n },
    ] = await Promise.all([
      supabase.from('chantiers').select('*, clients(nom, email, tel)').eq('id', id).single(),
      supabase.from('chantier_taches').select('*').eq('chantier_id', id).order('ordre').order('created_at'),
      supabase.from('chantier_notes').select('*').eq('chantier_id', id).order('created_at'),
    ])
    if (ce || !c) { toast.error('Chantier introuvable'); navigate('/chantiers'); return }
    setChantier(c)
    setTaches(t || [])
    setNotes(n || [])
    setLoading(false)
  }

  // ── Tâches ────────────────────────────────────────────────
  async function addTache() {
    if (!newTache.trim()) return
    setAddingTache(true)
    const { data, error } = await supabase.from('chantier_taches').insert({
      chantier_id: id,
      titre:       newTache.trim(),
      statut:      'a_faire',
      ordre:       taches.length,
    }).select().single()
    if (error) { toast.error('Erreur'); setAddingTache(false); return }
    setTaches(prev => [...prev, data])
    setNewTache('')
    setAddingTache(false)
  }

  async function toggleTache(t) {
    const next = t.statut === 'fait' ? 'a_faire' : 'fait'
    const { error } = await supabase.from('chantier_taches').update({ statut: next }).eq('id', t.id)
    if (error) { toast.error('Erreur'); return }
    setTaches(prev => prev.map(x => x.id === t.id ? { ...x, statut: next } : x))
  }

  async function deleteTache(tId) {
    const { error } = await supabase.from('chantier_taches').delete().eq('id', tId)
    if (error) { toast.error('Erreur'); return }
    setTaches(prev => prev.filter(x => x.id !== tId))
  }

  const tachesDone  = taches.filter(t => t.statut === 'fait').length
  const tachesTotal = taches.length
  const progress    = tachesTotal > 0 ? Math.round((tachesDone / tachesTotal) * 100) : 0

  // ── Notes ─────────────────────────────────────────────────
  async function addNote() {
    if (!noteText.trim()) return
    setSendingNote(true)
    const { data, error } = await supabase.from('chantier_notes').insert({
      chantier_id: id,
      user_id:     effectiveUserId,
      contenu:     noteText.trim(),
    }).select().single()
    if (error) { toast.error('Erreur'); setSendingNote(false); return }
    setNotes(prev => [...prev, data])
    setNoteText('')
    setSendingNote(false)
    setTimeout(() => notesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function deleteNote(nId) {
    const { error } = await supabase.from('chantier_notes').delete().eq('id', nId)
    if (error) { toast.error('Erreur'); return }
    setNotes(prev => prev.filter(x => x.id !== nId))
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  return (
    <div className="p-6 max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/chantiers" className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 mt-0.5">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 truncate">{chantier.nom}</h1>
            <Badge statut={chantier.statut} />
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-gray-500">
            {chantier.clients?.nom && (
              <span className="flex items-center gap-1"><User size={13} /> {chantier.clients.nom}</span>
            )}
            {chantier.adresse && (
              <span className="flex items-center gap-1"><MapPin size={13} /> {chantier.adresse}</span>
            )}
            {chantier.date_debut && (
              <span className="flex items-center gap-1"><Calendar size={13} /> {formatDate(chantier.date_debut)}</span>
            )}
          </div>
        </div>
        <Link to={`/chantiers/${id}/edit`}>
          <Button size="sm" variant="secondary"><Pencil size={13} /> Modifier</Button>
        </Link>
      </div>

      {/* Barre progression tâches */}
      {tachesTotal > 0 && (
        <div className="card px-4 py-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Avancement tâches</span>
            <span className="font-bold text-gray-900">{progress}% <span className="font-normal text-gray-400">({tachesDone}/{tachesTotal})</span></span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === tabId
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Tab: Infos */}
      {tab === 'infos' && (
        <div className="card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Statut</p>
                <div className="mt-1"><Badge statut={chantier.statut} /></div>
              </div>
              {chantier.clients && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Client</p>
                  <p className="text-sm text-gray-900 mt-0.5">{chantier.clients.nom}</p>
                  {chantier.clients.tel   && <p className="text-xs text-gray-500">{chantier.clients.tel}</p>}
                  {chantier.clients.email && <p className="text-xs text-gray-500">{chantier.clients.email}</p>}
                </div>
              )}
              {chantier.adresse && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Adresse</p>
                  <p className="text-sm text-gray-900 mt-0.5">{chantier.adresse}</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {chantier.date_debut && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Date de début</p>
                  <p className="text-sm text-gray-900 mt-0.5">{formatDate(chantier.date_debut)}</p>
                </div>
              )}
              {chantier.date_fin && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Date de fin prévue</p>
                  <p className="text-sm text-gray-900 mt-0.5">{formatDate(chantier.date_fin)}</p>
                </div>
              )}
            </div>
          </div>
          {chantier.description && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Description</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{chantier.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Tâches */}
      {tab === 'taches' && (
        <div className="space-y-3">
          {/* Ajouter une tâche */}
          <div className="card p-4">
            <div className="flex gap-2">
              <input
                value={newTache}
                onChange={e => setNewTache(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTache()}
                placeholder="Nouvelle tâche… (Entrée pour valider)"
                className="flex-1 h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button size="sm" onClick={addTache} loading={addingTache}>
                <Plus size={14} />
              </Button>
            </div>
          </div>

          {taches.length === 0 ? (
            <div className="card p-8 text-center">
              <ClipboardList size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Aucune tâche — ajoutez-en une ci-dessus</p>
            </div>
          ) : (
            <div className="card divide-y divide-gray-100">
              {taches.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-gray-50">
                  <button onClick={() => toggleTache(t)} className="shrink-0">
                    {t.statut === 'fait'
                      ? <CheckCircle2 size={20} className="text-green-500" />
                      : <Circle size={20} className="text-gray-300 hover:text-gray-500" />
                    }
                  </button>
                  <span className={`flex-1 text-sm ${t.statut === 'fait' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {t.titre}
                  </span>
                  <button
                    onClick={() => deleteTache(t.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Notes / Journal */}
      {tab === 'notes' && (
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="card p-8 text-center">
              <MessageSquare size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Aucune note — commencez le journal ci-dessous</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map(n => (
                <div key={n.id} className="card px-4 py-3 group relative">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap flex-1">{n.contenu}</p>
                    <button
                      onClick={() => deleteNote(n.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 shrink-0 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              <div ref={notesEndRef} />
            </div>
          )}

          {/* Saisie note */}
          <div className="card p-4">
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addNote())}
                placeholder="Ajouter une note au journal… (Entrée pour envoyer, Maj+Entrée pour saut de ligne)"
                className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <button
                onClick={addNote}
                disabled={sendingNote || !noteText.trim()}
                className="flex items-center justify-center w-9 h-9 self-end bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-lg transition-colors"
              >
                {sendingNote ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
