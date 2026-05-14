import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Search, Sun, Moon } from 'lucide-react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import OnboardingModal from '../ui/OnboardingModal'
import GlobalSearch from '../ui/GlobalSearch'
import { useDarkMode } from '../../hooks/useDarkMode'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [searchOpen, setSearchOpen]     = useState(false)
  const { dark, toggle: toggleDark }    = useDarkMode()
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('cp_onboarded') && !localStorage.getItem('cp_nom')
  )

  // Raccourci clavier Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSearchOpen={() => setSearchOpen(true)} onToggleDark={toggleDark} dark={dark} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar mobile */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex-1">Bati Prelvio</span>
          <button
            onClick={toggleDark}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Basculer mode sombre"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Rechercher"
          >
            <Search size={18} />
          </button>
        </header>

        {/* Barre recherche desktop dans sidebar footer — déclencheur Cmd+K */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      <BottomNav onMenuOpen={() => setSidebarOpen(true)} />

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  )
}
