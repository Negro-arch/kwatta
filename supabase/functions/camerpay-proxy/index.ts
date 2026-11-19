import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, phone, invoice_id } = await req.json()
    const CAMERPAY_API_KEY = Deno.env.get('CAMERPAY_SECRET_KEY')

    if (!CAMERPAY_API_KEY) {
      throw new Error('Clé secrète CamerPay non configurée sur le serveur.')
    }

    const response = await fetch('https://camerpay.biz/api/payment/initiate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CAMERPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'XAF',
        customer_phone: phone,
        merchant_invoice_id: invoice_id,
        merchant_callback_url: 'https://kwatta-sandy.vercel.app/api/webhook-camerpay',
        merchant_return_url: 'https://kwatta-sandy.vercel.app/commandes.html'
      }),
    })

    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
