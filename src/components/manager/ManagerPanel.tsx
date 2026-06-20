"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore, useBusinessStore } from "@/store";
import { useRouter } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package, LogOut, BarChart2, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import OrderCard from "@/components/shared/OrderCard";
import ProductForm from "@/components/shared/ProductForm";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { resolvePermissions } from "@/lib/permissions";
import type { Permission } from "@/types";

type Tab = "dashboard" | "orders" | "stock" | "products";

export default function ManagerPanel() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { orders, products, categories, staff, addProduct, updateStock } = useBusinessStore();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [showProductForm, setShowProductForm] = useState(false);
  const [stockEditing, setStockEditing] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState(0);

  // Get this manager's permissions (explicit > auth user > role defaults)
  const staffRecord = staff.find((s) => s.email === user?.email);
  const permissions: Permission[] = resolvePermissions(
    user?.role ?? "manager",
    staffRecord?.permissions,
    user?.permissions
  );

  const newOrders = orders.filter((o) => o.status === "new").length;
  const todayRevenue = orders.filter((o) => o.status !== "rejected").reduce((s, o) => s + o.total, 0);
  const lowStock = products.filter((p) => p.stock < 15);

  // Stable heatmap — useMemo so it doesn't regenerate on every render
  const HEATMAP = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    orders: Math.floor(Math.sin(i / 3) * 8 + (i >= 8 && i <= 22 ? 12 : 2)),
  }));

  const TABS: { key: Tab; label: string; icon: React.ElementType; perm?: Permission }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "view_analytics" as Permission },
    { key: "orders", label: "Orders", icon: ShoppingBag, perm: "view_orders" as Permission },
    { key: "stock", label: "Stock", icon: Package, perm: "manage_stock" as Permission },
    { key: "products", label: "Products", icon: Package, perm: "manage_products" as Permission },
  ].filter(({ perm }) => !perm || permissions.includes(perm)) as { key: Tab; label: string; icon: React.ElementType; perm?: Permission }[];

  return (
    <div className="min-h-screen bg-brand-surface safe-top">
      <div className="bg-white px-5 pt-12 pb-3 flex items-center justify-between border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Manager</p>
          <h1 className="text-xl font-black text-brand-black">{user?.name}</h1>
        </div>
        <button aria-label="Log out" onClick={async () => { await logout(); router.replace("/auth"); }}
          className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center">
          <LogOut size={16} className="text-gray-500" />
        </button>
      </div>

      <div className="bg-white border-b border-gray-100 flex overflow-x-auto scrollbar-hide px-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              tab === key ? "border-brand-green text-brand-green" : "border-transparent text-gray-400"
            }`}>
            <Icon size={14} /> {label}
            {key === "orders" && newOrders > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand-green text-white text-[9px] font-black flex items-center justify-center">{newOrders}</span>
            )}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 pb-10 space-y-4">

        {tab === "dashboard" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Revenue Today", value: formatCurrency(todayRevenue), icon: DollarSign },
                { label: "Total Orders", value: orders.length, icon: ShoppingBag },
                { label: "New Orders", value: newOrders, icon: TrendingUp },
                { label: "Low Stock", value: lowStock.length, icon: AlertTriangle },
              ].map(({ label, value, icon: Icon }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-white rounded-3xl p-4 shadow-card">
                  <Icon size={18} className="text-brand-green mb-2" />
                  <p className="font-black text-xl text-brand-black">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </motion.div>
              ))}
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={14} className="text-brand-green" />
                <h3 className="font-bold text-brand-black text-sm">Hourly Orders</h3>
              </div>
              <div className="flex items-end gap-0.5 h-16">
                {HEATMAP.map(({ hour, orders: cnt }) => (
                  <motion.div key={hour} className="flex-1 bg-brand-green rounded-sm opacity-80"
                    initial={{ height: 0 }} animate={{ height: `${(cnt / 23) * 100}%` }}
                    transition={{ delay: hour * 0.015, duration: 0.3 }} />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-card">
              <h3 className="font-bold text-brand-black text-sm mb-3">Delivery Metrics</h3>
              {[
                { label: "Avg Delivery Time", value: "9.2 mins", ok: true },
                { label: "On-time Rate", value: "94%", ok: true },
                { label: "Cancellation Rate", value: "3.2%", ok: true },
              ].map(({ label, value, ok }) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className={`font-bold text-sm ${ok ? "text-brand-green" : "text-red-500"}`}>{value}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0
              ? <div className="text-center py-16 text-gray-400 font-medium">No orders</div>
              : orders.map((order) => (
                  <OrderCard key={order.id} order={order} permissions={permissions} />
                ))}
          </div>
        )}

        {tab === "stock" && (
          <>
            {lowStock.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500" />
                <p className="text-sm font-bold text-red-600">{lowStock.length} items need restocking</p>
              </div>
            )}
            <div className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl p-3 shadow-card flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt={product.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-brand-black text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.unit}</p>
                  </div>
                  {stockEditing === product.id ? (
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={stockValue} onChange={(e) => setStockValue(+e.target.value)}
                        className="w-16 text-sm px-2 py-1.5 rounded-xl bg-brand-surface border border-gray-200 focus:outline-none text-center font-bold" />
                      <button onClick={() => { updateStock(product.id, stockValue); setStockEditing(null); }}
                        className="text-xs text-white bg-brand-green font-bold px-3 py-1.5 rounded-xl">Save</button>
                    </div>
                  ) : (
                    <button onClick={() => { setStockEditing(product.id); setStockValue(product.stock); }}
                      className={`text-sm font-black px-3 py-1.5 rounded-xl ${product.stock < 15 ? "bg-red-50 text-red-500" : "bg-brand-green/10 text-brand-green"}`}>
                      {product.stock}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "products" && permissions.includes("manage_products") && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-500">{products.length} products</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowProductForm(true)}
                className="flex items-center gap-1.5 bg-brand-green text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-green">
                <Plus size={14} /> Add Product
              </motion.button>
            </div>
            <AnimatePresence>
              {showProductForm && (
                <ProductForm categories={categories} onSave={(data) => { addProduct(data); setShowProductForm(false); }}
                  onCancel={() => setShowProductForm(false)} />
              )}
            </AnimatePresence>
            <div className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl p-3 shadow-card flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt={product.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div className="flex-1">
                    <p className="font-bold text-brand-black text-sm">{product.name}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(product.price)} · Stock: {product.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
