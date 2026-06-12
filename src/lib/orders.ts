import { supabase } from "@/lib/supabase";
import type { CartItem } from "@/types";

/**
 * Place an order via the server-side `place_order` RPC.
 *
 * The total is computed ON THE SERVER from the trusted `products.price`
 * column — the client can no longer dictate the amount it pays. Items are
 * inserted and stock is decremented atomically inside the same transaction,
 * so a half-written order can never exist. See
 * supabase/migrations/0001_production_hardening.sql.
 */
export async function createOrder({
  items,
  paymentMethod,
  address,
  couponCode,
}: {
  items: CartItem[];
  paymentMethod: string;
  address: { line1: string; city: string; pincode: string };
  couponCode?: string;
  /** total is intentionally ignored server-side; kept optional for callers */
  total?: number;
  userId?: string;
}) {
  const { data: orderId, error } = await supabase.rpc("place_order", {
    p_items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
    p_address_line1: address.line1,
    p_address_city: address.city,
    p_address_pincode: address.pincode,
    p_payment_method: paymentMethod,
    p_coupon_code: couponCode ?? null,
  });

  if (error || !orderId) {
    throw new Error(error?.message ?? "Order creation failed");
  }

  return { id: orderId as string };
}
