import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Sentry est initialisé dans main.jsx — il capte automatiquement via window.onerror
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Une erreur inattendue s'est produite</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          L'application a rencontré un problème. Vos données sont en sécurité.
        </p>
        <button
          onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard' }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl text-sm transition-colors"
        >
          <RefreshCw size={15} /> Retour au tableau de bord
        </button>
        {import.meta.env.DEV && this.state.error && (
          <pre className="mt-6 text-left text-xs bg-gray-900 text-red-300 p-4 rounded-xl max-w-xl overflow-x-auto">
            {this.state.error.toString()}
          </pre>
        )}
      </div>
    )
  }
}
