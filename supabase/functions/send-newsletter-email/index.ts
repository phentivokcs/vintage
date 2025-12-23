import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY nincs beállítva');
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: email,
        subject: '👋 Teszt Email - Newsletter Funkció',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; font-size: 24px;">🎉 Szia!</h1>
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Ez egy <strong>teszt email</strong> a newsletter funkció ellenőrzésére.
            </p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #666;">
                <strong>✅ A rendszer működik!</strong><br/>
                Email címed: <code style="background: #fff; padding: 2px 6px; border-radius: 4px;">${email}</code>
              </p>
            </div>
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              Amikor a <strong>dotroll.hu</strong> domain verifikálva lesz a Resend-nél, 
              az email-ek már <code>info@dotroll.hu</code> címről fognak érkezni és 
              bármelyik címre küldhetsz majd!
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">
              Ez egy automatikus teszt email 🚀
            </p>
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