import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'
import './index.css'

// Redirect Supabase auth recovery links to the correct page before Supabase processes the hash
if (
  window.location.hash.includes('type=recovery') &&
  !window.location.pathname.startsWith('/reset-password')
) {
  window.location.replace('/reset-password' + window.location.hash)
}

// Service Worker PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
