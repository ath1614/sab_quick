"use client";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Search, ShoppingCart, Package, User } from "lucide-react";
import { useCartStore } from "@/store";

const tabs = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/explore", icon: Search, label: "Explore" },
  { href: "/cart", icon: ShoppingCart, label: "Cart" },
  { href: "/orders", icon: Package, label: "Orders" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const cartCount = useCartStore((s) => s.count());

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 safe-bottom px-2">
      <div
        className="flex items-center gap-1 px-3 py-2.5 rounded-[28px] bg-brand-black border border-white/8"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(44,160,28,0.12)" }}
      >
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <motion.button
              key={href}
              whileTap={{ scale: 0.88 }}
              onClick={() => router.push(href)}
              className="relative flex flex-col items-center px-3.5 py-1.5 rounded-2xl transition-all"
            >
              {/* Active background pill */}
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl bg-brand-green/15 border border-brand-green/25"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon
                  size={20}
                  className={active ? "text-brand-green" : "text-white/35"}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {href === "/cart" && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-green text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>

              {active && (
                <motion.span
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[9px] font-bold text-brand-green mt-0.5 leading-none"
                >
                  {label}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
