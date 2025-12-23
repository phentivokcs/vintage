import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NewsletterRequest {
  email: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email }: NewsletterRequest = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Érvénytelen email cím' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: dbError } = await supabaseClient
      .from('newsletter_subscribers')
      .insert({ email })
      .select()
      .maybeSingle();

    if (dbError) {
      if (dbError.code === '23505') {
        return new Response(
          JSON.stringify({ success: true, message: 'Már fel vagy iratkozva!' }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
      throw dbError;
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY nincs beállítva');
      return new Response(
        JSON.stringify({ success: true, message: 'Sikeresen feliratkoztál!' }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@vintagevibes.hu',
        to: email,
        subject: 'Köszönjük a feliratkozást!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; border-bottom: 2px solid #000; padding-bottom: 15px;">
              ✨ Üdvözlünk a hírlevelünkben!
            </h1>

            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              Szia!
            </p>

            <p style="color: #666; line-height: 1.6;">
              Köszönjük, hogy feliratkoztál a hírlevelünkre! Ettől kezdve értesítünk az új termékekről,
              különleges akciókról és exkluzív ajánlatokról.
            </p>

            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
              <p style="margin: 0; font-size: 18px; color: #333;">
                🎉 Használd a <strong>WELCOME10</strong> kuponkódot az első vásárlásodnál, és kapj 10% kedvezményt!
              </p>
            </div>

            <p style="color: #666; line-height: 1.6;">
              Hamarosan jelentkezünk újabb híreinkkel!
            </p>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 12px;">
                Köszönjük a bizalmadat! ❤️
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      console.error('Resend hiba:', errorData);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Sikeresen feliratkoztál!' }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Newsletter email hiba:', error);
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
