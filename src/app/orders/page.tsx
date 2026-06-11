"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Package, ChevronRight } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import AppHeader from "@/components/layout/AppHeader";
import AuthGuard from "@/components/layout/AuthGuard";
import { useBusinessStore, useAuthStore } from "@/store";
import { useOrders } from "@/hooks/useSupabase";
import { formatCurrency } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-50 text-blue-600",
  accepted: "bg-brand-green/10 text-brand-green",
  preparing: "bg-yellow-50 text-yellow-600",
  packed: "bg-purple-50 text-purple-600",
  out_for_delivery: "bg-orange-50 text-orange-600",
  delivered: "bg-gray-100 text-gray-500",
  rejected: "bg-red-50 text-red-500",
};

const STATUS_LABEL: Record<string, string> = {
  new: "New", accepted: "Accepted", preparing: "Preparing",
  packed: "Packed", out_for_delivery: "Out for Delivery",
  delivered: "Delivered", rejected: "Rejected",
};

export default function OrdersPage() {
  const router = useRouter();
  const { orders: localOrders } = useBusinessStore();
  const user = useAuthStore((s) => s.user);
  const { data: remoteOrders, isLoading } = useOrders(user?.id);

  const myOrders = remoteOrders ?? localOrders;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-brand-surface pb-28">
        <AppHeader title="My Orders" subtitle={isLoading ? "Loading..." : `${myOrders.length} orders`} />

        {myOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4 px-8">
            <motion.div animate={{ x: [-8, 8, -8] }} transition={{ duration: 2, repeat: Infinity }}>
              <Package size={64} className="text-gray-200" />
            </motion.div>
            <p className="font-bold text-gray-500 text-base">No orders yet</p>
            <p className="text-gray-400 text-sm text-center">Your orders will appear here once you place one</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push("/home")}
              className="bg-brand-green text-white font-bold px-8 py-3.5 rounded-2xl shadow-green">
              Start Shopping
            </motion.button>
          </div>
        ) : (
          <div className="px-4 mt-4 space-y-3">
            {myOrders.map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }} whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/orders/track")}
                className="bg-white rounded-3xl p-4 shadow-card flex items-center gap-3 cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-brand-surface flex items-center justify-center flex-shrink-0">
                  <Package size={20} className="text-brand-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-brand-black text-sm">#{order.id}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${STATUS_STYLES[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {order.items.length} items · {order.address.city}
                  </p>
                  <p className="font-bold text-brand-green text-sm mt-1">{formatCurrency(order.total)}</p>
                </div>
                <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        )}

        <BottomNav />
      </div>
    </AuthGuard>
  );
}
