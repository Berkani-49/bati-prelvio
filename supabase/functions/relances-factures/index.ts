import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1. Passer en "en_retard" les factures dont l'échéance est dépassée
    const today = new Date().toISOString().split('T')[0]

    const { data: aRetard, error: updateErr } = await supabase
      .from('factures')
      .update({ statut: 'en_retard' })
      .lt('date_echeance', today)
      .in('statut', ['brouillon', 'envoyee'])
      .select('id, numero, total_ttc, date_echeance, user_id, clients(nom, email)')

    if (updateErr) throw updateErr

    if (!aRetard?.length) {
      return new Response(JSON.stringify({ ok: true, updated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Envoyer un email de relance au propriétaire pour chaque facture en retard
    const apiKey    = Deno.env.get('BREVO_API_KEY')!
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@batiprelvio.fr'
    const fromName  = Deno.env.get('FROM_NAME')  || 'Bati Prelvio'

    // Grouper par user_id pour envoyer un seul email par utilisateur
    const byUser: Record<string, typeof aRetard> = {}
    for (const f of aRetard) {
      if (!byUser[f.user_id]) byUser[f.user_id] = []
      byUser[f.user_id].push(f)
    }

    for (const [userId, factures] of Object.entries(byUser)) {
      // Récupérer l'email de l'utilisateur
      const { data: { user } } = await supabase.auth.admin.getUserById(userId)
      if (!user?.email) continue

      const rows = factures.map(f => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb">${f.numero}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb">${f.clients?.nom || '—'}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb">${f.date_echeance ? new Date(f.date_echeance).toLocaleDateString('fr-FR') : '—'}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(f.total_ttc || 0)}</td>
        </tr>
      `).join('')

      const html = `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#2563eb;padding:24px 32px;border-radius:8px 8px 0 0">
            <h1 style="color:white;margin:0;font-size:22px">Bati Prelvio</h1>
          </div>
          <div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px">
            <p style="color:#374151;font-size:16px">Bonjour,</p>
            <p style="color:#6b7280">Les factures suivantes sont <strong style="color:#dc2626">en retard de paiement</strong> :</p>
            <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px">
              <thead>
                <tr style="background:#f3f4f6">
                  <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280">N° Facture</th>
                  <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280">Client</th>
                  <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280">Échéance</th>
                  <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280">Montant TTC</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <p style="margin-top:24px;color:#6b7280;font-size:14px">
              Connectez-vous à votre espace pour relancer vos clients.
            </p>
            <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0"/>
            <p style="color:#9ca3af;font-size:12px">
              Bati Prelvio — Logiciel de gestion BTP pour artisans<br/>
              <a href="https://bati-prelvio.vercel.app/confidentialite" style="color:#9ca3af;font-size:11px;text-decoration:none">Politique de confidentialité</a>
            </p>
          </div>
        </div>
      `

      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({
          sender:      { name: fromName, email: fromEmail },
          to:          [{ email: user.email }],
          subject:     `⚠️ ${factures.length} facture${factures.length > 1 ? 's' : ''} en retard de paiement`,
          htmlContent: html,
        }),
      })
    }

    return new Response(
      JSON.stringify({ ok: true, updated: aRetard.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
