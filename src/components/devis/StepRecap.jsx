import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../ui/Button'

const TVA_RATE = 0.20

function euro(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0)
}

export default function StepRecap({ data, onNext, onBack }) {
  const { client, lignes = [] } = data

  const totalHT  = lignes.reduce((s, l) => s + Number(l.quantite) * Number(l.pu_ht), 0)
  const totalTVA = totalHT * TVA_RATE
  const totalTTC = totalHT + totalTVA

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Récapitulatif</h2>
        <p className="text-sm text-gray-500 mt-1">Vérifiez les informations avant de valider.</p>
      </div>

      {/* Client */}
      <div className="card p-4 space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Client</p>
        <p className="font-medium text-gray-900">{client?.nom}</p>
        {client?.email   && <p className="text-sm text-gray-600">{client.email}</p>}
        {client?.tel     && <p className="text-sm text-gray-600">{client.tel}</p>}
        {client?.adresse && <p className="text-sm text-gray-600">{client.adresse}</p>}
      </div>

      {/* Articles */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Désignation</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Qté</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">PU HT</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Total HT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lignes.map((l, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-800">{l.designation}</td>
                <td className="px-4 py-2.5 text-right text-gray-700">{Number(l.quantite).toLocaleString('fr-FR')}</td>
                <td className="px-4 py-2.5 text-right text-gray-700">{euro(l.pu_ht)}</td>
                <td className="px-4 py-2.5 text-right font-medium text-gray-900">{euro(Number(l.quantite) * Number(l.pu_ht))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totaux */}
      <div className="card p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-700">
          <span>Total HT</span>
          <span className="font-medium">{euro(totalHT)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-700">
          <span>TVA (20%)</span>
          <span className="font-medium">{euro(totalTVA)}</span>
        </div>
        <div className="h-px bg-gray-200 my-1" />
        <div className="flex justify-between text-base font-bold text-primary-700">
          <span>Total TTC</span>
          <span>{euro(totalTTC)}</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button type="button" variant="secondary" onClick={onBack}>
          <ChevronLeft size={15} /> Retour
        </Button>
        <Button type="button" onClick={() => onNext({ totalHT, totalTVA, totalTTC })}>
          Aperçu PDF <ChevronRight size={15} />
        </Button>
      </div>
    </div>
  )
}
