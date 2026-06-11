"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store";
import { useRouter } from "next/navigation";
import { Package, MapPin, DollarSign, Phone, CheckCircle, LogOut, Navigation } from "lucide-react";

const MOCK_ORDERS = [
  { id: "ORD001", customer: "Atharv S.", address: "Andheri West, Mumbai", items: 3, amount: 245, distance: "1.2 km" },
  { id: "ORD002", customer: "Priya M.", address: "Bandra East, Mumbai", items: 5, amount: 480, distance: "2.1 km" },
];

export default function DeliveryDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [activeOrder, setActiveOrder] = useState<string | null>(null);
  const [earnings] = useState({ today: 850, orders: 12, rating: 4.8 });

  return (
    <div className="min-h-screen bg-brand-black text-white safe-top">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between safe-top">
        <div>
          <p className="text-gray-400 text-sm">Good morning</p>
          <h1 className="text-2xl font-black">{user?.name}</h1>
        </div>
        <button onClick={() => { logout(); router.push("/auth"); }}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <LogOut size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 mb-4">
        {[
          { label: "Today's Earnings", value: `₹${earnings.today}`, icon: DollarSign },
          { label: "Orders Done", value: earnings.orders, icon: Package },
          { label: "Rating", value: earnings.rating, icon: CheckCircle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white/10 rounded-2xl p-3 text-center">
            <Icon size={18} className="text-brand-green mx-auto mb-1" />
            <p className="font-black text-lg">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Active Orders */}
      <div className="px-4">
        <h2 className="font-bold text-white mb-3">Pending Orders</h2>
        <div className="space-y-3">
          {MOCK_ORDERS.map((order) => (
            <motion.div
              key={order.id}
              whileTap={{ scale: 0.98 }}
              className={`rounded-3xl p-4 border-2 transition-all ${activeOrder === order.id ? "border-brand-green bg-brand-green/10" : "border-white/10 bg-white/5"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-sm">{order.customer}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {order.address}
                  </p>
                </div>
                <span className="text-brand-green font-black">₹{order.amount}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <Package size={12} /> {order.items} items
                <Navigation size={12} className="ml-2" /> {order.distance}
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveOrder(order.id)}
                  className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold"
                >
                  Accept
                </motion.button>
                <button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Phone size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
