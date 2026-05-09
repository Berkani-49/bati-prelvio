import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AppLayout from './components/layout/AppLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import DevisListPage from './pages/devis/DevisListPage'
import DevisNewPage  from './pages/devis/DevisNewPage'
import DevisEditPage from './pages/devis/DevisEditPage'
import ChantierListPage   from './pages/chantiers/ChantierListPage'
import ChantierFormPage   from './pages/chantiers/ChantierFormPage'
import ChantierDetailPage from './pages/chantiers/ChantierDetailPage'
import VehiculeListPage   from './pages/vehicules/VehiculeListPage'
import VehiculeFormPage   from './pages/vehicules/VehiculeFormPage'
import PlanningPage       from './pages/planning/PlanningPage'
import PointagePage       from './pages/pointage/PointagePage'
import ClientsPage from './pages/clients/ClientsPage'
import FactureListPage from './pages/factures/FactureListPage'
import FactureNewPage  from './pages/factures/FactureNewPage'
import FactureEditPage from './pages/factures/FactureEditPage'
import ParametresPage from './pages/ParametresPage'
import RapportsPage    from './pages/RapportsPage'
import AvoirListPage  from './pages/avoirs/AvoirListPage'
import SignerPage      from './pages/SignerPage'
import JoinPage        from './pages/JoinPage'
import CheckoutPage       from './pages/CheckoutPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'
import NotFoundPage from './pages/NotFoundPage'
import MentionsLegalesPage from './pages/legal/MentionsLegalesPage'
import ConfidentialitePage from './pages/legal/ConfidentialitePage'
import CGUPage from './pages/legal/CGUPage'
import Spinner from './components/ui/Spinner'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Spinner size={28} />
    </div>
  )
  if (!user) return <Navigate to={`/login?next=${location.pathname}`} replace />
  return children
}

function CheckoutSuccessHandler() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('checkout') === 'success') {
      toast.success('Paiement confirmé ! Votre plan Pro est actif.')
      navigate('/dashboard', { replace: true })
    }
  }, [])

  return null
}

function AppRoutes() {
  return (
    <>
      <CheckoutSuccessHandler />
      <Routes>
        {/* Public routes */}
        <Route path="/"                  element={<LandingPage />} />
        <Route path="/login"             element={<LoginPage />} />
        <Route path="/mentions-legales"  element={<MentionsLegalesPage />} />
        <Route path="/confidentialite"   element={<ConfidentialitePage />} />
        <Route path="/cgu"               element={<CGUPage />} />
        <Route path="/signer/:token"     element={<SignerPage />} />
        <Route path="/join/:token"        element={<JoinPage />} />
      <Route path="/reset-password"    element={<ResetPasswordPage />} />

        {/* Protected app routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard"              element={<Dashboard />} />
          <Route path="/checkout"               element={<CheckoutPage />} />
          <Route path="/devis"                  element={<DevisListPage />} />
          <Route path="/devis/nouveau"          element={<DevisNewPage />} />
          <Route path="/devis/:id/edit"         element={<DevisEditPage />} />
          <Route path="/chantiers"              element={<ChantierListPage />} />
          <Route path="/chantiers/nouveau"      element={<ChantierFormPage />} />
          <Route path="/chantiers/:id"          element={<ChantierDetailPage />} />
          <Route path="/chantiers/:id/edit"     element={<ChantierFormPage />} />
          <Route path="/vehicules"              element={<VehiculeListPage />} />
          <Route path="/vehicules/nouveau"      element={<VehiculeFormPage />} />
          <Route path="/vehicules/:id/edit"     element={<VehiculeFormPage />} />
          <Route path="/planning"               element={<PlanningPage />} />
          <Route path="/pointage"               element={<PointagePage />} />
          <Route path="/clients"                element={<ClientsPage />} />
          <Route path="/factures"               element={<FactureListPage />} />
          <Route path="/factures/nouvelle"      element={<FactureNewPage />} />
          <Route path="/factures/:id/edit"      element={<FactureEditPage />} />
          <Route path="/rapports"               element={<RapportsPage />} />
          <Route path="/avoirs"                 element={<AvoirListPage />} />
          <Route path="/parametres"             element={<ParametresPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
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
