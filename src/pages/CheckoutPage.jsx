import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import Spinner from '../components/ui/Spinner'

const PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_PRO

export default function CheckoutPage() {
  const navigate = useNavigate()

  useEffect(() => {
    async function startCheckout() {
      try {
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: { price_id: PRICE_ID },
        })
        if (error) throw error
        if (data?.url) {
          window.location.href = data.url
        } else {
          throw new Error('URL manquante')
        }
      } catch {
        toast.error('Impossible de lancer le paiement. Réessayez.')
        navigate('/parametres')
      }
    }

    startCheckout()
  }, [navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <Spinner size={28} />
      <p className="text-sm text-gray-500">Redirection vers le paiement…</p>
    </div>
  )
}
