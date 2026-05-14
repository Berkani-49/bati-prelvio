import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const userToken = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(userToken)
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders })

    const { invite_token } = await req.json()
    if (!invite_token) throw new Error('Token invitation requis')

    // Vérifier que l'invitation existe et n'est pas déjà acceptée
    const { data: invite, error: fetchErr } = await supabaseAdmin
      .from('equipe_membres')
      .select('id, owner_id, member_email, statut')
      .eq('invite_token', invite_token)
      .maybeSingle()

    if (fetchErr) throw fetchErr
    if (!invite) throw new Error('Invitation introuvable ou expirée')
    if (invite.statut === 'actif') throw new Error('Cette invitation a déjà été acceptée')

    // Ne pas permettre au propriétaire de rejoindre sa propre équipe
    if (invite.owner_id === user.id) throw new Error('Vous ne pouvez pas rejoindre votre propre équipe')

    const { error: updateErr } = await supabaseAdmin
      .from('equipe_membres')
      .update({ member_id: user.id, statut: 'actif' })
      .eq('invite_token', invite_token)

    if (updateErr) throw updateErr

    return new Response(JSON.stringify({ ok: true, owner_id: invite.owner_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
