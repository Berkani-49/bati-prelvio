import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { invitationEmail } from '../_shared/email-templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: owner }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !owner) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders })

    const { member_email } = await req.json()
    if (!member_email) throw new Error('Email requis')

    const { data: entreprise } = await supabaseAdmin
      .from('entreprise')
      .select('nom')
      .eq('user_id', owner.id)
      .maybeSingle()

    const senderName = entreprise?.nom || owner.email

    const { data: existing } = await supabaseAdmin
      .from('equipe_membres')
      .select('id, invite_token, statut')
      .eq('owner_id', owner.id)
      .eq('member_email', member_email)
      .maybeSingle()

    let inviteToken: string

    if (existing) {
      if (existing.statut === 'actif') throw new Error('Ce collaborateur est déjà actif dans votre équipe')
      inviteToken = existing.invite_token
    } else {
      const { data: inserted, error: insErr } = await supabaseAdmin
        .from('equipe_membres')
        .insert({ owner_id: owner.id, member_email })
        .select('invite_token')
        .single()
      if (insErr) throw insErr
      inviteToken = inserted.invite_token
    }

    const inviteUrl = `https://bati-prelvio.vercel.app/join/${inviteToken}`
    const apiKey    = Deno.env.get('BREVO_API_KEY')!
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@batiprelvio.fr'
    const fromName  = Deno.env.get('FROM_NAME')  || 'Bati Prelvio'

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        sender:      { name: fromName, email: fromEmail },
        to:          [{ email: member_email }],
        subject:     `${senderName} vous invite à rejoindre son équipe — Bati Prelvio`,
        htmlContent: invitationEmail(senderName, inviteUrl),
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as any).message || `Erreur Brevo (${res.status})`)
    }

    return new Response(JSON.stringify({ ok: true, inviteUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
