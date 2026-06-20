import { useEffect } from "react";
import { supabase } from "./supabase";
import { useBusinessStore } from "@/store";
import type { Order, Product, Category, StaffMember, Coupon, User, Address, OrderItem } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseOrderItem = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseProduct = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseOrder = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseCategory = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseUser = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseCoupon = any;

// Helper to map Supabase product to our Product type
function mapProduct(p: SupabaseProduct): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description || "",
    price: p.price,
    mrp: p.mrp || p.price,
    image: p.image_url || "",
    category: p.category || "",
    unit: p.unit || "",
    stock: p.stock,
    eta: p.eta_minutes || 10,
    rating: p.rating || 0,
    reviews: p.review_count || 0,
    isActive: p.is_active,
  };
}

export function useRealtimeSubscriptions() {
  const setOrders = useBusinessStore((s) => s.setOrders);
  const setProducts = useBusinessStore((s) => s.setProducts);
  const setCategories = useBusinessStore((s) => s.setCategories);
  const setStaff = useBusinessStore((s) => s.setStaff);
  const setCoupons = useBusinessStore((s) => s.setCoupons);
  const setDeliveryPartners = useBusinessStore((s) => s.setDeliveryPartners);

  useEffect(() => {
    // Subscribe to orders changes
    const ordersChannel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        async () => {
          // Fetch updated orders
          const { data: ordersData } = await supabase
            .from("orders")
            .select(`
              *,
              order_items (
                *,
                products (*)
              ),
              users:user_id ( name, phone )
            `);

          if (ordersData) {
            const transformedOrders: Order[] = ordersData.map((order: SupabaseOrder) => {
              const address: Address = {
                id: order.id,
                label: "Delivery Address",
                line1: order.address_line1 || "",
                city: order.address_city || "",
                pincode: order.address_pincode || "",
              };

              const items: OrderItem[] = order.order_items.map((item: SupabaseOrderItem) => ({
                product: mapProduct(item.products),
                quantity: item.quantity,
                unitPrice: item.unit_price,
                status: item.status || "confirmed",
            rejectionReason: item.rejection_reason ?? undefined,
              }));

              return {
                id: order.id,
                userId: order.user_id,
                customerName: order.users?.name || "Customer",
                customerPhone: order.users?.phone || "",
                status: order.status as Order["status"],
                total: order.total,
                items: items,
                address: address,
                createdAt: order.created_at,
                deliveryPartnerId: order.delivery_partner_id,
              };
            });

            setOrders(transformedOrders);
          }
        }
      )
      .subscribe();

    // Subscribe to products changes
    const productsChannel = supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        async () => {
          const { data: productsData } = await supabase
            .from("products")
            .select("*");

          if (productsData) {
            setProducts(productsData.map(mapProduct));
          }
        }
      )
      .subscribe();

    // Subscribe to categories changes
    const categoriesChannel = supabase
      .channel("categories-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
        },
        async () => {
          const { data: categoriesData } = await supabase
            .from("categories")
            .select("*");

          if (categoriesData) {
            const transformedCategories: Category[] = categoriesData.map((c: SupabaseCategory) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              productCount: c.product_count,
            }));

            setCategories(transformedCategories);
          }
        }
      )
      .subscribe();

    // Subscribe to staff changes
    const staffChannel = supabase
      .channel("staff-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
          filter: "role.in.(staff,manager,owner,admin)",
        },
        async () => {
          const { data: staffData } = await supabase
            .from("users")
            .select("*")
            .in("role", ["staff", "manager", "owner", "admin"]);

          if (staffData) {
            const transformedStaff: StaffMember[] = staffData.map((s: SupabaseUser) => ({
              id: s.id,
              name: s.name,
              email: s.email,
              phone: s.phone || "",
              role: s.role as "staff" | "manager",
              isActive: s.is_active !== undefined ? s.is_active : true,
              joinedAt: s.created_at.split("T")[0],
              permissions: s.permissions || [],
            }));

            setStaff(transformedStaff);
          }
        }
      )
      .subscribe();

    // Subscribe to delivery partners changes
    const partnersChannel = supabase
      .channel("partners-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
          filter: "role.eq.delivery",
        },
        async () => {
          const { data: partnersData } = await supabase
            .from("users")
            .select("*")
            .eq("role", "delivery");

          if (partnersData) {
            const transformedPartners: User[] = partnersData.map((p: SupabaseUser) => ({
              id: p.id,
              name: p.name,
              email: p.email,
              phone: p.phone,
              role: p.role as "delivery",
            }));

            setDeliveryPartners(transformedPartners);
          }
        }
      )
      .subscribe();

    // Subscribe to coupons changes
    const couponsChannel = supabase
      .channel("coupons-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "coupons",
        },
        async () => {
          const { data: couponsData } = await supabase
            .from("coupons")
            .select("*");

          if (couponsData) {
            const transformedCoupons: Coupon[] = couponsData.map((c: SupabaseCoupon) => ({
              id: c.id,
              code: c.code,
              type: c.type as "percent" | "flat",
              value: c.value,
              minOrder: c.min_order,
              maxDiscount: c.max_discount,
              usageLimit: c.usage_limit,
              usedCount: c.used_count,
              validFrom: c.valid_from,
              validUntil: c.valid_until,
              isActive: c.is_active,
              createdAt: c.created_at,
            }));

            setCoupons(transformedCoupons);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(staffChannel);
      supabase.removeChannel(partnersChannel);
      supabase.removeChannel(couponsChannel);
    };
  }, [setOrders, setProducts, setCategories, setStaff, setCoupons, setDeliveryPartners]);

  return null;
}
