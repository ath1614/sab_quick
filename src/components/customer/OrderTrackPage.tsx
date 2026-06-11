"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Package, Truck, MapPin, Phone } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import AuthGuard from "@/components/layout/AuthGuard";

const STATUSES = [
  { key: "preparing", label: "Preparing Order", icon: Package, desc: "Store is packing your items" },
  { key: "packed", label: "Order Packed", icon: CheckCircle, desc: "Ready for pickup" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck, desc: "Rider is on the way" },
  { key: "delivered", label: "Delivered", icon: CheckCircle, desc: "Enjoy your order!" },
];

export default function OrderTrackPage() {
  const [currentStep, setCurrentStep] = useState(0);
  // Stable order ID — generated once, not on every render
  const orderId = useRef(`SAB${Math.floor(Math.random() * 9000 + 1000)}`);

  useEffect(() => {
    const timings = [2000, 5000, 8000, 12000];
    const timers = timings.map((t, i) => setTimeout(() => setCurrentStep(i + 1), t));
    return () => timers.forEach(clearTimeout);
  }, []);

  const eta = Math.max(0, 10 - currentStep * 2.5);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-brand-surface pb-8">
        <AppHeader title="Live Tracking" subtitle={`Order #${orderId.current}`} back backHref="/orders" />

        {/* Map area */}
        <div className="mx-4 mt-4 rounded-3xl overflow-hidden h-52 relative"
          style={{ background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)" }}>
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            {[1,2,3].map(i => <line key={`h${i}`} x1="0" y1={`${i*25}%`} x2="100%" y2={`${i*25}%`} stroke="#2CA01C" strokeWidth="1" />)}
            {[1,2,3,4,5].map(i => <line key={`v${i}`} x1={`${i*16.6}%`} y1="0" x2={`${i*16.6}%`} y2="100%" stroke="#2CA01C" strokeWidth="1" />)}
          </svg>

          {/* Animated rider */}
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

          {/* Destination pin */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <div className="w-8 h-8 rounded-full bg-brand-black flex items-center justify-center">
              <MapPin size={14} className="text-brand-green" />
            </div>
          </div>

          {/* ETA badge */}
          <div className="absolute bottom-3 left-3 bg-white rounded-2xl px-3 py-2 shadow-card flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
            <span className="text-xs font-bold text-brand-black">ETA: {eta.toFixed(0)} mins</span>
          </div>
        </div>

        {/* Status timeline */}
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
            <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center">
              <span className="text-brand-green font-black text-sm">RK</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="font-bold text-brand-black text-sm">Rahul Kumar</p>
            <p className="text-xs text-gray-400">Your delivery partner · 4.9 rating</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center shadow-green">
            <Phone size={16} className="text-white" />
          </motion.button>
        </div>
      </div>
    </AuthGuard>
  );
}
