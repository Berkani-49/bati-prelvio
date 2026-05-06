import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, clientName, numero, pdfBase64 } = await req.json()

    const apiKey    = Deno.env.get('BREVO_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@batiprelvio.fr'
    const fromName  = Deno.env.get('FROM_NAME')  || 'Bati Prelvio'

    if (!apiKey) throw new Error('BREVO_API_KEY non configurée')

    const isFacture = type === 'facture'
    const subject   = isFacture ? `Votre facture N° ${numero}` : `Votre devis N° ${numero}`
    const docLabel  = isFacture ? 'facture' : 'devis'
    const fileName  = isFacture ? `facture-${numero}.pdf` : `devis-${numero}.pdf`
    const bodyText  = isFacture
      ? `Veuillez trouver ci-joint votre facture <strong>N° ${numero}</strong>.<br>Merci de régler ce montant dans les délais indiqués sur la facture.`
      : `Veuillez trouver ci-joint votre devis <strong>N° ${numero}</strong>.<br>Ce devis est valable 30 jours à compter de la date d'émission.`

    const html = `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#2563eb;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0;font-size:22px">Bati Prelvio</h1>
        </div>
        <div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px">
          <p style="color:#374151;font-size:16px">Bonjour <strong>${clientName}</strong>,</p>
          <p style="color:#6b7280">${bodyText}</p>
          <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#9ca3af;font-size:12px">
            Généré par Bati Prelvio — Logiciel de gestion BTP pour artisans<br/>
            <a href="https://bati-prelvio.vercel.app/confidentialite" style="color:#9ca3af;font-size:11px;text-decoration:none">Politique de confidentialité</a>
            &nbsp;·&nbsp;
            <a href="mailto:info@prelvio.com" style="color:#9ca3af;font-size:11px;text-decoration:none">Contact RGPD</a>
          </p>
        </div>
      </div>
    `

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        sender:      { name: fromName, email: fromEmail },
        to:          [{ email: to, name: clientName }],
        subject,
        htmlContent: html,
        attachment:  [{ name: fileName, content: pdfBase64 }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || `Erreur Brevo (${response.status})`)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
