import { describe, it, expect } from "vitest";
import { deliveryFeeFor, orderTotal, FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from "@/lib/pricing";

describe("deliveryFeeFor", () => {
  it("charges the fee below the free threshold", () => {
    expect(deliveryFeeFor(0)).toBe(DELIVERY_FEE);
    expect(deliveryFeeFor(FREE_DELIVERY_THRESHOLD - 1)).toBe(DELIVERY_FEE);
  });
  it("is free at or above the threshold", () => {
    expect(deliveryFeeFor(FREE_DELIVERY_THRESHOLD)).toBe(0);
    expect(deliveryFeeFor(1000)).toBe(0);
  });
});

describe("orderTotal", () => {
  it("adds delivery fee for small carts", () => {
    expect(orderTotal(100)).toBe(100 + DELIVERY_FEE);
  });
  it("applies discount then floors at zero", () => {
    expect(orderTotal(100, 30)).toBe(70 + DELIVERY_FEE);
    expect(orderTotal(100, 999)).toBe(0 + DELIVERY_FEE);
  });
  it("free delivery on large carts even with discount", () => {
    expect(orderTotal(500, 50)).toBe(450);
  });
});
