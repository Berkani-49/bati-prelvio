import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, HardHat, Receipt, Menu } from 'lucide-react'

const tabs = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Accueil' },
  { to: '/devis',     icon: FileText,         label: 'Devis'   },
  { to: '/chantiers', icon: HardHat,          label: 'Chantiers' },
  { to: '/factures',  icon: Receipt,          label: 'Factures' },
]

export default function BottomNav({ onMenuOpen }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex items-stretch h-16">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* More button → opens sidebar */}
        <button
          onClick={onMenuOpen}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-gray-500"
        >
          <Menu size={20} strokeWidth={1.8} />
          <span>Plus</span>
        </button>
      </div>
    </nav>
  )
}
