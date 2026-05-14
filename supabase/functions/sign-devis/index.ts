import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { token, signature_base64, signe_par } = await req.json()

    if (!token)            throw new Error('Token requis')
    if (!signature_base64) throw new Error('Signature requise')
    if (!signe_par?.trim()) throw new Error('Nom du signataire requis')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Vérifier que le devis existe et n'est pas déjà signé
    const { data: existing, error: fetchErr } = await supabase
      .from('devis')
      .select('id, signature_base64')
      .eq('signature_token', token)
      .maybeSingle()

    if (fetchErr) throw fetchErr
    if (!existing) throw new Error('Devis introuvable ou lien invalide')
    if (existing.signature_base64) throw new Error('Ce devis a déjà été signé')

    const { error: updateErr } = await supabase
      .from('devis')
      .update({
        signature_base64,
        signe_par:  signe_par.trim(),
        signe_le:   new Date().toISOString(),
        statut:     'accepte',
      })
      .eq('signature_token', token)

    if (updateErr) throw updateErr

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
