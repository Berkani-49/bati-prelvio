import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  devisEmail,
  factureEmail,
  relanceEmail,
  signatureRequestEmail,
  invitationEmail,
} from '../_shared/email-templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const { type, to, clientName, numero, pdfBase64, montantTTC, dateEcheance, signingUrl, inviteUrl, senderName } = payload

    const apiKey = Deno.env.get('BREVO_API_KEY')
    if (!apiKey) throw new Error('BREVO_API_KEY non configurée')

    const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@batiprelvio.fr'
    const fromName  = Deno.env.get('FROM_NAME')  || 'Bati Prelvio'

    let subject    = ''
    let bodyHtml   = ''
    let attachment = pdfBase64 ? [{ name: `${type === 'facture' ? 'facture' : type === 'relance' ? 'facture' : 'devis'}-${numero}.pdf`, content: pdfBase64 }] : []

    if (type === 'devis') {
      subject  = `Votre devis N° ${numero} — Bati Prelvio`
      bodyHtml = devisEmail(clientName, numero)

    } else if (type === 'facture') {
      subject  = `Votre facture N° ${numero} — Bati Prelvio`
      bodyHtml = factureEmail(clientName, numero, montantTTC, dateEcheance)

    } else if (type === 'relance') {
      subject    = `Rappel de paiement — Facture N° ${numero}`
      bodyHtml   = relanceEmail(clientName, numero, montantTTC, dateEcheance)
      attachment = pdfBase64 ? [{ name: `facture-${numero}.pdf`, content: pdfBase64 }] : []

    } else if (type === 'signature_request') {
      subject    = `Signature requise — Devis N° ${numero}`
      bodyHtml   = signatureRequestEmail(clientName, numero, signingUrl)
      attachment = []

    } else if (type === 'invitation') {
      subject    = `Invitation à rejoindre l'équipe sur Bati Prelvio`
      bodyHtml   = invitationEmail(senderName || 'Un artisan', inviteUrl)
      attachment = []

    } else {
      throw new Error(`Type d'email inconnu : ${type}`)
    }

    const body: Record<string, unknown> = {
      sender:      { name: fromName, email: fromEmail },
      to:          [{ email: to, name: clientName || to }],
      subject,
      htmlContent: bodyHtml,
    }
    if (attachment.length > 0) body.attachment = attachment

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body:    JSON.stringify(body),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error((err as any).message || `Erreur Brevo (${response.status})`)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
