"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { useBusinessStore } from "@/store";
import { useProducts, useCategories } from "@/hooks/useSupabase";
import ProductCard from "@/components/ui/ProductCard";
import BottomNav from "@/components/layout/BottomNav";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { products: localProducts, categories: localCategories } = useBusinessStore();
  const { data: remoteProducts } = useProducts();
  const { data: remoteCategories } = useCategories();
  const products = remoteProducts ?? localProducts;
  const categories = remoteCategories ?? localCategories;

  const filtered = products.filter((p) => {
    const matchQuery = p.name.toLowerCase().includes(query.toLowerCase());
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    return matchQuery && matchCat && p.isActive;
  });

  return (
    <div className="min-h-screen bg-brand-surface pb-28">
      <div className="bg-white px-5 pt-12 pb-4 safe-top">
        <h1 className="text-2xl font-black text-brand-black mb-4">Explore</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-brand-surface border border-gray-100 text-sm focus:outline-none focus:border-brand-green transition-all"
            />
          </div>
          <button className="w-12 h-12 rounded-2xl bg-brand-surface border border-gray-100 flex items-center justify-center">
            <SlidersHorizontal size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {[{ id: "all", name: "All" }, ...categories].map((cat) => (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeCategory === cat.id
                ? "bg-brand-green text-white shadow-green"
                : "bg-white text-gray-600 border border-gray-100"
            }`}
          >
            {cat.name}
          </motion.button>
        ))}
      </div>

      <div className="px-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Search size={64} className="text-gray-200" />
            </motion.div>
            <p className="text-gray-400 font-medium">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
