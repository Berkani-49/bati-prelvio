import { useState } from 'react'
import { Download, Send, Save, ChevronLeft } from 'lucide-react'
import { generateDevisPDF, downloadPDF, getPDFBase64 } from '../../lib/pdf'
import { sendDevisEmail } from '../../lib/email'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

const TVA_RATE = 0.20

function euro(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0)
}

export default function StepPreview({ data, onBack, onSave, saving }) {
  const [sending, setSending] = useState(false)
  const { client, lignes = [], devisNumero } = data

  const totalHT  = lignes.reduce((s, l) => s + Number(l.quantite) * Number(l.pu_ht), 0)
  const totalTVA = totalHT * TVA_RATE
  const totalTTC = totalHT + totalTVA

  const entreprise = {
    nom:     localStorage.getItem('cp_nom')     || 'Votre Entreprise',
    email:   localStorage.getItem('cp_email')   || '',
    tel:     localStorage.getItem('cp_tel')      || '',
    adresse: localStorage.getItem('cp_adresse') || '',
    siret:   localStorage.getItem('cp_siret')   || '',
  }

  function buildDoc() {
    return generateDevisPDF({
      devis: { numero: devisNumero || 'BROUILLON', created_at: new Date() },
      client,
      lignes,
      entreprise,
    })
  }

  function handleDownload() {
    const doc = buildDoc()
    downloadPDF(doc, `devis-${devisNumero || 'brouillon'}.pdf`)
    toast.success('PDF téléchargé')
  }

  async function handleSendEmail() {
    if (!client?.email) {
      toast.error("Ce client n'a pas d'email renseigné")
      return
    }
    setSending(true)
    try {
      const doc   = buildDoc()
      const b64   = getPDFBase64(doc)
      await sendDevisEmail({
        to:          client.email,
        clientName:  client.nom,
        devisNumero: devisNumero || 'BROUILLON',
        pdfBase64:   b64,
      })
      toast.success(`Devis envoyé à ${client.email}`)
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'envoi')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Aperçu & Actions</h2>
        <p className="text-sm text-gray-500 mt-1">Votre devis est prêt. Enregistrez, téléchargez ou envoyez-le.</p>
      </div>

      {/* Preview card */}
      <div className="card p-6 space-y-5 font-sans">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-gray-200">
          <div>
            <p className="text-lg font-bold text-gray-900">{entreprise.nom}</p>
            {entreprise.adresse && <p className="text-xs text-gray-500 mt-0.5">{entreprise.adresse}</p>}
            {entreprise.email   && <p className="text-xs text-gray-500">{entreprise.email}</p>}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">DEVIS</p>
            <p className="text-sm font-medium text-gray-700">N° {devisNumero || '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Client */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Destinataire</p>
          <p className="font-medium text-gray-900">{client?.nom}</p>
          {client?.adresse && <p className="text-xs text-gray-600 mt-0.5">{client.adresse}</p>}
          {client?.email   && <p className="text-xs text-gray-600">{client.email}</p>}
        </div>

        {/* Articles */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-primary-600">
              <th className="text-left text-white text-xs font-semibold px-3 py-2 rounded-tl">Désignation</th>
              <th className="text-right text-white text-xs font-semibold px-3 py-2">Qté</th>
              <th className="text-right text-white text-xs font-semibold px-3 py-2">PU HT</th>
              <th className="text-right text-white text-xs font-semibold px-3 py-2 rounded-tr">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 text-gray-800">{l.designation}</td>
                <td className="px-3 py-2 text-right text-gray-700">{l.quantite}</td>
                <td className="px-3 py-2 text-right text-gray-700">{euro(l.pu_ht)}</td>
                <td className="px-3 py-2 text-right font-medium">{euro(l.quantite * l.pu_ht)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="flex justify-end">
          <div className="w-56 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total HT</span><span className="font-medium">{euro(totalHT)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>TVA 20%</span><span className="font-medium">{euro(totalTVA)}</span>
            </div>
            <div className="h-px bg-gray-300" />
            <div className="flex justify-between text-base font-bold text-primary-700">
              <span>Total TTC</span><span>{euro(totalTTC)}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 italic">Devis valable 30 jours à compter de la date d'émission.</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onBack}>
          <ChevronLeft size={15} /> Retour
        </Button>

        <div className="flex-1" />

        <Button variant="secondary" onClick={handleDownload}>
          <Download size={15} /> Télécharger PDF
        </Button>

        <Button
          variant="outline"
          onClick={handleSendEmail}
          loading={sending}
          disabled={!client?.email}
          title={!client?.email ? 'Renseignez l\'email du client' : ''}
        >
          <Send size={15} /> Envoyer par email
        </Button>

        <Button onClick={onSave} loading={saving}>
          <Save size={15} /> Enregistrer le devis
        </Button>
      </div>
    </div>
  )
}
