import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const TVA = 0.20

function euro(v) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v || 0)
}

const EMPTY_LIGNE = () => ({ designation: '', quantite: 1, pu_ht: '' })

export default function DevisEditPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()

  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [devis, setDevis]               = useState(null)
  const [clients, setClients]           = useState([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [lignes, setLignes]             = useState([EMPTY_LIGNE()])
  const [statut, setStatut]             = useState('brouillon')

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const [
      { data: d, error: dErr },
      { data: cls },
      { data: ls },
    ] = await Promise.all([
      supabase.from('devis').select('*').eq('id', id).single(),
      supabase.from('clients').select('id, nom, email').order('nom'),
      supabase.from('lignes_devis').select('*').eq('devis_id', id).order('created_at'),
    ])

    if (dErr || !d) { toast.error('Devis introuvable'); navigate('/devis'); return }

    setDevis(d)
    setClients(cls || [])
    setSelectedClientId(d.client_id || '')
    setStatut(d.statut || 'brouillon')
    setLignes(
      ls?.length
        ? ls.map(l => ({ id: l.id, designation: l.designation, quantite: Number(l.quantite), pu_ht: Number(l.pu_ht) }))
        : [EMPTY_LIGNE()]
    )
    setLoading(false)
  }

  function updateLigne(index, field, value) {
    setLignes(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l))
  }

  function addLigne() { setLignes(prev => [...prev, EMPTY_LIGNE()]) }
  function removeLigne(index) { if (lignes.length > 1) setLignes(prev => prev.filter((_, i) => i !== index)) }

  const totalHT  = lignes.reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.pu_ht) || 0), 0)
  const totalTVA = totalHT * TVA
  const totalTTC = totalHT + totalTVA

  async function handleSave() {
    if (!selectedClientId) { toast.error('Sélectionnez un client'); return }
    if (lignes.some(l => !l.designation || !l.pu_ht)) { toast.error('Complétez toutes les lignes'); return }

    setSaving(true)
    try {
      const { error: dErr } = await supabase.from('devis').update({
        client_id: selectedClientId,
        statut,
        total_ht:  Number(totalHT.toFixed(2)),
        total_tva: Number(totalTVA.toFixed(2)),
        total_ttc: Number(totalTTC.toFixed(2)),
      }).eq('id', id)

      if (dErr) throw dErr

      // Supprimer les lignes existantes et réinsérer
      const { error: delErr } = await supabase.from('lignes_devis').delete().eq('devis_id', id)
      if (delErr) throw delErr

      const { error: lErr } = await supabase.from('lignes_devis').insert(
        lignes.map(l => ({
          devis_id:    id,
          designation: l.designation,
          quantite:    Number(l.quantite),
          pu_ht:       Number(l.pu_ht),
          total_ht:    Number((Number(l.quantite) * Number(l.pu_ht)).toFixed(2)),
        }))
      )
      if (lErr) throw lErr

      toast.success('Devis mis à jour !')
      navigate('/devis')
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/devis" className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Modifier le devis</h1>
          <p className="text-sm text-gray-500 mt-0.5">N° {devis?.numero}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Client & statut */}
        <div className="card p-5 space-y-4">
          <h2 className="section-title">Client & statut</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">— Sélectionner —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={statut}
                onChange={e => setStatut(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="brouillon">Brouillon</option>
                <option value="envoye">Envoyé</option>
                <option value="accepte">Accepté</option>
                <option value="refuse">Refusé</option>
              </select>
            </div>
          </div>
        </div>

        {/* Articles */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Articles / Prestations</h2>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 px-1 hidden sm:grid">
              <span className="col-span-5 text-xs font-semibold text-gray-400 uppercase">Désignation</span>
              <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase text-right">Qté</span>
              <span className="col-span-3 text-xs font-semibold text-gray-400 uppercase text-right">PU HT</span>
              <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase text-right">Total HT</span>
            </div>

            {lignes.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input
                  className="col-span-5 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Pose carrelage…"
                  value={l.designation}
                  onChange={e => updateLigne(i, 'designation', e.target.value)}
                />
                <input
                  type="number" min="0.01" step="0.01"
                  className="col-span-2 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                  value={l.quantite}
                  onChange={e => updateLigne(i, 'quantite', e.target.value)}
                />
                <input
                  type="number" min="0" step="0.01"
                  className="col-span-3 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                  placeholder="0.00"
                  value={l.pu_ht}
                  onChange={e => updateLigne(i, 'pu_ht', e.target.value)}
                />
                <div className="col-span-2 flex items-center justify-between gap-1">
                  <span className="text-sm font-medium text-gray-700 text-right flex-1">
                    {euro((Number(l.quantite) || 0) * (Number(l.pu_ht) || 0))}
                  </span>
                  <button
                    type="button" onClick={() => removeLigne(i)} disabled={lignes.length === 1}
                    className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 disabled:opacity-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            <button type="button" onClick={addLigne}
              className="mt-2 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              <Plus size={14} /> Ajouter une ligne
            </button>
          </div>

          {/* Totaux */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
            <div className="w-56 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total HT</span><span className="font-medium">{euro(totalHT)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>TVA 20%</span><span className="font-medium">{euro(totalTVA)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-primary-700 pt-2 border-t border-gray-200">
                <span>Total TTC</span><span>{euro(totalTTC)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button loading={saving} onClick={handleSave}>Enregistrer les modifications</Button>
          <Link to="/devis"><Button variant="secondary" type="button">Annuler</Button></Link>
        </div>
      </div>
    </div>
  )
}
