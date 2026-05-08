import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { retardNotifEmail } from '../_shared/email-templates.ts'

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

    const apiKey    = Deno.env.get('BREVO_API_KEY')!
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@batiprelvio.fr'
    const fromName  = Deno.env.get('FROM_NAME')  || 'Bati Prelvio'

    // Grouper par user_id pour un seul email par artisan
    const byUser: Record<string, typeof aRetard> = {}
    for (const f of aRetard) {
      if (!byUser[f.user_id]) byUser[f.user_id] = []
      byUser[f.user_id].push(f)
    }

    for (const [userId, factures] of Object.entries(byUser)) {
      const { data: { user } } = await supabase.auth.admin.getUserById(userId)
      if (!user?.email) continue

      const count = factures.length

      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({
          sender:      { name: fromName, email: fromEmail },
          to:          [{ email: user.email }],
          subject:     `${count} facture${count > 1 ? 's' : ''} en retard de paiement — Bati Prelvio`,
          htmlContent: retardNotifEmail(
            factures.map(f => ({
              numero:        f.numero,
              clientNom:     f.clients?.nom || '—',
              dateEcheance:  f.date_echeance,
              montant:       f.total_ttc || 0,
            }))
          ),
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
