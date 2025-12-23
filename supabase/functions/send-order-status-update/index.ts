import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface StatusUpdateRequest {
  orderId: string;
  newStatus: string;
}

const STATUS_MESSAGES: Record<string, { subject: string; message: string }> = {
  'paid': {
    subject: 'Rendelésed sikeresen feldolgozva',
    message: 'Rendelésedet sikeresen feldolgoztuk és most becsomagoljuk a termékedet.'
  },
  'processing': {
    subject: 'Rendelésed csomagolás alatt',
    message: 'Rendelésed jelenleg csomagolás alatt áll. Hamarosan útnak indul!'
  },
  'shipped': {
    subject: 'Rendelésed feladva',
    message: 'Jó hír! Rendelésed feladásra került és a futárszolgálat már úton van hozzád.'
  },
  'delivered': {
    subject: 'Rendelésed kézbesítve',
    message: 'Rendelésed sikeresen kézbesítve lett. Reméljük tetszik a termék!'
  },
  'cancelled': {
    subject: 'Rendelésed törölve',
    message: 'Rendelésed törlésre került. Ha kérdésed van, lépj kapcsolatba velünk.'
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { orderId, newStatus }: StatusUpdateRequest = await req.json();

    if (!orderId || !newStatus) {
      return new Response(
        JSON.stringify({ error: 'Order ID vagy status hiányzik' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const statusInfo = STATUS_MESSAGES[newStatus];
    if (!statusInfo) {
      return new Response(
        JSON.stringify({ error: 'Ismeretlen status' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *
        ),
        shipping_address:addresses!orders_shipping_address_id_fkey(*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Rendelés nem található' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!resendApiKey) {
      console.log('RESEND_API_KEY nincs beállítva - email küldés kihagyva');
      return new Response(
        JSON.stringify({
          message: 'Email küldés kihagyva (API key hiányzik)',
          order
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const trackingInfo = newStatus === 'shipped' && order.shipping_method
      ? `<p><strong>Szállítási mód:</strong> ${order.shipping_method}</p>`
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #991B1B; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .order-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #991B1B; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusInfo.subject}</h1>
            </div>
            <div class="content">
              <p>Kedves Vásárlónk!</p>
              <p>${statusInfo.message}</p>

              <div class="order-info">
                <h2>Rendelés részletei</h2>
                <p><strong>Rendelésszám:</strong> ${order.order_number || order.id}</p>
                <p><strong>Státusz:</strong> ${newStatus}</p>
                <p><strong>Összeg:</strong> ${order.total_gross.toLocaleString('hu-HU')} ${order.currency}</p>
                ${trackingInfo}
              </div>

              <a href="${supabaseUrl.replace('//', '//www.')}/fiok" class="button">
                Rendeléseim megtekintése
              </a>

              <p>Ha bármilyen kérdésed van, nyugodtan keress minket!</p>
            </div>
            <div class="footer">
              <p>Ez egy automatikus email, kérjük ne válaszolj rá.</p>
              <p>&copy; ${new Date().getFullYear()} Vintage Store. Minden jog fenntartva.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vintage Store <noreply@yourdomain.com>',
        to: order.email,
        subject: statusInfo.subject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API hiba:', errorText);

      return new Response(
        JSON.stringify({
          error: 'Email küldés sikertelen',
          details: errorText
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const emailData = await emailResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sikeresen elküldve',
        emailId: emailData.id
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Hiba:', error);
    return new Response(
      JSON.stringify({
        error: 'Váratlan hiba történt',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});