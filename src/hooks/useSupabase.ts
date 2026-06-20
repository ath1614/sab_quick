import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Product, Category, Order } from "@/types";

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

// Map a raw Supabase order row (snake_case + nested order_items) to the app
// Order shape the UI expects. Without this, pages crash on order.items /
// order.address.city.
/* eslint-disable @typescript-eslint/no-explicit-any */
function mapOrderRow(o: any): Order {
  return {
    id: o.id,
    userId: o.user_id,
    customerName: o.users?.name ?? "Customer",
    customerPhone: o.users?.phone ?? "",
    status: o.status,
    total: o.total,
    items: (o.order_items ?? []).map((it: any) => ({
      product: it.products ? mapProductRow(it.products) : ({} as Product),
      quantity: it.quantity,
      unitPrice: it.unit_price,
      status: it.status ?? "confirmed",
    })),
    address: {
      id: o.id,
      label: "Delivery Address",
      line1: o.address_line1 ?? "",
      city: o.address_city ?? "",
      pincode: o.address_pincode ?? "",
    },
    createdAt: o.created_at,
    deliveryPartnerId: o.delivery_partner_id ?? undefined,
  };
}

function mapProductRow(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    price: p.price,
    mrp: p.mrp ?? p.price,
    image: p.image_url ?? "",
    category: p.category_id ?? "",
    unit: p.unit ?? "",
    stock: p.stock ?? 0,
    eta: p.eta_minutes ?? 10,
    rating: p.rating ?? 0,
    reviews: p.review_count ?? 0,
    isActive: p.is_active ?? true,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function useOrders(userId?: string) {
  return useQuery({
    queryKey: ["orders", userId],
    queryFn: async (): Promise<Order[]> => {
      let query = supabase
        .from("orders")
        .select("*, order_items(*, products(*)), users:user_id(name, phone)")
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapOrderRow);
    },
    staleTime: 30_000,
  });
}
