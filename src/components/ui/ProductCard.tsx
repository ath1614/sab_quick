"use client";
import { motion } from "framer-motion";
import { useCartStore } from "@/store";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Minus, Clock } from "lucide-react";

export default function ProductCard({ product }: { product: Product }) {
  const { items, addItem, updateQty } = useCartStore();
  const cartItem = items.find((i) => i.product.id === product.id);
  const qty = cartItem?.quantity ?? 0;
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <motion.div
      className="bg-white rounded-3xl overflow-hidden shadow-card relative"
      whileHover={{ y: -3, boxShadow: "0 12px 40px rgba(0,0,0,0.13)" }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {/* Image */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-36 object-cover"
        />

        {/* Geometric corner accent */}
        <div className="absolute top-0 left-0 w-0 h-0 border-r-[36px] border-r-transparent border-t-[36px] border-t-brand-black/80" />

        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-0 left-0 flex items-center justify-center w-9 h-9">
            <span className="text-[9px] font-black text-white leading-tight text-center">{discount}%<br />OFF</span>
          </div>
        )}

        {/* ETA badge */}
        <div className="absolute top-2 right-2 bg-brand-black/75 backdrop-blur-sm rounded-xl px-2 py-1 flex items-center gap-1">
          <Clock size={9} className="text-brand-green" />
          <span className="text-[10px] font-bold text-white">{product.eta}m</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="font-bold text-brand-black text-sm leading-tight mb-0.5 line-clamp-1">{product.name}</p>
        <p className="text-[11px] text-gray-400 mb-2.5">{product.unit}</p>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-black text-brand-black text-sm">{formatCurrency(product.price)}</span>
            {product.mrp > product.price && (
              <span className="text-[10px] text-gray-400 line-through ml-1">{formatCurrency(product.mrp)}</span>
            )}
          </div>

          {qty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => addItem(product)}
              className="relative w-8 h-8 rounded-xl bg-brand-black flex items-center justify-center overflow-hidden"
            >
              {/* Green triangle corner */}
              <span className="absolute top-0 right-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-brand-green" />
              <Plus size={15} className="text-white" />
            </motion.button>
          ) : (
            <div className="flex items-center gap-1.5 bg-brand-black rounded-xl px-2 py-1">
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => updateQty(product.id, qty - 1)}>
                <Minus size={11} className="text-brand-green" />
              </motion.button>
              <span className="text-xs font-black text-white w-4 text-center">{qty}</span>
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => addItem(product)}>
                <Plus size={11} className="text-brand-green" />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom green line accent */}
      {qty > 0 && (
        <motion.div
          layoutId={`card-active-${product.id}`}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
        />
      )}
    </motion.div>
  );
}
