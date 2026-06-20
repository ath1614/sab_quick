"use client";
import { motion } from "framer-motion";
import { useAuthStore, useBusinessStore } from "@/store";
import { useRouter } from "next/navigation";
import { Tag, Users, BarChart2, Package, LogOut, ShoppingBag, LayoutDashboard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Admin shares owner-level access; modules route to the full management surface.
const ADMIN_MODULES = [
  { icon: LayoutDashboard, label: "Owner Dashboard", href: "/owner", color: "bg-blue-50 text-blue-600" },
  { icon: ShoppingBag, label: "Orders", href: "/owner", color: "bg-green-50 text-green-600" },
  { icon: Package, label: "Products & Stock", href: "/owner", color: "bg-orange-50 text-orange-600" },
  { icon: Tag, label: "Coupons", href: "/owner", color: "bg-purple-50 text-purple-600" },
  { icon: Users, label: "Staff", href: "/owner", color: "bg-pink-50 text-pink-600" },
  { icon: BarChart2, label: "Analytics", href: "/owner", color: "bg-gray-50 text-gray-600" },
];

export default function AdminPanel() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { orders, products } = useBusinessStore();

  const lowStock = products.filter((p) => p.stock < 15).length;
  const revenue = orders
    .filter((o) => o.status !== "rejected" && o.status !== "cancelled")
    .reduce((s, o) => s + (o.total ?? 0), 0);
  const recent = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-brand-surface pb-8 safe-top">
      <div className="bg-white px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-black">Admin Panel</h1>
          <p className="text-sm text-gray-400">{user?.name}</p>
        </div>
        <button aria-label="Log out" onClick={async () => { await logout(); router.replace("/auth"); }}
          className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center">
          <LogOut size={16} className="text-gray-600" />
        </button>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Real system snapshot */}
        <div className="bg-brand-black rounded-3xl p-4 text-white">
          <span className="text-sm font-semibold">System Snapshot</span>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { label: "Orders", value: orders.length },
              { label: "Products", value: products.length },
              { label: "Low Stock", value: lowStock },
              { label: "Revenue", value: formatCurrency(revenue) },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="font-black text-lg text-brand-green">{value}</p>
                <p className="text-[10px] text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Modules — route to the real management screens */}
        <div className="grid grid-cols-2 gap-3">
          {ADMIN_MODULES.map(({ icon: Icon, label, href, color }, i) => (
            <motion.button
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(href)}
              className="bg-white rounded-3xl p-4 shadow-card flex flex-col items-start gap-3"
            >
              <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center`}>
                <Icon size={18} />
              </div>
              <span className="text-sm font-bold text-brand-black text-left">{label}</span>
            </motion.button>
          ))}
        </div>

        {/* Recent orders (real) */}
        <div className="bg-white rounded-3xl p-4 shadow-card">
          <h3 className="font-bold text-brand-black mb-3">Recent Orders</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No orders yet.</p>
          ) : (
            recent.map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-7 h-7 rounded-xl bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag size={13} className="text-brand-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-black truncate">
                    {o.customerName || "Customer"} · {formatCurrency(o.total)}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">{o.status.replace(/_/g, " ")}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
