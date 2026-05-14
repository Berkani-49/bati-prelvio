import { Link } from 'react-router-dom'
import { HardHat, LayoutDashboard, FileText, HardHat as Chantier, Receipt, ArrowLeft } from 'lucide-react'

const QUICK_LINKS = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/devis/nouveau',  icon: FileText,         label: 'Nouveau devis'   },
  { to: '/chantiers',      icon: Chantier,         label: 'Chantiers'       },
  { to: '/factures',       icon: Receipt,          label: 'Factures'        },
]

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-5">
        <HardHat size={30} className="text-primary-600" />
      </div>

      <p className="text-7xl font-black text-gray-200 mb-2 select-none">404</p>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Page introuvable</h1>
      <p className="text-gray-500 text-sm mb-8 text-center max-w-xs">
        Cette page n'existe pas ou a été déplacée.
      </p>

      {/* Liens rapides */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6">
        {QUICK_LINKS.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-2.5 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-colors"
          >
            <Icon size={16} className="shrink-0" />
            {label}
          </Link>
        ))}
      </div>

      <Link
        to="/dashboard"
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ArrowLeft size={14} /> Retour au tableau de bord
      </Link>
    </div>
  )
}
