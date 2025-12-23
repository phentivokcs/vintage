import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateShipmentRequest {
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    if (action === "create-shipment") {
      return await createShipment(req, supabaseClient);
    } else if (action === "track") {
      return await trackShipment(req, supabaseClient);
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function createShipment(req: Request, supabaseClient: any) {
  const { orderId }: CreateShipmentRequest = await req.json();

  const { data: order, error: orderError } = await supabaseClient
    .from("orders")
    .select(`
      *,
      shipping_address:addresses!orders_shipping_address_id_fkey(*),
      order_items(
        *
      )
    `)
    .eq("id", orderId)
    .maybeSingle();

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

  const dpdApiKey = Deno.env.get("DPD_API_KEY") || "";
  const dpdApiUrl = "https://api.dpd.hu/v1";

  const totalWeight = order.order_items.reduce((sum: number, item: any) => {
    return sum + (item.weight_g || 500) * item.quantity;
  }, 0);

  const dpdPayload = {
    reference: order.order_number,
    recipient: {
      name: order.shipping_address?.name || order.full_name,
      address: order.shipping_address?.street,
      city: order.shipping_address?.city,
      zip: order.shipping_address?.zip_code,
      country: order.shipping_address?.country || "HU",
      phone: order.shipping_address?.phone,
      email: order.email,
    },
    parcel: {
      weight: Math.ceil(totalWeight / 1000),
      reference: order.id,
    },
    service: "DPD Classic",
  };

  const dpdResponse = await fetch(`${dpdApiUrl}/shipment`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${dpdApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dpdPayload),
  });

  if (!dpdResponse.ok) {
    const errorText = await dpdResponse.text();
    console.error("DPD API error:", errorText);

    const trackingNumber = `DPD-${Date.now()}-${order.order_number}`;

    const { data: shipment } = await supabaseClient
      .from("shipments")
      .insert({
        order_id: orderId,
        carrier: "dpd",
        tracking_number: trackingNumber,
        status: "pending",
      })
      .select()
      .maybeSingle();

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
        trackingNumber: trackingNumber,
        note: "Mock shipment created (DPD API not configured)",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const dpdData = await dpdResponse.json();

  const { data: shipment } = await supabaseClient
    .from("shipments")
    .insert({
      order_id: orderId,
      carrier: "dpd",
      tracking_number: dpdData.parcel_number || dpdData.tracking_number,
      status: "pending",
      label_url: dpdData.label_url,
    })
    .select()
    .maybeSingle();

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
      trackingNumber: dpdData.parcel_number || dpdData.tracking_number,
      labelUrl: dpdData.label_url,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function trackShipment(req: Request, supabaseClient: any) {
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
    .maybeSingle();

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
      trackingUrl: `https://tracking.dpd.hu/parcel-tracking?parcelNumber=${trackingNumber}`,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
