"use client";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store";
import { useRouter } from "next/navigation";
import { Package, MapPin, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, User } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import AppHeader from "@/components/layout/AppHeader";
import AuthGuard from "@/components/layout/AuthGuard";

const MENU_ITEMS = [
  { icon: Package, label: "My Orders", href: "/orders" },
  { icon: MapPin, label: "Saved Addresses", href: "/profile" },
  { icon: CreditCard, label: "Payment Methods", href: "/profile" },
  { icon: Bell, label: "Notifications", href: "/profile" },
  { icon: HelpCircle, label: "Help & Support", href: "/profile" },
];

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-brand-surface pb-28">
        <AppHeader title="Profile" />

        {/* Avatar card */}
        <div className="mx-4 mt-4 bg-white rounded-3xl p-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-green/10 border-2 border-brand-green/20 flex items-center justify-center">
              <User size={28} className="text-brand-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-brand-black text-lg truncate">{user?.name}</p>
              <p className="text-sm text-gray-400 truncate">{user?.email}</p>
              <span className="inline-block mt-1.5 bg-brand-green/10 text-brand-green text-xs font-bold px-2.5 py-0.5 rounded-lg capitalize">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 mt-3 space-y-2">
          {MENU_ITEMS.map(({ icon: Icon, label, href }, i) => (
            <motion.button key={label} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.98 }}
              onClick={() => router.push(href)}
              className="w-full bg-white rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-brand-surface flex items-center justify-center">
                <Icon size={17} className="text-brand-green" />
              </div>
              <span className="flex-1 text-left font-semibold text-brand-black text-sm">{label}</span>
              <ChevronRight size={15} className="text-gray-300" />
            </motion.button>
          ))}

          <motion.button whileTap={{ scale: 0.97 }}
            aria-label="Log out" onClick={async () => { await logout(); router.replace("/auth"); }}
            className="w-full bg-red-50 border border-red-100 rounded-2xl px-4 py-4 flex items-center gap-3 mt-2">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <LogOut size={17} className="text-red-500" />
            </div>
            <span className="font-semibold text-red-500 text-sm">Sign Out</span>
          </motion.button>
        </div>

        <BottomNav />
      </div>
    </AuthGuard>
  );
}
