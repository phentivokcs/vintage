import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { randomUUID } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateTraceId(): string {
  return `barion-webhook-${randomUUID()}`;
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

Deno.serve(async (req: Request) => {
  const traceId = generateTraceId();
  log(traceId, "INFO", "Webhook received");

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

    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    const { data: rateLimitOk, error: rateLimitError } = await supabaseClient.rpc(
      "check_rate_limit",
      {
        p_client_id: `webhook-${clientIp}`,
        p_endpoint: "barion-webhook",
        p_max_requests: 100,
        p_window_seconds: 60,
      }
    );

    if (rateLimitError || !rateLimitOk) {
      log(traceId, "WARN", "Webhook rate limit exceeded", { clientIp });
      return new Response(
        JSON.stringify({ error: "Too many requests" }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const webhookPayload = await req.json();
    const { PaymentId } = webhookPayload;

    log(traceId, "INFO", "Processing payment", { PaymentId });

    if (!PaymentId) {
      log(traceId, "ERROR", "Missing PaymentId");
      return new Response(
        JSON.stringify({ error: "Missing PaymentId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const eventId = `barion-${PaymentId}`;

    const { data: existingEvent } = await supabaseClient
      .from("webhook_events")
      .select("id, processed")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingEvent) {
      if (existingEvent.processed) {
        log(traceId, "WARN", "Duplicate webhook - already processed", { eventId });
        return new Response(
          JSON.stringify({ success: true, message: "Already processed" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      log(traceId, "INFO", "Retry detected - reprocessing", { eventId });
    } else {
      await supabaseClient
        .from("webhook_events")
        .insert({
          event_id: eventId,
          provider: "barion",
          event_type: "payment_status_change",
          payload: webhookPayload,
          processed: false,
        });
      log(traceId, "INFO", "Webhook event logged", { eventId });
    }

    const barionApiUrl = `https://api.test.barion.com/v2/Payment/GetPaymentState`;
    const barionPosKey = Deno.env.get("BARION_POS_KEY") || "";

    const barionResponse = await fetch(barionApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        POSKey: barionPosKey,
        PaymentId: PaymentId,
      }),
    });

    const paymentState = await barionResponse.json();
    log(traceId, "INFO", "Barion API response", { status: paymentState.Status });

    if (!barionResponse.ok) {
      log(traceId, "ERROR", "Barion API error", paymentState);

      await supabaseClient
        .from("webhook_events")
        .update({
          error_message: JSON.stringify(paymentState),
        })
        .eq("event_id", eventId);

      return new Response(
        JSON.stringify({ error: "Failed to get payment state" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: payment, error: paymentFetchError } = await supabaseClient
      .from("payments")
      .select("*, orders(*)")
      .eq("provider_reference", PaymentId)
      .maybeSingle();

    if (!payment || paymentFetchError) {
      log(traceId, "ERROR", "Payment not found", { PaymentId });

      await supabaseClient
        .from("webhook_events")
        .update({
          error_message: "Payment not found in database",
        })
        .eq("event_id", eventId);

      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    log(traceId, "INFO", "Payment found", { orderId: payment.order_id });

    let paymentStatus = "pending";
    let orderStatus = payment.orders.status;
    let orderPaymentStatus = payment.orders.payment_status;

    if (paymentState.Status === "Succeeded") {
      paymentStatus = "captured";
      orderStatus = "paid";
      orderPaymentStatus = "paid";
    } else if (paymentState.Status === "Failed" || paymentState.Status === "Canceled") {
      paymentStatus = "failed";
      orderPaymentStatus = "failed";
    }

    log(traceId, "INFO", "Starting transaction", {
      paymentStatus,
      orderStatus,
      orderPaymentStatus,
    });

    const { error: updatePaymentError } = await supabaseClient
      .from("payments")
      .update({
        status: paymentStatus,
        raw_webhook: paymentState,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updatePaymentError) {
      log(traceId, "ERROR", "Failed to update payment", updatePaymentError);
      throw new Error(`Payment update failed: ${updatePaymentError.message}`);
    }

    const { error: updateOrderError } = await supabaseClient
      .from("orders")
      .update({
        status: orderStatus,
        payment_status: orderPaymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.order_id);

    if (updateOrderError) {
      log(traceId, "ERROR", "Failed to update order", updateOrderError);
      throw new Error(`Order update failed: ${updateOrderError.message}`);
    }

    if (paymentStatus === "captured") {
      const { data: items, error: itemsError } = await supabaseClient
        .from("order_items")
        .select("variant_id, quantity")
        .eq("order_id", payment.order_id);

      if (itemsError) {
        log(traceId, "ERROR", "Failed to fetch order items", itemsError);
        throw new Error(`Order items fetch failed: ${itemsError.message}`);
      }

      if (items) {
        for (const item of items) {
          const { error: inventoryError } = await supabaseClient.rpc(
            "decrement_inventory",
            {
              variant_id: item.variant_id,
              quantity: item.quantity,
            }
          );
          if (inventoryError) {
            log(traceId, "ERROR", "Failed to decrement inventory", {
              variant_id: item.variant_id,
              error: inventoryError,
            });
            throw new Error(`Inventory update failed: ${inventoryError.message}`);
          }
        }
        log(traceId, "INFO", "Inventory decremented", { itemCount: items.length });
      }
    }

    await supabaseClient
      .from("webhook_events")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq("event_id", eventId);

    log(traceId, "INFO", "Webhook processed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentStatus,
        orderStatus 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    log(traceId, "ERROR", "Webhook processing failed", {
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