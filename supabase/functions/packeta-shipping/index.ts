import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { randomUUID } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateTraceId(): string {
  return `packeta-${randomUUID()}`;
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

interface CreateShipmentRequest {
  orderId: string;
  carrier: "packeta" | "foxpost";
  pickupPointId?: string;
}

Deno.serve(async (req: Request) => {
  const traceId = generateTraceId();
  log(traceId, "INFO", "Shipping request received");

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

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();
    log(traceId, "INFO", "Action requested", { action });

    if (action === "create-shipment") {
      return await createShipment(req, supabaseClient, traceId);
    } else if (action === "pickup-points") {
      return await getPickupPoints(req, supabaseClient, traceId);
    } else if (action === "track") {
      return await trackShipment(req, supabaseClient, traceId);
    }

    log(traceId, "WARN", "Invalid action", { action });
    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    log(traceId, "ERROR", "Request failed", {
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

async function createShipment(req: Request, supabaseClient: any, traceId: string) {
  log(traceId, "INFO", "Creating shipment");
  const { orderId, carrier, pickupPointId }: CreateShipmentRequest = await req.json();

  const { data: order, error: orderError } = await supabaseClient
    .from("orders")
    .select(`
      *,
      shipping_address:addresses!orders_shipping_address_id_fkey(*),
      order_items(
        *,
        variant:variants(*)
      )
    `)
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return new Response(
      JSON.stringify({ error: "Order not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (order.payment_status !== "paid") {
    return new Response(
      JSON.stringify({ error: "Order not paid" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const packetaApiKey = Deno.env.get("PACKETA_API_KEY") || "";
  const packetaApiPassword = Deno.env.get("PACKETA_API_PASSWORD") || "";

  const totalWeight = order.order_items.reduce((sum: number, item: any) => {
    return sum + (item.variant?.weight_g || 500) * item.quantity;
  }, 0);

  const packetPayload = {
    number: order.id,
    name: order.shipping_address?.street?.split(",")[0] || "N/A",
    surname: "",
    email: order.email,
    phone: order.shipping_address?.phone || "",
    addressId: pickupPointId || null,
    value: parseFloat(order.total_gross),
    currency: order.currency || "HUF",
    weight: Math.ceil(totalWeight / 1000),
    eshop: "ReStyle",
  };

  const packetaApiUrl = "https://www.zasilkovna.cz/api/rest";
  const packetaAuth = btoa(`${packetaApiKey}:${packetaApiPassword}`);

  const packetaResponse = await fetch(`${packetaApiUrl}/packet/create`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${packetaAuth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(packetPayload),
  });

  if (!packetaResponse.ok) {
    const errorText = await packetaResponse.text();
    console.error("Packeta API error:", errorText);
    return new Response(
      JSON.stringify({ error: "Failed to create shipment", details: errorText }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const packetData = await packetaResponse.json();

  const { data: shipment } = await supabaseClient
    .from("shipments")
    .insert({
      order_id: orderId,
      carrier: carrier,
      tracking_number: packetData.id || packetData.number,
      status: "pending",
      label_url: packetData.labelUrl,
    })
    .select()
    .single();

  await supabaseClient
    .from("orders")
    .update({
      status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  return new Response(
    JSON.stringify({
      success: true,
      shipment: shipment,
      trackingNumber: packetData.id || packetData.number,
      labelUrl: packetData.labelUrl,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function getPickupPoints(req: Request, supabaseClient: any, traceId: string) {
  log(traceId, "INFO", "Fetching pickup points");
  const url = new URL(req.url);
  const country = url.searchParams.get("country") || "HU";
  const carrier = url.searchParams.get("carrier") || "packeta";

  if (carrier === "packeta") {
    const packetaApiKey = Deno.env.get("PACKETA_API_KEY") || "";
    const packetaResponse = await fetch(
      `https://www.zasilkovna.cz/api/v4/${packetaApiKey}/branch.json?country=${country}`
    );

    if (!packetaResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch pickup points" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const branches = await packetaResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        pickupPoints: branches.data || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({ pickupPoints: [] }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function trackShipment(req: Request, supabaseClient: any, traceId: string) {
  log(traceId, "INFO", "Tracking shipment");
  const url = new URL(req.url);
  const trackingNumber = url.searchParams.get("tracking");

  if (!trackingNumber) {
    return new Response(
      JSON.stringify({ error: "Missing tracking number" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const { data: shipment } = await supabaseClient
    .from("shipments")
    .select("*")
    .eq("tracking_number", trackingNumber)
    .single();

  if (!shipment) {
    return new Response(
      JSON.stringify({ error: "Shipment not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      shipment: shipment,
      trackingUrl: `https://tracking.packeta.com/hu/?id=${trackingNumber}`,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}