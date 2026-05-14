import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useSubscription } from '../../hooks/useSubscription'
import { getEntrepriseData, fetchLogoBase64 } from '../../lib/entreprise'
import { generateFacturePDF, downloadPDF } from '../../lib/pdf'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import PaywallModal from '../../components/ui/PaywallModal'
import toast from 'react-hot-toast'

const TVA = 0.20

function euro(v) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v || 0)
}

async function pickNextNumeroFacture() {
  const year   = new Date().getFullYear()
  const month  = String(new Date().getMonth() + 1).padStart(2, '0')
  const prefix = `FAC-${year}${month}-`
  const { data } = await supabase
    .from('factures')
    .select('numero')
    .like('numero', `${prefix}%`)
    .order('numero', { ascending: false })
    .limit(1)
  const lastSeq = data?.[0]?.numero
    ? parseInt(data[0].numero.replace(prefix, ''), 10)
    : 0
  return `${prefix}${String(lastSeq + 1).padStart(3, '0')}`
}

const EMPTY_LIGNE = () => ({ designation: '', quantite: 1, pu_ht: '' })

export default function FactureNewPage() {
  const { effectiveUserId } = useAuth()
  const navigate    = useNavigate()
  const [searchParams] = useSearchParams()
  const fromDevisId = searchParams.get('from_devis')
  const { loading: subLoading, canCreateFacture, facturesThisMonth } = useSubscription()

  const [numero, setNumero]           = useState('')
  const [clients, setClients]         = useState([])
  const [devisAcceptes, setDevisAcceptes] = useState([])
  const [selectedDevisId, setSelectedDevisId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [lignes, setLignes]           = useState([EMPTY_LIGNE()])
  const [dateEcheance, setDateEcheance] = useState('')
  const [notes, setNotes]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([
      pickNextNumeroFacture(),
      supabase.from('clients').select('id, nom, email').order('nom'),
      supabase.from('devis').select('id, numero, total_ttc, clients(id, nom)').eq('statut', 'accepte').order('created_at', { ascending: false }),
    ]).then(async ([num, { data: cls }, { data: dvs }]) => {
      const allDevis = dvs || []
      setNumero(num)
      setClients(cls || [])
      setDevisAcceptes(allDevis)
      setLoading(false)

      // Pré-remplir depuis un devis — on utilise allDevis directement (pas le state)
      if (fromDevisId) {
        setSelectedDevisId(fromDevisId)
        const devis = allDevis.find(d => d.id === fromDevisId)
        if (devis?.clients?.id) setSelectedClientId(devis.clients.id)
        const { data: lignesDevis } = await supabase
          .from('lignes_devis').select('*').eq('devis_id', fromDevisId)
        if (lignesDevis?.length) {
          setLignes(lignesDevis.map(l => ({
            designation: l.designation,
            quantite:    Number(l.quantite),
            pu_ht:       Number(l.pu_ht),
          })))
        }
      }
    })
  }, [])

  async function handleDevisChange(devisId) {
    setSelectedDevisId(devisId)
    if (!devisId) { setSelectedClientId(''); setLignes([EMPTY_LIGNE()]); return }

    const devis = devisAcceptes.find(d => d.id === devisId)
    if (devis?.clients?.id) setSelectedClientId(devis.clients.id)

    const { data: lignesDevis } = await supabase
      .from('lignes_devis')
      .select('*')
      .eq('devis_id', devisId)

    if (lignesDevis?.length) {
      setLignes(lignesDevis.map(l => ({
        designation: l.designation,
        quantite:    Number(l.quantite),
        pu_ht:       Number(l.pu_ht),
      })))
    }
  }

  function updateLigne(index, field, value) {
    setLignes(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l))
  }

  function addLigne() {
    setLignes(prev => [...prev, EMPTY_LIGNE()])
  }

  function removeLigne(index) {
    if (lignes.length === 1) return
    setLignes(prev => prev.filter((_, i) => i !== index))
  }

  const totalHT  = lignes.reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.pu_ht) || 0), 0)
  const totalTVA = totalHT * TVA
  const totalTTC = totalHT + totalTVA

  async function handlePreview() {
    const client     = clients.find(c => c.id === selectedClientId)
    const entreprise = await getEntrepriseData()
    const logoBase64 = await fetchLogoBase64(entreprise?.logo_url)
    const fakeFact   = { numero, created_at: new Date().toISOString(), date_echeance: dateEcheance || null }
    const lignesNum  = lignes.map(l => ({ ...l, quantite: Number(l.quantite), pu_ht: Number(l.pu_ht) }))
    const doc = generateFacturePDF({ facture: fakeFact, client: client || {}, lignes: lignesNum, entreprise, logoBase64 })
    downloadPDF(doc, `apercu-${numero}.pdf`)
    toast.success('Aperçu PDF généré')
  }

  async function handleSave() {
    if (!selectedClientId) { toast.error('Sélectionnez un client'); return }
    if (lignes.some(l => !l.designation || !l.pu_ht)) {
      toast.error('Complétez toutes les lignes')
      return
    }

    setSaving(true)
    try {
      const lignesNum = lignes.map(l => ({
        designation: l.designation,
        quantite:    Number(l.quantite),
        pu_ht:       Number(l.pu_ht),
        total_ht:    Number((Number(l.quantite) * Number(l.pu_ht)).toFixed(2)),
      }))

      let facture = null
      for (let attempt = 0; attempt < 5; attempt++) {
        const nextNumero = await pickNextNumeroFacture()
        const { data: d, error: fErr } = await supabase
          .from('factures')
          .insert({
            user_id:       effectiveUserId,
            client_id:     selectedClientId,
            devis_id:      selectedDevisId || null,
            numero:        nextNumero,
            statut:        'brouillon',
            total_ht:      Number(totalHT.toFixed(2)),
            total_tva:     Number(totalTVA.toFixed(2)),
            total_ttc:     Number(totalTTC.toFixed(2)),
            date_echeance: dateEcheance || null,
            notes:         notes || null,
          })
          .select()
          .single()
        if (!fErr) { facture = d; setNumero(nextNumero); break }
        if (!fErr?.message?.includes('unique') && !fErr?.message?.includes('duplicate')) throw fErr
      }
      if (!facture) throw new Error('Impossible de générer un numéro unique. Réessayez.')

      const { error: lErr } = await supabase
        .from('lignes_facture')
        .insert(lignesNum.map(l => ({ ...l, facture_id: facture.id })))

      if (lErr) throw lErr

      toast.success(`Facture ${facture.numero} créée !`)
      navigate('/factures')
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  if (loading || subLoading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  if (!canCreateFacture) return (
    <>
      <div className="p-4 md:p-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/factures" className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Nouvelle facture</h1>
        </div>
      </div>
      <PaywallModal type="facture" used={facturesThisMonth} onClose={() => navigate('/factures')} />
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/factures"
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nouvelle facture</h1>
          {numero && <p className="text-sm text-gray-500 mt-0.5">N° {numero}</p>}
        </div>
      </div>

      <div className="space-y-4">
        {/* Import depuis devis */}
        <div className="card p-5">
          <h2 className="section-title mb-3">Importer depuis un devis accepté (optionnel)</h2>
          <select
            value={selectedDevisId}
            onChange={e => handleDevisChange(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">— Créer sans devis —</option>
            {devisAcceptes.map(d => (
              <option key={d.id} value={d.id}>
                {d.numero} — {d.clients?.nom} ({euro(d.total_ttc)})
              </option>
            ))}
          </select>
          {selectedDevisId && (
            <p className="text-xs text-green-700 mt-2">
              ✓ Client et articles importés depuis le devis
            </p>
          )}
        </div>

        {/* Client + dates */}
        <div className="card p-5 space-y-4">
          <h2 className="section-title">Client & dates</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">— Sélectionner —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
              <input
                type="date"
                value={dateEcheance}
                onChange={e => setDateEcheance(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Articles */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Articles / Prestations</h2>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 px-1">
              <span className="col-span-5 text-xs font-semibold text-gray-400 uppercase">Désignation</span>
              <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase text-right">Qté</span>
              <span className="col-span-3 text-xs font-semibold text-gray-400 uppercase text-right">PU HT</span>
              <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase text-right">Total HT</span>
            </div>

            {lignes.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input
                  className="col-span-5 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Pose carrelage salle de bain"
                  value={l.designation}
                  onChange={e => updateLigne(i, 'designation', e.target.value)}
                />
                <input
                  type="number"
                  className="col-span-2 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                  min="0.01"
                  step="0.01"
                  value={l.quantite}
                  onChange={e => updateLigne(i, 'quantite', e.target.value)}
                />
                <input
                  type="number"
                  className="col-span-3 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={l.pu_ht}
                  onChange={e => updateLigne(i, 'pu_ht', e.target.value)}
                />
                <div className="col-span-2 flex items-center justify-between gap-1">
                  <span className="text-sm font-medium text-gray-700 text-right flex-1">
                    {euro((Number(l.quantite) || 0) * (Number(l.pu_ht) || 0))}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLigne(i)}
                    disabled={lignes.length === 1}
                    className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 disabled:opacity-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addLigne}
              className="mt-2 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              <Plus size={14} /> Ajouter une ligne
            </button>
          </div>

          {/* Totaux */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
            <div className="w-56 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total HT</span>
                <span className="font-medium">{euro(totalHT)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>TVA 20%</span>
                <span className="font-medium">{euro(totalTVA)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-primary-700 pt-2 border-t border-gray-200">
                <span>Total TTC</span>
                <span>{euro(totalTTC)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-5">
          <h2 className="section-title mb-3">Notes (optionnel)</h2>
          <textarea
            rows={3}
            placeholder="Conditions de paiement, références, remarques…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button loading={saving} onClick={handleSave}>
            Créer la facture
          </Button>
          <Button variant="secondary" onClick={handlePreview} type="button">
            <Eye size={14} /> Aperçu PDF
          </Button>
          <Link to="/factures">
            <Button variant="secondary" type="button">Annuler</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
