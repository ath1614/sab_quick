"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store";
import { formatCurrency } from "@/lib/utils";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function CartSheet({ open, onClose }: CartSheetProps) {
  const { items, updateQty, total } = useCartStore();
  const router = useRouter();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl max-h-[85vh] flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-xl font-black text-brand-black">Your Cart</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <ShoppingBag size={64} className="text-gray-200" />
                </motion.div>
                <p className="text-gray-400 font-medium">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-3 bg-brand-surface rounded-2xl p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.image} alt={product.name} className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-brand-black truncate">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.unit}</p>
                        <p className="font-bold text-brand-green text-sm">{formatCurrency(product.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded-xl px-2 py-1 shadow-sm">
                        <button onClick={() => updateQty(product.id, quantity - 1)}>
                          <Minus size={12} className="text-brand-green" />
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{quantity}</span>
                        <button onClick={() => updateQty(product.id, quantity + 1)}>
                          <Plus size={12} className="text-brand-green" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-brand-black">{formatCurrency(total())}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Delivery</span>
                    <span className="font-semibold text-brand-green">FREE</span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { onClose(); router.push("/checkout"); }}
                    className="w-full py-4 rounded-2xl bg-brand-green text-white font-bold text-base shadow-green"
                  >
                    Proceed to Checkout · {formatCurrency(total())}
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
