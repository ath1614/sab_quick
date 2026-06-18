"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore, useBusinessStore } from "@/store";
import { useRouter } from "next/navigation";
import { useBroadcastLocation } from "@/hooks/useDeliveryLocation";
import { formatCurrency } from "@/lib/utils";
import { Package, MapPin, DollarSign, Phone, CheckCircle, LogOut, Navigation } from "lucide-react";
import type { Order } from "@/types";

const ACTIVE_STATUSES: Order["status"][] = ["accepted", "preparing", "packed", "out_for_delivery"];

export default function DeliveryDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const orders = useBusinessStore((s) => s.orders);
  const updateOrderStatus = useBusinessStore((s) => s.updateOrderStatus);
  const [online, setOnline] = useState(false);

  const myOrders = useMemo(
    () => orders.filter((o) => o.deliveryPartnerId === user?.id),
    [orders, user?.id]
  );
  const active = myOrders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const delivered = myOrders.filter((o) => o.status === "delivered");
  const earningsToday = delivered.reduce((s, o) => s + (o.total ?? 0), 0);

  // Broadcast GPS for in-flight orders while online.
  useBroadcastLocation(
    online,
    active.filter((o) => o.status === "out_for_delivery").map((o) => o.id),
    user?.id
  );

  return (
    <div className="min-h-screen bg-brand-black text-white safe-top pb-10">
      <div className="px-5 pt-12 pb-4 flex items-center justify-between safe-top">
        <div>
          <p className="text-gray-400 text-sm">Welcome back</p>
          <h1 className="text-2xl font-black">{user?.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnline((v) => !v)}
            className={`px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              online ? "bg-brand-green text-white" : "bg-white/10 text-gray-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${online ? "bg-white animate-pulse" : "bg-gray-500"}`} />
            {online ? "Online" : "Offline"}
          </button>
          <button aria-label="Log out" onClick={async () => { await logout(); router.replace("/auth"); }}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 mb-4">
        {[
          { label: "Today's Earnings", value: formatCurrency(earningsToday), icon: DollarSign },
          { label: "Delivered", value: delivered.length, icon: CheckCircle },
          { label: "Active", value: active.length, icon: Package },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white/10 rounded-2xl p-3 text-center">
            <Icon size={18} className="text-brand-green mx-auto mb-1" />
            <p className="font-black text-lg">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="px-4">
        <h2 className="font-bold text-white mb-3">Assigned Orders</h2>
        {active.length === 0 ? (
          <div className="bg-white/5 rounded-3xl p-8 text-center text-gray-400 text-sm">
            No active deliveries right now.
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((order) => (
              <motion.div
                key={order.id}
                whileTap={{ scale: 0.98 }}
                className="rounded-3xl p-4 border-2 border-white/10 bg-white/5"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">{order.customerName || "Customer"}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {order.address?.line1}, {order.address?.city}
                    </p>
                  </div>
                  <span className="text-brand-green font-black">{formatCurrency(order.total)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <Package size={12} /> {order.items?.length ?? 0} items
                  <Navigation size={12} className="ml-2" /> {order.status.replace(/_/g, " ")}
                </div>
                <div className="flex gap-2">
                  {order.status !== "out_for_delivery" ? (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateOrderStatus(order.id, "out_for_delivery")}
                      className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold"
                    >
                      Start Delivery
                    </motion.button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateOrderStatus(order.id, "delivered")}
                      className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold"
                    >
                      Mark Delivered
                    </motion.button>
                  )}
                  {order.customerPhone && (
                    <a href={`tel:${order.customerPhone}`}
                      className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Phone size={16} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
