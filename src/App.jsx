import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AppLayout from './components/layout/AppLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import DevisListPage from './pages/devis/DevisListPage'
import DevisNewPage  from './pages/devis/DevisNewPage'
import DevisEditPage from './pages/devis/DevisEditPage'
import ChantierListPage from './pages/chantiers/ChantierListPage'
import ChantierFormPage from './pages/chantiers/ChantierFormPage'
import ClientsPage from './pages/clients/ClientsPage'
import FactureListPage from './pages/factures/FactureListPage'
import FactureNewPage  from './pages/factures/FactureNewPage'
import FactureEditPage from './pages/factures/FactureEditPage'
import ParametresPage from './pages/ParametresPage'
import NotFoundPage from './pages/NotFoundPage'
import MentionsLegalesPage from './pages/legal/MentionsLegalesPage'
import ConfidentialitePage from './pages/legal/ConfidentialitePage'
import CGUPage from './pages/legal/CGUPage'
import Spinner from './components/ui/Spinner'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Spinner size={28} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"                  element={<LandingPage />} />
      <Route path="/login"             element={<LoginPage />} />
      <Route path="/mentions-legales"  element={<MentionsLegalesPage />} />
      <Route path="/confidentialite"   element={<ConfidentialitePage />} />
      <Route path="/cgu"               element={<CGUPage />} />

      {/* Protected app routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard"              element={<Dashboard />} />
        <Route path="/devis"                  element={<DevisListPage />} />
        <Route path="/devis/nouveau"          element={<DevisNewPage />} />
        <Route path="/devis/:id/edit"         element={<DevisEditPage />} />
        <Route path="/chantiers"              element={<ChantierListPage />} />
        <Route path="/chantiers/nouveau"      element={<ChantierFormPage />} />
        <Route path="/chantiers/:id/edit"     element={<ChantierFormPage />} />
        <Route path="/clients"                element={<ClientsPage />} />
        <Route path="/factures"               element={<FactureListPage />} />
        <Route path="/factures/nouvelle"      element={<FactureNewPage />} />
        <Route path="/factures/:id/edit"      element={<FactureEditPage />} />
        <Route path="/parametres"             element={<ParametresPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontSize: '14px', borderRadius: '10px' },
            success: { iconTheme: { primary: '#2563eb', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
