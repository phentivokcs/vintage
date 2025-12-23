import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { randomUUID } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateTraceId(): string {
  return `billingo-invoice-${randomUUID()}`;
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

interface BillingoInvoiceRequest {
  orderId: string;
}

Deno.serve(async (req: Request) => {
  const traceId = generateTraceId();
  log(traceId, "INFO", "Invoice request received");

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

    const { orderId }: BillingoInvoiceRequest = await req.json();
    log(traceId, "INFO", "Processing invoice", { orderId });

    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select(`
        *,
        billing_address:addresses!orders_billing_address_id_fkey(*),
        order_items(
          *,
          variant:variants(*)
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      log(traceId, "ERROR", "Order not found", { orderId });
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (order.payment_status !== "paid") {
      log(traceId, "WARN", "Order not paid yet", { orderId });
      return new Response(
        JSON.stringify({ error: "Order not paid yet" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (order.invoice_number) {
      log(traceId, "INFO", "Invoice already exists", { invoiceNumber: order.invoice_number });
      return new Response(
        JSON.stringify({ 
          success: true, 
          invoiceNumber: order.invoice_number,
          message: "Invoice already exists"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const billingoApiKey = Deno.env.get("BILLINGO_API_KEY") || "";
    const billingoApiUrl = "https://api.billingo.hu/v3";

    const partnerPayload = {
      name: order.billing_address?.street || "N/A",
      address: {
        country_code: order.billing_address?.country || "HU",
        post_code: order.billing_address?.zip_code || "",
        city: order.billing_address?.city || "",
        address: order.billing_address?.street || "",
      },
      emails: [order.email],
      taxcode: "",
    };

    const partnerResponse = await fetch(`${billingoApiUrl}/partners`, {
      method: "POST",
      headers: {
        "X-API-KEY": billingoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(partnerPayload),
    });

    if (!partnerResponse.ok) {
      const errorData = await partnerResponse.json();
      log(traceId, "ERROR", "Billingo partner creation failed", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to create partner", details: errorData }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const partner = await partnerResponse.json();

    const invoiceItems = order.order_items.map((item: any) => ({
      name: item.title,
      unit_price: parseFloat(item.unit_price_gross),
      unit_price_type: "gross",
      quantity: item.quantity,
      unit: "db",
      vat: item.vat_rate?.toString() || "27",
      comment: item.sku,
    }));

    if (order.shipping_fee_gross > 0) {
      invoiceItems.push({
        name: "Szállítási költség",
        unit_price: parseFloat(order.shipping_fee_gross),
        unit_price_type: "gross",
        quantity: 1,
        unit: "db",
        vat: "27",
        comment: order.shipping_method || "standard",
      });
    }

    const invoicePayload = {
      partner_id: partner.id,
      block_id: 0,
      type: "invoice",
      fulfillment_date: new Date().toISOString().split("T")[0],
      due_date: new Date().toISOString().split("T")[0],
      payment_method: "card",
      language: "hu",
      currency: order.currency || "HUF",
      paid: true,
      items: invoiceItems,
      comment: `Rendelés: ${order.id}`,
    };

    const invoiceResponse = await fetch(`${billingoApiUrl}/documents`, {
      method: "POST",
      headers: {
        "X-API-KEY": billingoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoicePayload),
    });

    if (!invoiceResponse.ok) {
      const errorData = await invoiceResponse.json();
      log(traceId, "ERROR", "Billingo invoice creation failed", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to create invoice", details: errorData }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const invoice = await invoiceResponse.json();
    log(traceId, "INFO", "Invoice created", { invoiceNumber: invoice.invoice_number });

    await supabaseClient
      .from("orders")
      .update({
        invoice_number: invoice.invoice_number,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        invoiceNumber: invoice.invoice_number,
        invoiceId: invoice.id,
        downloadUrl: `${billingoApiUrl}/documents/${invoice.id}/download`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    log(traceId, "ERROR", "Invoice processing failed", {
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