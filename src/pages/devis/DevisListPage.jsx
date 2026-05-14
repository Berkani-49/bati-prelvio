import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import DevisList from '../../components/devis/DevisList'
import { useSubscription } from '../../hooks/useSubscription'

export default function DevisListPage() {
  const { isPro, devisThisMonth, devisLimit, loading } = useSubscription()

  const pct     = Math.min((devisThisMonth / devisLimit) * 100, 100)
  const atLimit = !isPro && devisThisMonth >= devisLimit
  const warning = !isPro && pct >= 60

  return (
    <div className="p-4 md:p-6 max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Devis</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez et suivez tous vos devis.</p>
      </div>

      {/* Quota free plan */}
      {!loading && !isPro && (
        <div className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${
          atLimit  ? 'bg-red-50 border-red-200'
          : warning ? 'bg-amber-50 border-amber-200'
          : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className={atLimit ? 'text-red-700' : warning ? 'text-amber-700' : 'text-gray-600'}>
                {atLimit ? 'Limite mensuelle atteinte' : `${devisThisMonth} / ${devisLimit} devis ce mois`}
              </span>
              <span className={`font-semibold ${atLimit ? 'text-red-700' : warning ? 'text-amber-700' : 'text-gray-500'}`}>
                {devisThisMonth} / {devisLimit}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${atLimit ? 'bg-red-500' : warning ? 'bg-amber-400' : 'bg-primary-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <Link
            to="/checkout"
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              atLimit
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Zap size={12} />
            {atLimit ? 'Passer en Pro' : 'Passer Pro'}
          </Link>
        </div>
      )}

      <DevisList />
    </div>
  )
}
