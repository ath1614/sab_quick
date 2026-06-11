import { supabase } from "@/lib/supabase";
import type { CartItem } from "@/types";

export async function createOrder({
  items,
  total,
  paymentMethod,
  address,
  userId,
}: {
  items: CartItem[];
  total: number;
  paymentMethod: string;
  address: { line1: string; city: string; pincode: string };
  userId?: string;
}) {
  // 1. Insert order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      status: "new",
      subtotal: total,
      total,
      payment_method: paymentMethod,
      payment_status: paymentMethod === "cod" ? "pending" : "paid",
      address_line1: address.line1,
      address_city: address.city,
      address_pincode: address.pincode,
    })
    .select()
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? "Order creation failed");

  // 2. Insert order items
  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    quantity: item.quantity,
    unit_price: item.product.price,
    total_price: item.product.price * item.quantity,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) throw new Error(itemsError.message);

  // 3. Decrement stock for each product
  for (const item of items) {
    await supabase.rpc("decrement_stock", {
      p_id: item.product.id,
      qty: item.quantity,
    }).then(({ error }) => {
      // Non-fatal if RPC doesn't exist yet — stock update is best-effort
      if (error) console.warn("Stock decrement skipped:", error.message);
    });
  }

  return order;
}
