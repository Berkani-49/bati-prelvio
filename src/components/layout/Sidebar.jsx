import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, HardHat, Users, Receipt, BarChart2, FileMinus, Settings, LogOut, X, Truck, CalendarDays, Timer } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/devis',     icon: FileText,         label: 'Devis'           },
  { to: '/chantiers', icon: HardHat,          label: 'Chantiers'       },
  { to: '/clients',   icon: Users,            label: 'Clients'         },
  { to: '/factures',  icon: Receipt,          label: 'Facturation'     },
  { to: '/avoirs',    icon: FileMinus,        label: 'Avoirs'          },
  { to: '/rapports',  icon: BarChart2,        label: 'Rapports'        },
]

const navTerrain = [
  { to: '/vehicules', icon: Truck,        label: 'Véhicules'     },
  { to: '/planning',  icon: CalendarDays, label: 'Planning'      },
  { to: '/pointage',  icon: Timer,        label: 'Pointage'      },
]

export default function Sidebar({ open, onClose }) {
  const { signOut } = useAuth()
  const navigate    = useNavigate()

  async function handleSignOut() {
    await signOut()
    toast.success('Déconnecté')
    navigate('/login')
  }

  const sidebarContent = (
    <aside className="w-56 shrink-0 bg-slate-900 flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-800">
        <img
          src="/logo.png"
          alt="Bati Prelvio"
          className="w-9 h-9 rounded-lg object-contain bg-white p-0.5 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-none">Bati Prelvio</p>
          <p className="text-slate-500 text-xs mt-0.5">Gestion BTP</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white md:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gestion</p>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
        <p className="px-3 mt-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Terrain</p>
        {navTerrain.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-0.5">
        <NavLink
          to="/parametres"
          onClick={onClose}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Settings size={16} />
          Paramètres
        </NavLink>
        <button onClick={handleSignOut} className="sidebar-link w-full">
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  )

  return (
    <>
      <div className="hidden md:flex h-full">
        {sidebarContent}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50 flex md:hidden">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  )
}
