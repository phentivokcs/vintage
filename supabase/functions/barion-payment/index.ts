import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { randomUUID } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateTraceId(): string {
  return `barion-payment-${randomUUID()}`;
}

function log(traceId: string, level: string, message: string, data?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    traceId,
    level,
    message,
    ...(data && { data }),
  };
  console.log(JSON.stringify(logEntry));
}

interface BarionPaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  payerEmail: string;
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    itemTotal: number;
    sku: string;
  }>;
}

Deno.serve(async (req: Request) => {
  const traceId = generateTraceId();
  log(traceId, "INFO", "Payment request received");

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      log(traceId, "ERROR", "Unauthorized request", { error: userError?.message });
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    log(traceId, "INFO", "User authenticated", { userId: user.id });

    const { data: rateLimitOk, error: rateLimitError } = await supabaseClient.rpc(
      "check_rate_limit",
      {
        p_client_id: user.id,
        p_endpoint: "barion-payment",
        p_max_requests: 5,
        p_window_seconds: 60,
      }
    );

    if (rateLimitError || !rateLimitOk) {
      log(traceId, "WARN", "Rate limit exceeded", { userId: user.id });
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please try again in a moment.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { orderId, amount, currency, payerEmail, items }: BarionPaymentRequest = await req.json();

    log(traceId, "INFO", "Payment details", { orderId, amount, currency });

    const barionApiUrl = "https://api.test.barion.com/v2/Payment/Start";
    const barionPosKey = Deno.env.get("BARION_POS_KEY") || "";
    const baseUrl = req.headers.get("origin") || "http://localhost:5173";

    const barionPayload = {
      POSKey: barionPosKey,
      PaymentType: "Immediate",
      GuestCheckOut: false,
      FundingSources: ["All"],
      PaymentRequestId: orderId,
      PayerHint: payerEmail,
      Locale: "hu-HU",
      Currency: currency,
      RedirectUrl: `${baseUrl}/rendeles/${orderId}/megerosites`,
      CallbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/barion-webhook`,
      Transactions: [
        {
          POSTransactionId: `${orderId}-1`,
          Payee: payerEmail,
          Total: amount,
          Items: items,
        },
      ],
    };

    log(traceId, "INFO", "Sending to Barion", { orderId });

    const barionResponse = await fetch(barionApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(barionPayload),
    });

    const barionData = await barionResponse.json();
    log(traceId, "INFO", "Barion response received", {
      success: barionResponse.ok,
      paymentId: barionData.PaymentId,
    });

    if (!barionResponse.ok || barionData.Errors?.length > 0) {
      log(traceId, "ERROR", "Barion API error", barionData);
      const errorMessage = barionData.Errors?.map((e: any) =>
        `${e.ErrorCode}: ${e.Title} - ${e.Description}`
      ).join("; ") || "Unknown error";

      return new Response(
        JSON.stringify({
          success: false,
          error: "Barion fizetés hiba",
          details: errorMessage,
          errors: barionData.Errors
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        order_id: orderId,
        provider: "barion",
        amount: amount,
        currency: currency,
        status: "pending",
        provider_reference: barionData.PaymentId,
        raw_webhook: barionData,
      });

    if (paymentError) {
      log(traceId, "ERROR", "Database error", paymentError);
    } else {
      log(traceId, "INFO", "Payment record created", { orderId });
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: barionData.PaymentId,
        gatewayUrl: barionData.GatewayUrl,
        redirectUrl: barionData.GatewayUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    log(traceId, "ERROR", "Payment processing failed", {
      error: error.message,
      stack: error.stack,
    });
    return new Response(
      JSON.stringify({ error: error.message, traceId }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});