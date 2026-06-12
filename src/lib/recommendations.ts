import type { Product } from "@/types";

/**
 * Crude brand extraction: the first word of the product name, normalized.
 * "Amul Gold Milk" -> "amul", "Tata Salt" -> "tata".
 */
export function brandOf(name: string): string {
  return (name?.trim().split(/\s+/)[0] || "").toLowerCase();
}

/**
 * Recommend related products for a product detail view.
 * Priority: same brand (e.g. all Amul) > same category > higher rating.
 * Always returns up to `limit` active products (never the product itself).
 */
export function recommendProducts(current: Product, all: Product[], limit = 6): Product[] {
  const brand = brandOf(current.name);
  const others = all.filter((p) => p.id !== current.id && p.isActive);

  return others
    .map((p) => {
      let score = 0;
      if (brand && brandOf(p.name) === brand) score += 10; // same brand
      if (p.category && p.category === current.category) score += 5; // same category
      return { p, score };
    })
    .sort((a, b) => b.score - a.score || (b.p.rating || 0) - (a.p.rating || 0))
    .slice(0, limit)
    .map((s) => s.p);
}
