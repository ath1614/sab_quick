"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus, ShoppingBag, Tag, ArrowRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import AppHeader from "@/components/layout/AppHeader";
import AuthGuard from "@/components/layout/AuthGuard";
import { useState } from "react";
import { deliveryFeeFor } from "@/lib/pricing";

export default function CartPage() {
  const { items, updateQty, removeItem, total, clearCart, coupon, setCoupon } = useCartStore();
  const [couponInput, setCouponInput] = useState(coupon);
  const router = useRouter();

  const subtotal = total();
  const deliveryFee = deliveryFeeFor(subtotal);
  const estTotal = subtotal + deliveryFee;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-brand-surface pb-36">
        <AppHeader
          title="Cart"
          subtitle={items.length > 0 ? `${items.length} item${items.length > 1 ? "s" : ""}` : "Empty"}
          right={items.length > 0 ? (
            <button onClick={() => clearCart()} className="text-xs text-red-400 font-semibold px-3 py-1.5 rounded-xl bg-red-50">
              Clear
            </button>
          ) : undefined}
        />

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-6 px-8">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
              <ShoppingBag size={72} className="text-gray-200" />
            </motion.div>
            <div className="text-center">
              <p className="font-bold text-gray-600 text-lg">Your cart is empty</p>
              <p className="text-gray-400 text-sm mt-1">Add items to get started</p>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push("/explore")}
              className="bg-brand-green text-white font-bold px-8 py-3.5 rounded-2xl shadow-green">
              Browse Products
            </motion.button>
          </div>
        ) : (
          <div className="px-4 mt-4 space-y-3">
            <AnimatePresence>
              {items.map(({ product, quantity }) => (
                <motion.div key={product.id} layout exit={{ opacity: 0, x: -80, height: 0 }}
                  className="bg-white rounded-3xl p-4 shadow-card flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt={product.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-brand-black text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.unit}</p>
                    <p className="font-bold text-brand-green mt-1 text-sm">{formatCurrency(product.price * quantity)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => removeItem(product.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                    <div className="flex items-center gap-2 bg-brand-surface rounded-xl px-2 py-1.5">
                      <button onClick={() => updateQty(product.id, quantity - 1)}>
                        <Minus size={13} className="text-brand-green" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center">{quantity}</span>
                      <button onClick={() => updateQty(product.id, quantity + 1)}>
                        <Plus size={13} className="text-brand-green" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Coupon — code is carried to checkout and validated server-side */}
            <div className="bg-white rounded-3xl p-4 shadow-card">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none uppercase" />
                </div>
                <button onClick={() => setCoupon(couponInput.trim())}
                  className="px-4 py-3 rounded-xl bg-brand-green text-white text-sm font-bold">
                  Apply
                </button>
              </div>
              {coupon
                ? <p className="text-brand-green text-xs font-semibold mt-2">Coupon “{coupon}” will be applied at checkout</p>
                : <p className="text-gray-400 text-xs mt-1.5">Have a code? Apply it here.</p>}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-3xl p-4 shadow-card space-y-2.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span className="font-semibold text-brand-black">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery</span>
                <span className="font-semibold text-brand-green">{deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2.5 flex justify-between">
                <span className="font-bold text-brand-black">Total{coupon ? " (before coupon)" : ""}</span>
                <span className="font-black text-brand-black text-lg">{formatCurrency(estTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="fixed bottom-20 left-0 right-0 px-4 safe-bottom">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push("/checkout")}
              className="w-full py-4 rounded-2xl bg-brand-green text-white font-bold text-base shadow-green flex items-center justify-center gap-2">
              Proceed to Checkout <ArrowRight size={18} />
            </motion.button>
          </div>
        )}

        <BottomNav />
      </div>
    </AuthGuard>
  );
}
