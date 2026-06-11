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
  addProduct: (p: Omit<Product, "id" | "rating" | "reviews">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  updateStock: (id: string, stock: number) => void;

  // Categories
  addCategory: (c: Omit<Category, "id" | "productCount">) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Orders
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string, reason: string) => Promise<void>;
  rejectOrderItem: (orderId: string, productId: string, reason: string) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;
  assignDeliveryPartner: (orderId: string, partnerId: string) => Promise<void>;

  // Staff
  addStaffMember: (s: Omit<StaffMember, "id" | "joinedAt">) => void;
  updateStaffPermissions: (staffId: string, permissions: Permission[]) => void;
  toggleStaffActive: (staffId: string) => void;

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

      addProduct: (p) => set({
        products: [...get().products, { ...p, id: `p${Date.now()}`, rating: 0, reviews: 0 }],
      }),
      updateProduct: (id, updates) => set({
        products: get().products.map((p) => p.id === id ? { ...p, ...updates } : p),
      }),
      updateStock: (id, stock) => set({
        products: get().products.map((p) => p.id === id ? { ...p, stock } : p),
      }),

      addCategory: (c) => set({
        categories: [...get().categories, { ...c, id: `cat${Date.now()}`, productCount: 0 }],
      }),
      updateCategory: (id, updates) => set({
        categories: get().categories.map((c) => c.id === id ? { ...c, ...updates } : c),
      }),
      deleteCategory: (id) => set({
        categories: get().categories.filter((c) => c.id !== id),
      }),

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
      rejectOrderItem: (orderId, productId, reason) => {
        // This would require a more complex DB update for order_items
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

      addStaffMember: (s) => set({
        staff: [...get().staff, { ...s, id: `s${Date.now()}`, joinedAt: new Date().toISOString().split("T")[0] }],
      }),
      updateStaffPermissions: (staffId, permissions) => set({
        staff: get().staff.map((s) => s.id === staffId ? { ...s, permissions } : s),
      }),
      toggleStaffActive: (staffId) => set({
        staff: get().staff.map((s) => s.id === staffId ? { ...s, isActive: !s.isActive } : s),
      }),

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
