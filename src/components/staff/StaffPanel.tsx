"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, useBusinessStore } from "@/store";
import { useRouter } from "next/navigation";
import { ShoppingBag, Package, LogOut, AlertTriangle, Plus } from "lucide-react";
import OrderCard from "@/components/shared/OrderCard";
import ProductForm from "@/components/shared/ProductForm";
import { formatCurrency } from "@/lib/utils";
import type { Permission } from "@/types";

type Tab = "orders" | "stock" | "products";

export default function StaffPanel() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { orders, products, categories, staff, addProduct, updateStock } = useBusinessStore();
  const [tab, setTab] = useState<Tab>("orders");
  const [showProductForm, setShowProductForm] = useState(false);
  const [stockEditing, setStockEditing] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState(0);

  const staffRecord = staff.find((s) => s.email === user?.email);
  const permissions: Permission[] = staffRecord?.permissions ?? ["view_orders", "reject_items", "manage_stock"];

  const lowStock = products.filter((p) => p.stock < 15);

  const TABS = ([
    { key: "orders" as Tab, label: "Orders", icon: ShoppingBag, perm: "view_orders" as Permission },
    { key: "stock" as Tab, label: "Inventory", icon: Package, perm: "manage_stock" as Permission },
    { key: "products" as Tab, label: "Products", icon: Package, perm: "manage_products" as Permission },
  ] as { key: Tab; label: string; icon: React.ElementType; perm: Permission }[]).filter(({ perm }) => permissions.includes(perm));

  return (
    <div className="min-h-screen bg-brand-surface safe-top">
      <div className="bg-white px-5 pt-12 pb-3 flex items-center justify-between border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Staff</p>
          <h1 className="text-xl font-black text-brand-black">{user?.name}</h1>
        </div>
        <button onClick={() => { logout(); router.push("/auth"); }}
          className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center">
          <LogOut size={16} className="text-gray-500" />
        </button>
      </div>

      <div className="bg-white border-b border-gray-100 flex px-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              tab === key ? "border-brand-green text-brand-green" : "border-transparent text-gray-400"
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 pb-10 space-y-3">

        {tab === "orders" && (
          <>
            {orders.filter((o) => ["new","accepted","preparing"].includes(o.status)).length === 0
              ? <div className="text-center py-16 text-gray-400 font-medium">No active orders</div>
              : orders
                  .filter((o) => ["new","accepted","preparing"].includes(o.status))
                  .map((order) => (
                    <OrderCard key={order.id} order={order} permissions={permissions} />
                  ))}
          </>
        )}

        {tab === "stock" && (
          <>
            {lowStock.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500" />
                <p className="text-sm font-bold text-red-600">{lowStock.length} items critically low</p>
              </div>
            )}
            <div className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl p-3 shadow-card flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt={product.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-brand-black text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.unit} · {formatCurrency(product.price)}</p>
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
