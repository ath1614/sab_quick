"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Clock } from "lucide-react";
import { useBusinessStore, useCartStore } from "@/store";
import { recommendProducts } from "@/lib/recommendations";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

export default function ProductDetailSheet({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const allProducts = useBusinessStore((s) => s.products);
  const { items, addItem, updateQty } = useCartStore();
  const [current, setCurrent] = useState<Product>(product);

  const recs = useMemo(() => recommendProducts(current, allProducts, 8), [current, allProducts]);
  const qty = items.find((i) => i.product.id === current.id)?.quantity ?? 0;
  const discount = current.mrp > current.price
    ? Math.round(((current.mrp - current.price) / current.mrp) * 100)
    : 0;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-md bg-white rounded-t-3xl max-h-[88vh] overflow-y-auto"
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
        >
          <button onClick={onClose}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 shadow-card flex items-center justify-center">
            <X size={18} className="text-brand-black" />
          </button>

          {/* Image */}
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.image} alt={current.name} className="w-full h-60 object-cover" />
            <div className="absolute top-2 left-2 bg-brand-black/75 rounded-xl px-2 py-1 flex items-center gap-1">
              <Clock size={11} className="text-brand-green" />
              <span className="text-[11px] font-bold text-white">{current.eta} mins</span>
            </div>
          </div>

          {/* Details */}
          <div className="p-5">
            <h2 className="text-xl font-black text-brand-black leading-tight">{current.name}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{current.unit}</p>

            <div className="flex items-center gap-2 mt-3">
              <span className="text-2xl font-black text-brand-black">{formatCurrency(current.price)}</span>
              {discount > 0 && (
                <>
                  <span className="text-sm text-gray-400 line-through">{formatCurrency(current.mrp)}</span>
                  <span className="text-xs font-bold text-brand-green bg-brand-green/10 rounded-lg px-2 py-0.5">{discount}% OFF</span>
                </>
              )}
            </div>

            {current.description && (
              <p className="text-sm text-gray-500 mt-3 leading-relaxed">{current.description}</p>
            )}

            {/* Add to cart */}
            <div className="mt-4">
              {qty === 0 ? (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => addItem(current)}
                  className="w-full py-3.5 rounded-2xl bg-brand-green text-white font-bold shadow-green">
                  Add to Cart
                </motion.button>
              ) : (
                <div className="flex items-center justify-between bg-brand-black rounded-2xl px-4 py-3">
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => updateQty(current.id, qty - 1)}>
                    <Minus size={18} className="text-brand-green" />
                  </motion.button>
                  <span className="text-white font-black">{qty} in cart</span>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => addItem(current)}>
                    <Plus size={18} className="text-brand-green" />
                  </motion.button>
                </div>
              )}
            </div>

            {/* Recommendations */}
            {recs.length > 0 && (
              <div className="mt-6">
                <h3 className="font-black text-brand-black mb-3">You may also like</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {recs.map((r) => (
                    <div key={r.id}
                      className="flex-shrink-0 w-28 bg-brand-surface rounded-2xl overflow-hidden cursor-pointer"
                      onClick={() => setCurrent(r)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.image} alt={r.name} className="w-full h-24 object-cover" />
                      <div className="p-2">
                        <p className="text-xs font-bold text-brand-black line-clamp-1">{r.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-black text-brand-black">{formatCurrency(r.price)}</span>
                          <motion.button whileTap={{ scale: 0.85 }}
                            onClick={(e) => { e.stopPropagation(); addItem(r); }}
                            className="w-6 h-6 rounded-lg bg-brand-black flex items-center justify-center">
                            <Plus size={12} className="text-brand-green" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
