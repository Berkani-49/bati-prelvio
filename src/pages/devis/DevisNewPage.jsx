import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useSubscription } from '../../hooks/useSubscription'
import DevisForm from '../../components/devis/DevisForm'
import PaywallModal from '../../components/ui/PaywallModal'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

async function pickNextNumero() {
  const year   = new Date().getFullYear()
  const month  = String(new Date().getMonth() + 1).padStart(2, '0')
  const prefix = `DEV-${year}${month}-`

  const { data } = await supabase
    .from('devis')
    .select('numero')
    .like('numero', `${prefix}%`)
    .order('numero', { ascending: false })
    .limit(1)

  const lastSeq = data?.[0]?.numero
    ? parseInt(data[0].numero.replace(prefix, ''), 10)
    : 0

  return `${prefix}${String(lastSeq + 1).padStart(3, '0')}`
}

export default function DevisNewPage() {
  const { effectiveUserId }                            = useAuth()
  const navigate                                       = useNavigate()
  const { loading: subLoading, canCreateDevis, devisThisMonth } = useSubscription()
  const [saving, setSaving]   = useState(false)
  const [preview, setPreview] = useState('')

  useEffect(() => { pickNextNumero().then(setPreview) }, [])

  if (subLoading) return (
    <div className="flex items-center justify-center h-64"><Spinner /></div>
  )

  if (!canCreateDevis) return (
    <>
      <div className="p-4 md:p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/devis" className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Nouveau devis</h1>
        </div>
      </div>
      <PaywallModal used={devisThisMonth} onClose={() => navigate('/devis')} />
    </>
  )

  async function handleSave(data) {
    setSaving(true)
    try {
      const { client, lignes = [] } = data

      // Résolution client — évite les doublons
      let clientId = client.id
      if (!clientId) {
        // 1. Cherche par email exact
        if (client.email) {
          const { data: byEmail } = await supabase
            .from('clients').select('id')
            .eq('user_id', effectiveUserId).eq('email', client.email)
            .maybeSingle()
          if (byEmail) clientId = byEmail.id
        }
        // 2. Cherche par nom exact (évite le doublon sans email)
        if (!clientId && client.nom) {
          const { data: byNom } = await supabase
            .from('clients').select('id')
            .eq('user_id', effectiveUserId).eq('nom', client.nom)
            .maybeSingle()
          if (byNom) clientId = byNom.id
        }
        // 3. Crée le client si vraiment nouveau
        if (!clientId) {
          const { data: newClient, error: cErr } = await supabase
            .from('clients')
            .insert({
              nom:     client.nom,
              email:   client.email   || null,
              tel:     client.tel     || null,
              adresse: client.adresse || null,
              user_id: effectiveUserId,
            })
            .select().single()
          if (cErr) throw cErr
          clientId = newClient.id
        }
      }

      // Totaux
      const ht  = lignes.reduce((s, l) => s + Number(l.quantite) * Number(l.pu_ht), 0)
      const tva = ht * 0.20
      const ttc = ht + tva

      // Génère le numéro au moment du save (fraîcheur garantie)
      // Retry jusqu'à 5 fois en cas de collision rare (accès concurrent)
      let devis = null
      for (let attempt = 0; attempt < 5; attempt++) {
        const numero = await pickNextNumero()
        const { data: d, error: dErr } = await supabase
          .from('devis')
          .insert({
            user_id:   effectiveUserId,
            client_id: clientId,
            numero,
            statut:    'brouillon',
            total_ht:  Number(ht.toFixed(2)),
            total_tva: Number(tva.toFixed(2)),
            total_ttc: Number(ttc.toFixed(2)),
          })
          .select()
          .single()

        if (!dErr) { devis = d; break }

        // Si ce n'est pas une collision de numéro, on arrête
        if (!dErr?.message?.includes('unique') && !dErr?.message?.includes('duplicate')) throw dErr
        // Sinon on boucle avec un nouveau numéro
      }
      if (!devis) throw new Error('Impossible de générer un numéro unique. Réessayez.')

      // Insérer lignes
      const lignesInsert = lignes.map(l => ({
        devis_id:    devis.id,
        designation: l.designation,
        quantite:    Number(l.quantite),
        pu_ht:       Number(l.pu_ht),
        total_ht:    Number((Number(l.quantite) * Number(l.pu_ht)).toFixed(2)),
      }))
      const { error: lErr } = await supabase.from('lignes_devis').insert(lignesInsert)
      if (lErr) throw lErr

      toast.success(`Devis ${devis.numero} enregistré !`)
      navigate('/devis')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/devis"
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nouveau devis</h1>
          {preview && <p className="text-sm text-gray-500 mt-0.5">N° {preview}</p>}
        </div>
      </div>

      <DevisForm
        onSave={handleSave}
        saving={saving}
        initialNumero={preview}
      />
    </div>
  )
}
