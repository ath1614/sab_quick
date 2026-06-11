import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Product, Category } from "@/types";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? "",
        price: p.price,
        mrp: p.mrp,
        image: p.image_url ?? "",
        category: p.category_id ?? "",
        unit: p.unit,
        stock: p.stock,
        eta: p.eta_minutes ?? 10,
        rating: p.rating ?? 0,
        reviews: p.review_count ?? 0,
        isActive: p.is_active,
      }));
    },
    staleTime: 60_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image_url ?? undefined,
      }));
    },
    staleTime: 300_000,
  });
}

export function useOrders(userId?: string) {
  return useQuery({
    queryKey: ["orders", userId],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*, order_items(*, products(*))")
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}
