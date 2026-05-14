import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, HardHat, Users, Receipt, X, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function euro(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0)
}

const TYPE_CONFIG = {
  devis:     { icon: FileText, color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'Devis',    path: (id) => `/devis/${id}/edit` },
  chantier:  { icon: HardHat,  color: 'text-teal-600',   bg: 'bg-teal-50',   label: 'Chantier', path: (id) => `/chantiers/${id}` },
  client:    { icon: Users,    color: 'text-violet-600', bg: 'bg-violet-50', label: 'Client',   path: (id) => `/clients` },
  facture:   { icon: Receipt,  color: 'text-green-600',  bg: 'bg-green-50',  label: 'Facture',  path: (id) => `/factures` },
}

export default function GlobalSearch({ open, onClose }) {
  const navigate              = useNavigate()
  const inputRef              = useRef(null)
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)

  // Focus auto à l'ouverture
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Debounce recherche
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(() => doSearch(query.trim()), 200)
    return () => clearTimeout(t)
  }, [query])

  async function doSearch(q) {
    setLoading(true)
    const like = `%${q}%`

    const [{ data: devis }, { data: chantiers }, { data: clients }, { data: factures }] = await Promise.all([
      supabase.from('devis').select('id, numero, statut, total_ttc, clients(nom)').or(`numero.ilike.${like}`).limit(4),
      supabase.from('chantiers').select('id, nom, statut, clients(nom)').ilike('nom', like).limit(4),
      supabase.from('clients').select('id, nom, email, tel').or(`nom.ilike.${like},email.ilike.${like}`).limit(4),
      supabase.from('factures').select('id, numero, statut, total_ttc, clients(nom)').or(`numero.ilike.${like}`).limit(3),
    ])

    const items = [
      ...(devis     || []).map(d => ({ type: 'devis',    id: d.id, title: d.numero,   sub: d.clients?.nom || '',    extra: euro(d.total_ttc), statut: d.statut })),
      ...(chantiers || []).map(c => ({ type: 'chantier', id: c.id, title: c.nom,       sub: c.clients?.nom || '',    extra: null })),
      ...(clients   || []).map(c => ({ type: 'client',   id: c.id, title: c.nom,       sub: c.email || c.tel || '', extra: null })),
      ...(factures  || []).map(f => ({ type: 'facture',  id: f.id, title: f.numero,    sub: f.clients?.nom || '',    extra: euro(f.total_ttc), statut: f.statut })),
    ]

    setResults(items)
    setSelected(0)
    setLoading(false)
  }

  function navigate_to(item) {
    const cfg = TYPE_CONFIG[item.type]
    navigate(cfg.path(item.id))
    onClose()
  }

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter' && results[selected]) navigate_to(results[selected])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, selected])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un devis, chantier, client…"
            className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder-gray-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded">Esc</kbd>
        </div>

        {/* Résultats */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Recherche…</div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Aucun résultat pour <strong>"{query}"</strong>
            </div>
          )}

          {!loading && !query && (
            <div className="px-4 py-6 text-center text-xs text-gray-400">
              Tapez pour rechercher dans vos devis, chantiers, clients et factures
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="py-2">
              {results.map((item, i) => {
                const cfg = TYPE_CONFIG[item.type]
                const Icon = cfg.icon
                return (
                  <li key={`${item.type}-${item.id}`}>
                    <button
                      onClick={() => navigate_to(item)}
                      onMouseEnter={() => setSelected(i)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                        selected === i ? 'bg-primary-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${cfg.bg} shrink-0`}>
                        <Icon size={15} className={cfg.color} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        {item.sub && <p className="text-xs text-gray-500 truncate">{item.sub}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.extra && <span className="text-xs font-semibold text-gray-700">{item.extra}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <ArrowRight size={13} className="text-gray-400" />
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">↑↓</kbd> naviguer
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">↵</kbd> ouvrir
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">Esc</kbd> fermer
          </span>
        </div>
      </div>
    </div>
  )
}
