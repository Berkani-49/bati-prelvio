import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { token } = await req.json()
    if (!token) throw new Error('Token requis')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: devis, error } = await supabase
      .from('devis')
      .select('id, numero, created_at, total_ht, total_tva, total_ttc, notes, signature_base64, signe_le, signe_par, clients(nom, email, adresse, tel)')
      .eq('signature_token', token)
      .maybeSingle()

    if (error) throw error
    if (!devis) return new Response(JSON.stringify({ error: 'Devis introuvable ou lien invalide' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

    const { data: lignes } = await supabase
      .from('lignes_devis')
      .select('designation, quantite, pu_ht, total_ht')
      .eq('devis_id', devis.id)
      .order('created_at')

    return new Response(JSON.stringify({ devis, lignes: lignes || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
