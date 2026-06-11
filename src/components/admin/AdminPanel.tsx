"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store";
import { useRouter } from "next/navigation";
import { Bell, Tag, Users, BarChart2, Settings, LogOut, Activity, Globe } from "lucide-react";

const ADMIN_MODULES = [
  { icon: Bell, label: "Push Notifications", color: "bg-blue-50 text-blue-600" },
  { icon: Tag, label: "Coupon Engine", color: "bg-purple-50 text-purple-600" },
  { icon: Users, label: "User Management", color: "bg-green-50 text-green-600" },
  { icon: BarChart2, label: "Analytics", color: "bg-orange-50 text-orange-600" },
  { icon: Globe, label: "Banner CMS", color: "bg-pink-50 text-pink-600" },
  { icon: Activity, label: "Realtime Monitor", color: "bg-red-50 text-red-600" },
  { icon: Settings, label: "A/B Testing", color: "bg-gray-50 text-gray-600" },
];

export default function AdminPanel() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [activeUsers] = useState(() => Math.floor(Math.random() * 50 + 20));

  return (
    <div className="min-h-screen bg-brand-surface pb-8 safe-top">
      <div className="bg-white px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-black">Admin Panel</h1>
          <p className="text-sm text-gray-400">{user?.name}</p>
        </div>
        <button onClick={() => { logout(); router.push("/auth"); }}
          className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center">
          <LogOut size={16} className="text-gray-600" />
        </button>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Live monitor */}
        <div className="bg-brand-black rounded-3xl p-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse" />
            <span className="text-sm font-semibold">Live System Status</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Active Users", value: activeUsers },
              { label: "Orders/min", value: 3 },
              { label: "Uptime", value: "99.9%" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="font-black text-xl text-brand-green">{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Modules grid */}
        <div className="grid grid-cols-2 gap-3">
          {ADMIN_MODULES.map(({ icon: Icon, label, color }, i) => (
            <motion.button
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-4 shadow-card flex flex-col items-start gap-3"
            >
              <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center`}>
                <Icon size={18} />
              </div>
              <span className="text-sm font-bold text-brand-black text-left">{label}</span>
            </motion.button>
          ))}
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-3xl p-4 shadow-card">
          <h3 className="font-bold text-brand-black mb-3">Recent Activity</h3>
          {[
            { msg: "New user registered", time: "2m ago", type: "user" },
            { msg: "Order #ORD142 placed", time: "5m ago", type: "order" },
            { msg: "Coupon SAVE10 used 3x", time: "12m ago", type: "coupon" },
            { msg: "Low stock alert: Tomatoes", time: "18m ago", type: "alert" },
          ].map(({ msg, time, type }) => (
            <div key={msg} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                type === 'user' ? 'bg-blue-50' : type === 'order' ? 'bg-green-50' : type === 'coupon' ? 'bg-purple-50' : 'bg-red-50'
              }`}>
                <Users size={13} className={type === 'user' ? 'text-blue-500' : type === 'order' ? 'text-green-500' : type === 'coupon' ? 'text-purple-500' : 'text-red-500'} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-brand-black">{msg}</p>
                <p className="text-xs text-gray-400">{time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
