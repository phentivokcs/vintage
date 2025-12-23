import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrderConfirmationRequest {
  orderId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { orderId }: OrderConfirmationRequest = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID hiányzik' }),
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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          variant:variants(
            *,
            product:products(
              *,
              product_images(*)
            )
          )
        ),
        billing_address:addresses!orders_billing_address_id_fkey(*),
        shipping_address:addresses!orders_shipping_address_id_fkey(*)
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      throw new Error('Rendelés nem található');
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY nincs beállítva');
    }

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('hu-HU', {
        style: 'currency',
        currency: 'HUF',
        maximumFractionDigits: 0,
      }).format(price);
    };

    const getFirstName = (fullName: string) => {
      if (!fullName) return '';
      const parts = fullName.trim().split(' ');
      return parts[parts.length - 1];
    };

    const itemsSubtotal = order.order_items.reduce((sum: number, item: any) =>
      sum + (item.unit_price_gross * item.quantity), 0
    );

    const itemsHtml = order.order_items.map((item: any) => {
      const coverImage = item.variant?.product?.product_images?.find((img: any) => img.is_cover)
        || item.variant?.product?.product_images?.[0];

      return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${coverImage ? `<img src="${coverImage.url}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">` : ''}
            <div>
              <strong>${item.title}</strong>
              ${item.attributes?.size ? `<br><span style="font-size: 12px; color: #888;">Méret: ${item.attributes.size}</span>` : ''}
              ${item.attributes?.color ? `<br><span style="font-size: 12px; color: #888;">Szín: ${item.attributes.color}</span>` : ''}
            </div>
          </div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity} db
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ${formatPrice(item.unit_price_gross * item.quantity)}
        </td>
      </tr>
      `;
    }).join('');

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@vintagevibes.hu',
        to: order.email,
        subject: `Rendelés visszaigazolás - #${order.order_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; border-bottom: 2px solid #000; padding-bottom: 15px;">
              ✅ Köszönjük a rendelésedet!
            </h1>
            
            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              Kedves ${getFirstName(order.full_name || order.email)},
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Rendelésedet sikeresen rögzítettük. Az alábbiakban találod a rendelés részleteit:
            </p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Rendelésszám:</strong> #${order.order_number}</p>
              <p style="margin: 5px 0;"><strong>Dátum:</strong> ${new Date(order.created_at).toLocaleDateString('hu-HU')}</p>
              <p style="margin: 5px 0;"><strong>Állapot:</strong> ${order.status === 'pending' ? 'Feldolgozás alatt' : order.status}</p>
            </div>
            
            <h2 style="color: #333; margin-top: 30px;">Rendelt termékek</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Termék</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Mennyiség</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Ár</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
                    Termékek összesen:
                  </td>
                  <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
                    ${formatPrice(itemsSubtotal)}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
                    Szállítási költség:
                  </td>
                  <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
                    ${formatPrice(order.shipping_fee_gross || 0)}
                  </td>
                </tr>
                ${order.discount_amount && order.discount_amount > 0 ? `
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right; border-bottom: 1px solid #eee; color: #16a34a;">
                    Kedvezmény:
                  </td>
                  <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee; color: #16a34a;">
                    -${formatPrice(order.discount_amount)}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold;">
                    Végösszeg:
                  </td>
                  <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px;">
                    ${formatPrice(order.total_gross || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
            
            <h2 style="color: #333; margin-top: 30px;">Szállítási cím</h2>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;">${order.shipping_address?.name || order.full_name}</p>
              <p style="margin: 5px 0;">${order.shipping_address?.street}</p>
              <p style="margin: 5px 0;">${order.shipping_address?.zip_code} ${order.shipping_address?.city}</p>
              <p style="margin: 5px 0;">Tel: ${order.shipping_address?.phone}</p>
            </div>
            
            <div style="background: #e8f4f8; border-left: 4px solid #0084b4; padding: 15px; margin: 30px 0;">
              <p style="margin: 0; color: #333;">
                <strong>🚚 Szállítás:</strong> Rendelésedet 2-3 munkanapon belül szállítjuk ki.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              Ha kérdésed van, nyugodtan írj nekünk!
            </p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 12px;">
                Köszönjük, hogy nálunk vásároltál! ❤️
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      console.error('Resend hiba:', errorData);
      throw new Error(`Email küldése sikertelen: ${JSON.stringify(errorData)}`);
    }

    const data = await resendResponse.json();

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Order confirmation email hiba:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Hiba történt' }),
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
