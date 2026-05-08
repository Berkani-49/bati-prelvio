import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, PenTool, RotateCcw, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'

function euro(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0)
}

export default function SignerPage() {
  const { token }             = useParams()
  const canvasRef             = useRef(null)
  const [devis, setDevis]     = useState(null)
  const [lignes, setLignes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned]   = useState(false)
  const [signerName, setSignerName] = useState('')
  const [drawing, setDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    if (!token) { setError('Lien invalide'); setLoading(false); return }
    supabase.functions.invoke('get-devis-by-token', { body: { token } })
      .then(({ data, error: err }) => {
        if (err || data?.error) { setError(data?.error || 'Lien invalide'); setLoading(false); return }
        setDevis(data.devis)
        setLignes(data.lignes)
        setSignerName(data.devis.clients?.nom || '')
        if (data.devis.signature_base64) setSigned(true)
        setLoading(false)
      })
  }, [token])

  // Canvas drawing
  useEffect(() => {
    if (!canvasRef.current || signed) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    let isDown = false
    let lastX = 0, lastY = 0

    function getPos(e) {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      if (e.touches) {
        return [
          (e.touches[0].clientX - rect.left) * scaleX,
          (e.touches[0].clientY - rect.top) * scaleY,
        ]
      }
      return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY]
    }

    function start(e) {
      e.preventDefault()
      isDown = true
      ;[lastX, lastY] = getPos(e)
      setHasDrawn(true)
    }
    function move(e) {
      e.preventDefault()
      if (!isDown) return
      const [x, y] = getPos(e)
      ctx.beginPath()
      ctx.moveTo(lastX, lastY)
      ctx.lineTo(x, y)
      ctx.stroke()
      lastX = x; lastY = y
    }
    function end() { isDown = false }

    canvas.addEventListener('mousedown', start)
    canvas.addEventListener('mousemove', move)
    canvas.addEventListener('mouseup', end)
    canvas.addEventListener('mouseleave', end)
    canvas.addEventListener('touchstart', start, { passive: false })
    canvas.addEventListener('touchmove', move, { passive: false })
    canvas.addEventListener('touchend', end)

    return () => {
      canvas.removeEventListener('mousedown', start)
      canvas.removeEventListener('mousemove', move)
      canvas.removeEventListener('mouseup', end)
      canvas.removeEventListener('mouseleave', end)
      canvas.removeEventListener('touchstart', start)
      canvas.removeEventListener('touchmove', move)
      canvas.removeEventListener('touchend', end)
    }
  }, [signed, loading])

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  async function handleSign() {
    if (!hasDrawn) { alert('Veuillez dessiner votre signature'); return }
    if (!signerName.trim()) { alert('Veuillez indiquer votre nom'); return }

    const canvas = canvasRef.current
    const signature_base64 = canvas.toDataURL('image/png').split(',')[1]

    setSigning(true)
    const { data, error: err } = await supabase.functions.invoke('sign-devis', {
      body: { token, signature_base64, signe_par: signerName.trim() },
    })

    if (err || data?.error) {
      alert(data?.error || 'Erreur lors de la signature')
      setSigning(false)
      return
    }

    setSigned(true)
    setSigning(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader size={28} className="animate-spin text-blue-600" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <PenTool size={24} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  )

  if (signed) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Devis signé !</h1>
        {devis?.signe_le ? (
          <p className="text-gray-500 text-sm">
            Signé le {new Date(devis.signe_le).toLocaleDateString('fr-FR')} par {devis.signe_par}
          </p>
        ) : (
          <p className="text-gray-500 text-sm">Votre signature a bien été enregistrée. Merci !</p>
        )}
        <p className="text-xs text-gray-400 mt-4">Vous pouvez fermer cette page.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-blue-600 rounded-2xl p-6 text-white">
          <p className="text-blue-200 text-sm font-medium">Bati Prelvio</p>
          <h1 className="text-2xl font-bold mt-1">Devis N° {devis.numero}</h1>
          <p className="text-blue-100 text-sm mt-1">
            Du {new Date(devis.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>

        {/* Récap devis */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Destinataire</p>
            <p className="font-semibold text-gray-900 mt-0.5">{devis.clients?.nom || '—'}</p>
          </div>

          {lignes.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Désignation</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lignes.map((l, i) => (
                  <tr key={i}>
                    <td className="px-5 py-2.5 text-gray-700">
                      {l.designation}
                      <span className="text-gray-400 text-xs ml-2">× {l.quantite}</span>
                    </td>
                    <td className="px-5 py-2.5 text-right text-gray-700">{euro(l.total_ht)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="px-5 py-4 bg-blue-50 border-t border-blue-100">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Total HT</span><span>{euro(devis.total_ht)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>TVA 20%</span><span>{euro(devis.total_tva)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-blue-700">
              <span>Total TTC</span><span>{euro(devis.total_ttc)}</span>
            </div>
          </div>
        </div>

        {/* Zone de signature */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <PenTool size={16} className="text-blue-600" />
            Votre signature
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Votre nom *</label>
            <input
              type="text"
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              placeholder="Prénom NOM"
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Signez ici *</label>
              <button
                onClick={clearCanvas}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"
              >
                <RotateCcw size={12} /> Effacer
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 touch-none">
              <canvas
                ref={canvasRef}
                width={600}
                height={180}
                className="w-full cursor-crosshair block"
                style={{ touchAction: 'none' }}
              />
            </div>
            {!hasDrawn && (
              <p className="text-xs text-gray-400 mt-1 text-center">Dessinez votre signature dans la zone ci-dessus</p>
            )}
          </div>

          <button
            onClick={handleSign}
            disabled={signing || !hasDrawn || !signerName.trim()}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {signing ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            {signing ? 'Enregistrement…' : 'Valider et signer le devis'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            En signant, vous acceptez le devis N° {devis.numero} pour un montant de {euro(devis.total_ttc)} TTC.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400">
          Bati Prelvio — Logiciel de gestion BTP ·{' '}
          <a href="/confidentialite" className="underline hover:text-gray-600">Confidentialité</a>
        </p>
      </div>
    </div>
  )
}
