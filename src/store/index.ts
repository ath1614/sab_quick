import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, CartItem, Product, Order, Category, StaffMember, Permission, Coupon } from "@/types";
import { DEMO_PRODUCTS, DEMO_ORDERS, DEMO_CATEGORIES, DEMO_STAFF } from "@/lib/demo-data";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

// ─── Auth ────────────────────────────────────────────────────────────────────
interface AuthStore {
  user: User | null;
  session: Session | null;
  setUser: (user: User | null, session: Session | null) => void;
  logout: () => void;
}
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      setUser: (user, session) => set({ user, session }),
      logout: () => {
        set({ user: null, session: null });
        localStorage.removeItem("sab-auth");
      },
    }),
    { name: "sab-auth" }
  )
);

// ─── Cart ─────────────────────────────────────────────────────────────────────
interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
}
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);
        if (existing) {
          set({ items: items.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) });
        } else {
          set({ items: [...items, { product, quantity: 1 }] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.product.id !== id) }),
      updateQty: (id, qty) => {
        if (qty <= 0) set({ items: get().items.filter((i) => i.product.id !== id) });
        else set({ items: get().items.map((i) => i.product.id === id ? { ...i, quantity: qty } : i) });
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
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
  persist(
    (set, get) => ({
      products: DEMO_PRODUCTS,
      categories: DEMO_CATEGORIES,
      orders: DEMO_ORDERS,
      staff: DEMO_STAFF,
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

        const { error } = await supabase.from("products").update(dbUpdates).eq("id", id);
        if (!error) {
          set({ products: get().products.map((p) => p.id === id ? { ...p, ...updates } : p) });
        }
      },
      updateStock: async (id, stock) => {
        const { error } = await supabase.from("products").update({ stock }).eq("id", id);
        if (!error) {
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
        const { error } = await supabase
          .from("orders")
          .update({ status: "accepted" })
          .eq("id", orderId);
        
        if (!error) {
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
        const { error } = await supabase
          .from("orders")
          .update({ status: "rejected", notes: reason })
          .eq("id", orderId);

        if (!error) {
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
        const { error } = await supabase
          .from("order_items")
          .update({ status: "rejected" })
          .eq("order_id", orderId)
          .eq("product_id", productId);
        if (!error) {
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
        const { error } = await supabase
          .from("orders")
          .update({ status })
          .eq("id", orderId);

        if (!error) {
          set({
            orders: get().orders.map((o) => o.id === orderId ? { ...o, status } : o),
          });
        }
      },
      assignDeliveryPartner: async (orderId, partnerId) => {
        const { error } = await supabase
          .from("orders")
          .update({ delivery_partner_id: partnerId })
          .eq("id", orderId);

        if (!error) {
          set({
            orders: get().orders.map((o) => o.id === orderId ? { ...o, deliveryPartnerId: partnerId } : o),
          });
        }
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
    }),
    { name: "sab-business" }
  )
);
