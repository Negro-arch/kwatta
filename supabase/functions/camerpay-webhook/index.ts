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
    const formData = await req.formData()
    const payload: Record<string, string> = {}
    formData.forEach((value, key) => { payload[key] = value.toString() })

    console.log('[WEBHOOK] Payload reçu:', payload)

    const transactionId = payload.merchant_invoice_id || payload.invoice_id
    const status = payload.status

    if (!transactionId) {
      return new Response(JSON.stringify({ error: 'Missing transaction ID' }), { status: 400, headers: corsHeaders })
    }

    if (status === 'success' || status === 'completed' || status === 'paid') {
      
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // 1. On récupère la transaction pour connaître le montant et le vendeur
      const { data: tx, error: txErr } = await supabaseClient
        .from('transactions')
        .select('seller_id, amount_xaf, status')
        .eq('id', transactionId)
        .single()

      if (txErr || !tx) {
        console.error('[WEBHOOK] Transaction introuvable:', txErr)
        throw new Error('Transaction introuvable')
      }

      // Si la transaction est déjà payée, on ne fait rien (évite les doublons)
      if (tx.status !== 'pending_payment') {
         return new Response(JSON.stringify({ received: true, message: 'Already processed' }), { status: 200, headers: corsHeaders })
      }

      const prixArticle = tx.amount_xaf; // C'est le montant sans les frais
      
      // 2. On ajoute l'argent au portefeuille du vendeur (en attente)
      // On suppose que tu as une fonction RPC `crediter_vendeur_en_attente` ou on fait un upsert direct
      const { error: walletErr } = await supabaseClient.rpc('ajouter_solde_en_attente', {
        p_user_id: tx.seller_id,
        p_montant: prixArticle,
        p_description: 'Vente en attente de confirmation (Commande: ' + transactionId.substring(0,8) + ')'
      })

      if (walletErr) {
        console.warn('[WEBHOOK] La fonction RPC ajouter_solde_en_attente a échoué. On tente un update direct.', walletErr)
        
        // Fallback : on met à jour le wallet manuellement
        const { data: wallet } = await supabaseClient.from('wallets').select('solde_en_attente').eq('user_id', tx.seller_id).single()
        const nouveauSolde = (wallet?.solde_en_attente || 0) + prixArticle;
        
        await supabaseClient.from('wallets').update({ solde_en_attente: nouveauSolde }).eq('user_id', tx.seller_id)
      }

      // 3. On met à jour le statut de la transaction
      const { error: updateErr } = await supabaseClient
        .from('transactions')
        .update({ status: 'payment_held' })
        .eq('id', transactionId)

      if (updateErr) throw updateErr
      
      console.log(`[WEBHOOK] ✅ Transaction ${transactionId} sécurisée. ${prixArticle} FCFA ajoutés en attente pour le vendeur ${tx.seller_id}.`)
    }

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
