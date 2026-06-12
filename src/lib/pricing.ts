// Single source of truth for order pricing on the client. These rules MUST
// mirror the server-side place_order() RPC (migrations/0001) — the server is
// authoritative; this is only for display.

export const FREE_DELIVERY_THRESHOLD = 199;
export const DELIVERY_FEE = 25;

export function deliveryFeeFor(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

/** Final payable: (subtotal - discount, floored at 0) + delivery fee. */
export function orderTotal(subtotal: number, discount = 0): number {
  const discounted = Math.max(0, subtotal - discount);
  return discounted + deliveryFeeFor(subtotal);
}
