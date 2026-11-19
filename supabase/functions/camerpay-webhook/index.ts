import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // CamerPay envoie les données en x-www-form-urlencoded
    const formData = await req.formData()
    const payload: Record<string, string> = {}
    formData.forEach((value, key) => {
      payload[key] = value.toString()
    })

    console.log('[WEBHOOK] Payload reçu:', payload)

    const invoiceId = payload.merchant_invoice_id || payload.invoice_id
    const status = payload.status

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: 'Missing invoice ID' }), { status: 400, headers: corsHeaders })
    }

    // Si le paiement est un succès
    if (status === 'success' || status === 'completed' || status === 'paid') {
      
      // Connexion à Supabase avec la clé Service Role (bypass RLS)
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Mettre à jour le statut de la transaction
      // On passe de "pending_payment" à "payment_held"
      const { error } = await supabaseClient
        .from('transactions')
        .update({ status: 'payment_held' })
        .eq('id', invoiceId)

      if (error) {
        console.error('[WEBHOOK] Erreur update:', error)
        throw error
      }
      
      console.log(`[WEBHOOK] ✅ Transaction ${invoiceId} passée en "payment_held".`)
    }

    // Toujours répondre 200 à CamerPay pour accuser réception
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('[WEBHOOK] Erreur:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
