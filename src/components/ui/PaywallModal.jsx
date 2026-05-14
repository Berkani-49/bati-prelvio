import { useNavigate } from 'react-router-dom'
import { Zap, Check, Lock, FileText, HardHat, Receipt, BarChart2, Users } from 'lucide-react'
import { FREE_DEVIS_LIMIT, FREE_FACTURES_LIMIT } from '../../hooks/useSubscription'

const PRO_FEATURES = [
  { icon: FileText,  text: 'Devis illimités chaque mois' },
  { icon: Receipt,   text: 'Facturation illimitée' },
  { icon: HardHat,   text: 'Gestion chantiers sans restriction' },
  { icon: Users,     text: 'Invitation de collaborateurs' },
  { icon: BarChart2, text: 'Rapports et exports CSV' },
]

export default function PaywallModal({ used, limit, type = 'devis', onClose }) {
  const navigate = useNavigate()

  const isFacture = type === 'facture'
  const resolvedLimit = limit ?? (isFacture ? FREE_FACTURES_LIMIT : FREE_DEVIS_LIMIT)
  const labelPlural = isFacture ? 'factures' : 'devis'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-blue-700 px-8 py-7 text-white text-center">
          <div className="flex items-center justify-center w-14 h-14 bg-white/15 rounded-2xl mx-auto mb-4">
            <Lock size={26} className="text-white" />
          </div>
          <h2 className="text-xl font-bold mb-1">Limite gratuite atteinte</h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            Vous avez utilisé {used} {labelPlural} sur {resolvedLimit} ce mois-ci.<br />
            Passez en Pro pour continuer sans limite.
          </p>
        </div>

        {/* Barre de quota */}
        <div className="px-8 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex justify-between text-xs font-medium text-gray-500 mb-1.5">
            <span>{isFacture ? 'Factures' : 'Devis'} ce mois</span>
            <span className="text-red-600 font-semibold">{used} / {resolvedLimit}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Features Pro */}
        <div className="px-8 py-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Avec le plan Pro</p>
          <ul className="space-y-2.5">
            {PRO_FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-50 rounded-md shrink-0">
                  <Icon size={13} className="text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">{text}</span>
                <Check size={13} className="text-green-500 ml-auto shrink-0" />
              </li>
            ))}
          </ul>
        </div>

        {/* Prix + CTA */}
        <div className="px-8 pb-7 space-y-3">
          <div className="flex items-baseline gap-1 justify-center">
            <span className="text-3xl font-extrabold text-gray-900">29 €</span>
            <span className="text-gray-500 text-sm">/ mois · sans engagement</span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
          >
            <Zap size={16} />
            Passer en Pro — Essai 30 jours gratuit
          </button>
          {onClose && (
            <button onClick={onClose} className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors">
              Plus tard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
