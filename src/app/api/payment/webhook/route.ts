import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

/**
 * Razorpay webhook — the AUTHORITATIVE source of payment truth.
 * Configure in the Razorpay dashboard pointing at /api/payment/webhook using
 * the same secret as RAZORPAY_WEBHOOK_SECRET. Subscribe to payment.captured
 * and payment.failed.
 *
 * Mapping: at create-order time we wrote a `transactions` row whose
 * `gateway_ref` is the Razorpay ORDER id; the webhook resolves the app order
 * through that row.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number } } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const rzpOrderId = payment?.order_id;
  if (!rzpOrderId) return NextResponse.json({ received: true });

  const admin = createSupabaseAdminClient();
  const { data: txn } = await admin
    .from("transactions")
    .select("order_id")
    .eq("gateway_ref", rzpOrderId)
    .maybeSingle();

  if (!txn?.order_id) return NextResponse.json({ received: true });

  if (event.event === "payment.captured") {
    await admin.from("orders").update({ payment_status: "paid" }).eq("id", txn.order_id);
    await admin
      .from("transactions")
      .update({ status: "success", gateway_ref: rzpOrderId })
      .eq("gateway_ref", rzpOrderId);
  } else if (event.event === "payment.failed") {
    await admin.from("orders").update({ payment_status: "failed" }).eq("id", txn.order_id);
    await admin.from("transactions").update({ status: "failed" }).eq("gateway_ref", rzpOrderId);
  }

  return NextResponse.json({ received: true });
}
