import { describe, it, expect } from "vitest";
import { brandOf, recommendProducts } from "@/lib/recommendations";
import type { Product } from "@/types";

const p = (id: string, name: string, category = "c1", rating = 0): Product => ({
  id, name, description: "", price: 50, mrp: 60, image: "", category,
  unit: "1pc", stock: 10, eta: 10, rating, reviews: 0, isActive: true,
});

describe("brandOf", () => {
  it("takes the first word, lowercased", () => {
    expect(brandOf("Amul Gold Milk")).toBe("amul");
    expect(brandOf("Tata Salt")).toBe("tata");
    expect(brandOf("")).toBe("");
  });
});

describe("recommendProducts", () => {
  const current = p("1", "Amul Gold Milk", "dairy");
  const all = [
    current,
    p("2", "Amul Butter", "dairy"),
    p("3", "Amul Cheese", "dairy"),
    p("4", "Tata Salt", "grocery"),
    p("5", "Britannia Bread", "dairy", 5),
  ];

  it("never includes the product itself", () => {
    expect(recommendProducts(current, all).some((r) => r.id === "1")).toBe(false);
  });

  it("ranks same-brand products first (Amul -> Amul)", () => {
    const recs = recommendProducts(current, all, 3);
    expect(recs.slice(0, 2).map((r) => r.name)).toEqual(["Amul Butter", "Amul Cheese"]);
  });

  it("respects the limit", () => {
    expect(recommendProducts(current, all, 2)).toHaveLength(2);
  });

  it("falls back to same-category / rating when no same brand", () => {
    const lonely = p("9", "Mother Dairy Curd", "dairy");
    const recs = recommendProducts(lonely, all, 2);
    // same category (dairy) preferred; Britannia Bread (dairy, rating 5) ranks high
    expect(recs.every((r) => r.id !== "9")).toBe(true);
    expect(recs.length).toBe(2);
  });
});
