import { Link } from 'react-router-dom'
import { HardHat, ArrowLeft } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-6">
        <HardHat size={32} className="text-primary-600" />
      </div>
      <p className="text-6xl font-black text-gray-900 mb-2">404</p>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Page introuvable</h1>
      <p className="text-gray-500 text-sm mb-8 text-center max-w-xs">
        Cette page n'existe pas ou a été déplacée.
      </p>
      <Link to="/dashboard">
        <Button>
          <ArrowLeft size={15} /> Retour au tableau de bord
        </Button>
      </Link>
    </div>
  )
}
