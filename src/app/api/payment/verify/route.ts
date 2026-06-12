import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { verifyPaymentSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

/**
 * Called by the client right after the Razorpay checkout succeeds, for an
 * immediate (optimistic) confirmation. The webhook remains the authoritative
 * source of truth. Body: { appOrderId, razorpayOrderId, razorpayPaymentId, signature }
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let b: {
    appOrderId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    signature?: string;
  };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!b.appOrderId || !b.razorpayOrderId || !b.razorpayPaymentId || !b.signature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!verifyPaymentSignature(b.razorpayOrderId, b.razorpayPaymentId, b.signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Confirm the order belongs to this user, then mark paid via admin client.
  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id, total")
    .eq("id", b.appOrderId)
    .single();
  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Optimistic confirmation. The webhook is authoritative; this just updates
  // the pending transaction created at create-order time (keyed by the
  // Razorpay order id) so the UI reflects success immediately.
  const admin = createSupabaseAdminClient();
  await admin.from("orders").update({ payment_status: "paid" }).eq("id", order.id);
  await admin
    .from("transactions")
    .update({ status: "success" })
    .eq("gateway_ref", b.razorpayOrderId)
    .eq("order_id", order.id);

  return NextResponse.json({ ok: true });
}
