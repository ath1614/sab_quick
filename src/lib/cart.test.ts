import { describe, it, expect } from "vitest";
import { cartTotal, cartCount, addToCart, setQty } from "@/lib/cart";
import type { CartItem, Product } from "@/types";

const product = (id: string, price: number): Product => ({
  id,
  name: `P${id}`,
  description: "",
  price,
  mrp: price,
  image: "",
  category: "",
  unit: "1pc",
  stock: 100,
  eta: 10,
  rating: 0,
  reviews: 0,
  isActive: true,
});

const items: CartItem[] = [
  { product: product("a", 50), quantity: 2 },
  { product: product("b", 30), quantity: 1 },
];

describe("cart math", () => {
  it("totals price * quantity", () => {
    expect(cartTotal(items)).toBe(130);
    expect(cartTotal([])).toBe(0);
  });
  it("counts quantities", () => {
    expect(cartCount(items)).toBe(3);
  });
});

describe("addToCart", () => {
  it("adds a new product with quantity 1", () => {
    const next = addToCart([], product("a", 50));
    expect(next).toHaveLength(1);
    expect(next[0].quantity).toBe(1);
  });
  it("increments an existing product", () => {
    const next = addToCart(items, product("a", 50));
    expect(next.find((i) => i.product.id === "a")?.quantity).toBe(3);
    expect(next).toHaveLength(2);
  });
});

describe("setQty", () => {
  it("updates quantity", () => {
    expect(setQty(items, "a", 5).find((i) => i.product.id === "a")?.quantity).toBe(5);
  });
  it("removes the item at qty <= 0", () => {
    expect(setQty(items, "a", 0).find((i) => i.product.id === "a")).toBeUndefined();
  });
});
