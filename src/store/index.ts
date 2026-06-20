import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, CartItem, Product, Order, Category, StaffMember, Permission, Coupon } from "@/types";
import { supabase } from "@/lib/supabase";
import { pickDriver, type DriverLoad } from "@/lib/routing";
import { cartTotal, cartCount, addToCart, setQty } from "@/lib/cart";
import type { Session } from "@supabase/supabase-js";

// ─── Auth ────────────────────────────────────────────────────────────────────
interface AuthStore {
  user: User | null;
  session: Session | null;
  setUser: (user: User | null, session: Session | null) => void;
  updateProfile: (updates: { name?: string; phone?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
}
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      setUser: (user, session) => set({ user, session }),
      updateProfile: async (updates) => {
        const u = get().user;
        if (!u) return false;
        const { data, error } = await supabase
          .from("users")
          .update({
            ...(updates.name !== undefined && { name: updates.name }),
            ...(updates.phone !== undefined && { phone: updates.phone }),
          })
          .eq("id", u.id)
          .select("id");
        if (error || !data?.length) return false;
        set({ user: { ...u, ...updates } });
        return true;
      },
      logout: async () => {
        // Must end the Supabase session (clears the auth cookies) — otherwise
        // proxy.ts still sees a valid session and re-authenticates the user.
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore network errors — still clear local state below
        }
        set({ user: null, session: null });
        try {
          localStorage.removeItem("sab-auth");
        } catch {
          // SSR / no-window safety
        }
      },
    }),
    { name: "sab-auth" }
  )
);

// ─── Cart ─────────────────────────────────────────────────────────────────────
interface CartStore {
  items: CartItem[];
  coupon: string; // code carried to checkout; validated server-side in place_order
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  setCoupon: (code: string) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
}
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: "",
      addItem: (product) => set({ items: addToCart(get().items, product) }),
      removeItem: (id) => set({ items: get().items.filter((i) => i.product.id !== id) }),
      updateQty: (id, qty) => set({ items: setQty(get().items, id, qty) }),
      setCoupon: (code) => set({ coupon: code }),
      clearCart: () => set({ items: [], coupon: "" }),
      total: () => cartTotal(get().items),
      count: () => cartCount(get().items),
    }),
    { name: "sab-cart" }
  )
);

// ─── App (splash / onboarding) ────────────────────────────────────────────────
interface AppStore {
  splashDone: boolean;
  onboardingDone: boolean;
  setSplashDone: () => void;
  setOnboardingDone: () => void;
}
export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      splashDone: false,
      onboardingDone: false,
      setSplashDone: () => set({ splashDone: true }),
      setOnboardingDone: () => set({ onboardingDone: true }),
    }),
    {
      name: "sab-app",
      partialize: (state) => ({ onboardingDone: state.onboardingDone }),
    }
  )
);

// ─── Delivery location (shared between home header & checkout) ─────────────────
interface LocationStore {
  label: string | null;   // e.g. "Andheri West"
  city: string | null;
  pincode: string | null;
  setLocation: (loc: { label?: string; city?: string; pincode?: string }) => void;
}
export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      label: null,
      city: null,
      pincode: null,
      setLocation: (loc) => set((s) => ({ ...s, ...loc })),
    }),
    { name: "sab-location" }
  )
);

// ─── Business (products, categories, orders, staff) ───────────────────────────
interface BusinessStore {
  products: Product[];
  categories: Category[];
  orders: Order[];
  staff: StaffMember[];
  coupons: Coupon[];
  deliveryPartners: User[];

  // Setters for realtime
  setOrders: (orders: Order[]) => void;
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  setStaff: (staff: StaffMember[]) => void;
  setCoupons: (coupons: Coupon[]) => void;
  setDeliveryPartners: (partners: User[]) => void;

  // Products
  addProduct: (p: Omit<Product, "id" | "rating" | "reviews">) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  updateStock: (id: string, stock: number) => Promise<void>;

  // Categories
  addCategory: (c: Omit<Category, "id" | "productCount">) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Orders
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string, reason: string) => Promise<void>;
  rejectOrderItem: (orderId: string, productId: string, reason: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;
  assignDeliveryPartner: (orderId: string, partnerId: string) => Promise<void>;
  autoAssignDeliveryPartner: (orderId: string) => Promise<string | null>;

  // Staff
  addStaffMember: (s: Omit<StaffMember, "id" | "joinedAt">) => Promise<string | null>;
  updateStaffPermissions: (staffId: string, permissions: Permission[]) => Promise<void>;
  toggleStaffActive: (staffId: string) => Promise<void>;

  // Coupons
  addCoupon: (c: Omit<Coupon, "id" | "usedCount" | "createdAt">) => Promise<void>;
  updateCoupon: (id: string, updates: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  toggleCouponActive: (id: string) => Promise<void>;
}

export const useBusinessStore = create<BusinessStore>()(
  // NOT persisted and NOT demo-seeded — order/product/staff data must always
  // come fresh from Supabase (stale demo data caused fake dashboard orders and
  // un-orderable demo products in the cart).
    (set, get) => ({
      products: [],
      categories: [],
      orders: [],
      staff: [],
      coupons: [],
      deliveryPartners: [],

      // Setters for realtime
      setOrders: (orders) => set({ orders }),
      setProducts: (products) => set({ products }),
      setCategories: (categories) => set({ categories }),
      setStaff: (staff) => set({ staff }),
      setCoupons: (coupons) => set({ coupons }),
      setDeliveryPartners: (partners) => set({ deliveryPartners: partners }),

      addProduct: async (p) => {
        // Resolve the category name/slug to a category_id for the FK.
        const cat = get().categories.find(
          (c) => c.name === p.category || c.slug === p.category || c.id === p.category
        );
        const { data, error } = await supabase
          .from("products")
          .insert({
            name: p.name,
            description: p.description,
            price: p.price,
            mrp: p.mrp,
            image_url: p.image,
            category_id: cat?.id ?? null,
            unit: p.unit,
            stock: p.stock,
            eta_minutes: p.eta,
            is_active: p.isActive,
          })
          .select()
          .single();

        if (!error && data) {
          set({
            products: [...get().products, { ...p, id: data.id, rating: 0, reviews: 0 }],
          });
        }
      },
      updateProduct: async (id, updates) => {
        // Map camelCase app fields → snake_case DB columns (only known scalars).
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.price !== undefined) dbUpdates.price = updates.price;
        if (updates.mrp !== undefined) dbUpdates.mrp = updates.mrp;
        if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
        if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
        if (updates.eta !== undefined) dbUpdates.eta_minutes = updates.eta;
        if (updates.image !== undefined) dbUpdates.image_url = updates.image;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

        const { data, error } = await supabase.from("products").update(dbUpdates).eq("id", id).select("id");
        if (!error && data?.length) {
          set({ products: get().products.map((p) => p.id === id ? { ...p, ...updates } : p) });
        }
      },
      updateStock: async (id, stock) => {
        const { data, error } = await supabase.from("products").update({ stock }).eq("id", id).select("id");
        if (!error && data?.length) {
          set({ products: get().products.map((p) => p.id === id ? { ...p, stock } : p) });
        }
      },

      addCategory: async (c) => {
        const { data, error } = await supabase
          .from("categories")
          .insert({ name: c.name, slug: c.slug, image_url: c.image })
          .select()
          .single();
        if (!error && data) {
          set({ categories: [...get().categories, { ...c, id: data.id, productCount: 0 }] });
        }
      },
      updateCategory: async (id, updates) => {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
        if (updates.image !== undefined) dbUpdates.image_url = updates.image;
        const { error } = await supabase.from("categories").update(dbUpdates).eq("id", id);
        if (!error) {
          set({ categories: get().categories.map((c) => c.id === id ? { ...c, ...updates } : c) });
        }
      },
      deleteCategory: async (id) => {
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (!error) {
          set({ categories: get().categories.filter((c) => c.id !== id) });
        }
      },

      acceptOrder: async (orderId) => {
        const { data, error } = await supabase
          .from("orders")
          .update({ status: "accepted" })
          .eq("id", orderId)
          .select("id");

        if (!error && data?.length) {
          set({
            orders: get().orders.map((o) =>
              o.id === orderId
                ? { ...o, status: "accepted", items: o.items.map((i) => ({ ...i, status: "confirmed" as const })) }
                : o
            ),
          });
        }
      },
      rejectOrder: async (orderId, reason) => {
        const { data, error } = await supabase
          .from("orders")
          .update({ status: "rejected", notes: reason })
          .eq("id", orderId)
          .select("id");

        if (!error && data?.length) {
          set({
            orders: get().orders.map((o) =>
              o.id === orderId ? { ...o, status: "rejected", rejectionReason: reason } : o
            ),
          });
        }
      },
      rejectOrderItem: async (orderId, productId, reason) => {
        // order_items has no reason column (schema), so persist the status and
        // keep the reason in local state for the UI.
        const { data, error } = await supabase
          .from("order_items")
          .update({ status: "rejected", rejection_reason: reason })
          .eq("order_id", orderId)
          .eq("product_id", productId)
          .select("id");
        if (!error && data?.length) {
          set({
            orders: get().orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    items: o.items.map((i) =>
                      i.product.id === productId
                        ? { ...i, status: "rejected" as const, rejectionReason: reason }
                        : i
                    ),
                  }
                : o
            ),
          });
        }
      },
      updateOrderStatus: async (orderId, status) => {
        const { data, error } = await supabase
          .from("orders")
          .update({ status })
          .eq("id", orderId)
          .select("id");

        if (!error && data?.length) {
          set({
            orders: get().orders.map((o) => o.id === orderId ? { ...o, status } : o),
          });
          // When an order is packed, auto-assign a delivery partner if none yet,
          // so it surfaces to a driver without manual dispatch.
          if (status === "packed") {
            const order = get().orders.find((o) => o.id === orderId);
            if (order && !order.deliveryPartnerId) {
              await get().autoAssignDeliveryPartner(orderId);
            }
          }
        }
      },
      assignDeliveryPartner: async (orderId, partnerId) => {
        const { data, error } = await supabase
          .from("orders")
          .update({ delivery_partner_id: partnerId })
          .eq("id", orderId)
          .select("id");

        if (!error && data?.length) {
          set({
            orders: get().orders.map((o) => o.id === orderId ? { ...o, deliveryPartnerId: partnerId } : o),
          });
        }
      },
      autoAssignDeliveryPartner: async (orderId) => {
        const { orders, deliveryPartners } = get();
        const activeStatuses = ["new", "accepted", "preparing", "packed", "out_for_delivery"];
        // Current load per partner = their in-flight orders.
        const loads: DriverLoad[] = deliveryPartners.map((p) => ({
          id: p.id,
          activeOrders: orders.filter(
            (o) => o.deliveryPartnerId === p.id && activeStatuses.includes(o.status)
          ).length,
        }));
        const partnerId = pickDriver(loads);
        if (!partnerId) return null;
        await get().assignDeliveryPartner(orderId, partnerId);
        return partnerId;
      },

      addStaffMember: async (s) => {
        const res = await fetch("/api/staff/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: s.name,
            email: s.email,
            phone: s.phone,
            role: s.role,
            permissions: s.permissions,
          }),
        });
        if (!res.ok) return null;
        const { id, tempPassword } = await res.json();
        set({
          staff: [
            ...get().staff,
            { ...s, id, joinedAt: new Date().toISOString().split("T")[0] },
          ],
        });
        return tempPassword as string;
      },
      updateStaffPermissions: async (staffId, permissions) => {
        const { error } = await supabase.from("users").update({ permissions }).eq("id", staffId);
        if (!error) {
          set({ staff: get().staff.map((s) => s.id === staffId ? { ...s, permissions } : s) });
        }
      },
      toggleStaffActive: async (staffId) => {
        const member = get().staff.find((s) => s.id === staffId);
        if (!member) return;
        const { error } = await supabase.from("users").update({ is_active: !member.isActive }).eq("id", staffId);
        if (!error) {
          set({ staff: get().staff.map((s) => s.id === staffId ? { ...s, isActive: !s.isActive } : s) });
        }
      },

      // Coupon Functions
      addCoupon: async (c) => {
        const { data, error } = await supabase
          .from("coupons")
          .insert({
            code: c.code.toUpperCase(),
            type: c.type,
            value: c.value,
            min_order: c.minOrder,
            max_discount: c.maxDiscount,
            usage_limit: c.usageLimit,
            valid_from: c.validFrom,
            valid_until: c.validUntil,
            is_active: c.isActive,
          })
          .select()
          .single();

        if (!error && data) {
          const newCoupon: Coupon = {
            id: data.id,
            code: data.code,
            type: data.type as "percent" | "flat",
            value: data.value,
            minOrder: data.min_order,
            maxDiscount: data.max_discount,
            usageLimit: data.usage_limit,
            usedCount: data.used_count,
            validFrom: data.valid_from,
            validUntil: data.valid_until,
            isActive: data.is_active,
            createdAt: data.created_at,
          };
          set({ coupons: [...get().coupons, newCoupon] });
        }
      },

      updateCoupon: async (id, updates) => {
        const { error } = await supabase
          .from("coupons")
          .update({
            ...(updates.code && { code: updates.code.toUpperCase() }),
            ...(updates.type && { type: updates.type }),
            ...(updates.value !== undefined && { value: updates.value }),
            ...(updates.minOrder !== undefined && { min_order: updates.minOrder }),
            ...(updates.maxDiscount !== undefined && { max_discount: updates.maxDiscount }),
            ...(updates.usageLimit !== undefined && { usage_limit: updates.usageLimit }),
            ...(updates.validFrom && { valid_from: updates.validFrom }),
            ...(updates.validUntil !== undefined && { valid_until: updates.validUntil }),
            ...(updates.isActive !== undefined && { is_active: updates.isActive }),
          })
          .eq("id", id);

        if (!error) {
          set({ coupons: get().coupons.map((c) => c.id === id ? { ...c, ...updates } : c) });
        }
      },

      deleteCoupon: async (id) => {
        const { error } = await supabase
          .from("coupons")
          .delete()
          .eq("id", id);

        if (!error) {
          set({ coupons: get().coupons.filter((c) => c.id !== id) });
        }
      },

      toggleCouponActive: async (id) => {
        const coupon = get().coupons.find((c) => c.id === id);
        if (coupon) {
          await get().updateCoupon(id, { isActive: !coupon.isActive });
        }
      },
    })
);
