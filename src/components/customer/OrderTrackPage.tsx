"use client";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Package, Truck, MapPin, Phone } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import AuthGuard from "@/components/layout/AuthGuard";
import { useBusinessStore } from "@/store";
import type { Order } from "@/types";

const STATUSES = [
  { key: "preparing", label: "Preparing Order", icon: Package, desc: "Store is packing your items" },
  { key: "packed", label: "Order Packed", icon: CheckCircle, desc: "Ready for pickup" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck, desc: "Rider is on the way" },
  { key: "delivered", label: "Delivered", icon: CheckCircle, desc: "Enjoy your order!" },
];

// Map the DB order status to a timeline step. Anything before "packed" is the
// first (preparing) stage; "delivered" marks every step complete.
const STEP_BY_STATUS: Record<Order["status"], number> = {
  new: 0,
  accepted: 0,
  preparing: 0,
  packed: 1,
  out_for_delivery: 2,
  delivered: 4,
  rejected: 0,
};

export default function OrderTrackPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const orders = useBusinessStore((s) => s.orders);

  const order = useMemo(() => orders.find((o) => o.id === id), [orders, id]);

  const currentStep = order ? STEP_BY_STATUS[order.status] ?? 0 : 0;
  const isRejected = order?.status === "rejected";
  const eta = order?.eta ?? Math.max(0, 10 - currentStep * 2.5);
  const shortId = id ? `#${id.slice(0, 8).toUpperCase()}` : "—";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-brand-surface pb-8">
        <AppHeader title="Live Tracking" subtitle={`Order ${shortId}`} back backHref="/orders" />

        {isRejected ? (
          <div className="mx-4 mt-4 bg-white rounded-3xl p-6 shadow-card text-center">
            <p className="font-bold text-red-500">This order was rejected.</p>
            {order?.rejectionReason && (
              <p className="text-sm text-gray-500 mt-1">{order.rejectionReason}</p>
            )}
          </div>
        ) : (
          <>
            {/* Map placeholder (live map integration is a separate milestone) */}
            <div className="mx-4 mt-4 rounded-3xl overflow-hidden h-52 relative"
              style={{ background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)" }}>
              <svg className="absolute inset-0 w-full h-full opacity-20">
                {[1, 2, 3].map((i) => <line key={`h${i}`} x1="0" y1={`${i * 25}%`} x2="100%" y2={`${i * 25}%`} stroke="#2CA01C" strokeWidth="1" />)}
                {[1, 2, 3, 4, 5].map((i) => <line key={`v${i}`} x1={`${i * 16.6}%`} y1="0" x2={`${i * 16.6}%`} y2="100%" stroke="#2CA01C" strokeWidth="1" />)}
              </svg>
              <motion.div
                className="absolute text-3xl"
                style={{ top: "40%", left: "20%" }}
                animate={{ x: [0, 30, 60, 90], y: [0, -8, 4, -4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center shadow-green">
                  <Truck size={18} className="text-white" />
                </div>
              </motion.div>
              <div className="absolute right-8 top-1/2 -translate-y-1/2">
                <div className="w-8 h-8 rounded-full bg-brand-black flex items-center justify-center">
                  <MapPin size={14} className="text-brand-green" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 bg-white rounded-2xl px-3 py-2 shadow-card flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                <span className="text-xs font-bold text-brand-black">ETA: {eta.toFixed(0)} mins</span>
              </div>
            </div>

            {/* Status timeline — driven by the real order status */}
            <div className="mx-4 mt-4 bg-white rounded-3xl p-5 shadow-card">
              <h3 className="font-bold text-brand-black mb-4">Order Status</h3>
              <div className="space-y-1">
                {STATUSES.map((status, i) => {
                  const Icon = status.icon;
                  const done = i < currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={status.key} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <motion.div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            done ? "bg-brand-green" : active ? "bg-brand-black" : "bg-gray-100"
                          }`}
                          animate={active ? { scale: [1, 1.08, 1] } : {}}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        >
                          <Icon size={17} className={done || active ? "text-white" : "text-gray-400"} />
                        </motion.div>
                        {i < STATUSES.length - 1 && (
                          <div className={`w-0.5 h-6 mt-1 transition-all ${done ? "bg-brand-green" : "bg-gray-100"}`} />
                        )}
                      </div>
                      <div className="pt-2 pb-4">
                        <p className={`font-bold text-sm ${done || active ? "text-brand-black" : "text-gray-400"}`}>{status.label}</p>
                        <p className={`text-xs mt-0.5 ${done || active ? "text-gray-500" : "text-gray-300"}`}>{status.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery partner */}
            <div className="mx-4 mt-3 bg-white rounded-3xl p-4 shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center">
                <Truck size={20} className="text-brand-green" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-brand-black text-sm">
                  {order?.deliveryPartnerId ? "Delivery partner assigned" : "Awaiting rider assignment"}
                </p>
                <p className="text-xs text-gray-400">
                  {order?.deliveryPartnerId ? "On the way to the store" : "We'll assign a rider shortly"}
                </p>
              </div>
              {order?.deliveryPartnerId && (
                <motion.button whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center shadow-green">
                  <Phone size={16} className="text-white" />
                </motion.button>
              )}
            </div>
          </>
        )}
      </div>
    </AuthGuard>
  );
}
