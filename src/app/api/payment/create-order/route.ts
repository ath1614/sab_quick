import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/razorpay";

export const runtime = "nodejs";

/**
 * Creates a Razorpay order for an existing app order.
 * The amount is read from the DB (trusted) — never from the client.
 * Body: { orderId: string }
 */
export async function POST(req: NextRequest) {
  if (!razorpayConfigured()) {
    return NextResponse.json({ error: "Online payment is not configured" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { orderId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  // Read the trusted total; RLS guarantees the user can only read their own order.
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, total, user_id, payment_status")
    .eq("id", body.orderId)
    .single();

  if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.payment_status === "paid") {
    return NextResponse.json({ error: "Order already paid" }, { status: 409 });
  }

  try {
    const rzpOrder = await createRazorpayOrder(Number(order.total), order.id);

    // Record a pending transaction keyed by the Razorpay order id so the
    // webhook can map razorpay-order -> app-order reliably.
    const admin = createSupabaseAdminClient();
    await admin.from("transactions").upsert(
      {
        user_id: user.id,
        order_id: order.id,
        type: "payment",
        amount: Number(order.total),
        status: "pending",
        gateway_ref: rzpOrder.id,
      },
      { onConflict: "gateway_ref" }
    );

    return NextResponse.json({
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      appOrderId: order.id,
    });
  } catch (e) {
    console.error("[payment/create-order]", e);
    return NextResponse.json({ error: "Payment init failed" }, { status: 502 });
  }
}
