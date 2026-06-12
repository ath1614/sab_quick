import type { CartItem, Product } from "@/types";

// Pure cart reducers — the single source of truth for cart math, kept out of
// the store so they are unit-testable in isolation.

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function addToCart(items: CartItem[], product: Product): CartItem[] {
  const existing = items.find((i) => i.product.id === product.id);
  if (existing) {
    return items.map((i) =>
      i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
    );
  }
  return [...items, { product, quantity: 1 }];
}

export function setQty(items: CartItem[], id: string, qty: number): CartItem[] {
  if (qty <= 0) return items.filter((i) => i.product.id !== id);
  return items.map((i) => (i.product.id === id ? { ...i, quantity: qty } : i));
}
