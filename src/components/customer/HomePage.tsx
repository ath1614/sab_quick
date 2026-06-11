"use client";
import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search, Bell, MapPin, ChevronRight, Zap, ShoppingCart } from "lucide-react";
import { useAuthStore, useCartStore, useBusinessStore } from "@/store";
import ProductCard from "@/components/ui/ProductCard";
import CartSheet from "@/components/customer/CartSheet";
import BottomNav from "@/components/layout/BottomNav";

import AuthGuard from "@/components/layout/AuthGuard";
import { useProducts, useCategories } from "@/hooks/useSupabase";

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore((s) => s.count());
  const { products: localProducts, categories: localCategories } = useBusinessStore();

  // Live data from Supabase, fallback to local store
  const { data: remoteProducts } = useProducts();
  const { data: remoteCategories } = useCategories();
  const products = remoteProducts ?? localProducts;
  const categories = remoteCategories ?? localCategories;
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 120], [1, 0.96]);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  const filteredProducts = activeCategory === "all"
    ? products
    : products.filter((p) => p.category === activeCategory);

  const SECTIONS = [
    { title: "Delivered in 10 mins", products: filteredProducts.filter((p) => p.isActive).slice(0, 4) },
    { title: "Trending Now", products: filteredProducts.filter((p) => p.isActive).slice(2, 6) },
    { title: "New Arrivals", products: filteredProducts.filter((p) => p.isActive).slice(4, 8) },
  ];

  const filteredSearch = search
    ? products.filter((p) => p.isActive && p.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <AuthGuard>
    <div className="min-h-screen bg-brand-surface pb-28">

      {/* ── GEOMETRIC HEADER ─────────────────────────────────────── */}
      <motion.div
        style={{ opacity: headerOpacity }}
        className="relative overflow-hidden bg-brand-black safe-top"
      >
        {/* SVG geometric background */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 390 220"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Large diagonal slash — green */}
          <polygon points="260,0 390,0 390,160 200,220" fill="#2CA01C" opacity="0.12" />
          {/* Second slash — deeper */}
          <polygon points="300,0 390,0 390,80" fill="#2CA01C" opacity="0.18" />
          {/* Bottom-left triangle — white */}
          <polygon points="0,180 120,220 0,220" fill="#ffffff" opacity="0.04" />
          {/* Hexagon accent top-right */}
          <polygon
            points="355,18 370,10 385,18 385,34 370,42 355,34"
            fill="none" stroke="#2CA01C" strokeWidth="1.2" opacity="0.5"
          />
          {/* Small triangle mid */}
          <polygon points="230,60 248,90 212,90" fill="#2CA01C" opacity="0.15" />
          {/* Thin diagonal line */}
          <line x1="0" y1="200" x2="180" y2="60" stroke="#2CA01C" strokeWidth="0.6" opacity="0.2" />
          <line x1="20" y1="220" x2="200" y2="80" stroke="#ffffff" strokeWidth="0.4" opacity="0.06" />
          {/* Corner diamond */}
          <polygon points="16,0 32,16 16,32 0,16" fill="#2CA01C" opacity="0.2" />
          {/* Dot grid */}
          {[0,1,2,3].map((col) =>
            [0,1,2].map((row) => (
              <circle
                key={`${col}-${row}`}
                cx={310 + col * 18}
                cy={100 + row * 18}
                r="1.5"
                fill="#2CA01C"
                opacity="0.3"
              />
            ))
          )}
        </svg>

        {/* Top bar */}
        <div className="relative z-10 px-5 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
            <div>
              <p className="text-[10px] text-white/50 font-medium uppercase tracking-widest flex items-center gap-1">
                <MapPin size={8} className="text-brand-green" /> Delivering to
              </p>
              <p className="font-bold text-white text-xs leading-tight">Mumbai 400001</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="relative w-9 h-9 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center"
            >
              <Bell size={16} className="text-white/80" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-green rounded-full" />
            </motion.button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="logo" className="w-9 h-9 rounded-2xl object-cover border border-white/10" />
          </div>
        </div>

        {/* Greeting */}
        <div className="relative z-10 px-5 pt-3 pb-1">
          <motion.p
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-white/50 text-xs font-medium"
          >
            Good morning
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-white font-black text-2xl leading-tight tracking-tight"
          >
            Hello, {firstName}
          </motion.h1>
        </div>

        {/* Search bar */}
        <div className="relative z-10 px-5 pt-3 pb-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="relative"
          >
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groceries, snacks..."
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white/8 border border-white/12 text-white placeholder-white/35 text-sm focus:outline-none focus:border-brand-green/60 focus:bg-white/12 transition-all"
            />
            {cartCount > 0 && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setCartOpen(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-brand-green flex items-center justify-center"
              >
                <ShoppingCart size={14} className="text-white" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-brand-green text-[9px] font-black rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Bottom geometric cut */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 390 24"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon points="0,24 390,0 390,24" fill="#F7F8F9" />
        </svg>
      </motion.div>

      {/* ── SEARCH RESULTS ───────────────────────────────────────── */}
      {filteredSearch && (
        <div className="px-4 pt-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            {filteredSearch.length} results for &quot;{search}&quot;
          </p>
          {filteredSearch.length === 0 ? (
            <div className="text-center py-12">
              <Search size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredSearch.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MAIN CONTENT (hidden during search) ─────────────────── */}
      {!filteredSearch && (
        <div className="px-4 pt-4 space-y-7">

          {/* Hero banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #1a1a1a 60%, #0f2010 100%)" }}
          >
            {/* Geometric SVG inside banner */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 130" preserveAspectRatio="xMidYMid slice">
              <polygon points="200,0 340,0 340,130 140,130" fill="#2CA01C" opacity="0.08" />
              <polygon points="260,0 340,0 340,60" fill="#2CA01C" opacity="0.14" />
              <polygon points="0,100 80,130 0,130" fill="#ffffff" opacity="0.03" />
              <polygon points="290,40 310,20 330,40 310,60" fill="none" stroke="#2CA01C" strokeWidth="1" opacity="0.4" />
              {[0,1,2].map((i) => (
                <circle key={i} cx={300 + i * 14} cy={90} r="1.5" fill="#2CA01C" opacity="0.4" />
              ))}
              <line x1="0" y1="80" x2="160" y2="0" stroke="#2CA01C" strokeWidth="0.5" opacity="0.15" />
            </svg>

            <div className="relative z-10 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 bg-brand-green/20 border border-brand-green/30 rounded-lg px-2.5 py-1">
                  <Zap size={11} className="text-brand-green" fill="#2CA01C" />
                  <span className="text-[10px] font-black text-brand-green uppercase tracking-widest">Express</span>
                </div>
              </div>
              <h2 className="text-[22px] font-black text-white leading-tight">
                Groceries in<br />
                <span className="text-brand-green">10 Minutes</span>
              </h2>
              <p className="text-white/50 text-xs mt-1.5 mb-3">Free delivery on your first order</p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="bg-brand-green text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-green"
              >
                Order Now
              </motion.button>
            </div>

            {/* Animated speed lines */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-brand-green/30"
                style={{ height: 1, width: 30 + i * 14, top: `${25 + i * 18}%`, right: 0 }}
                animate={{ x: [0, -180], opacity: [0, 0.7, 0] }}
                transition={{ duration: 1.2, delay: i * 0.25, repeat: Infinity, ease: "easeOut" }}
              />
            ))}
          </motion.div>

          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {/* Geometric accent */}
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <polygon points="7,0 14,7 7,14 0,7" fill="#2CA01C" />
                </svg>
                <h3 className="font-black text-brand-black text-base">Categories</h3>
              </div>
              <button className="text-brand-green text-xs font-bold flex items-center gap-1 uppercase tracking-wide">
                All <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {[{ id: "all", name: "All" }, ...categories].map((cat, i) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-shrink-0 relative px-4 py-2.5 text-xs font-bold transition-all overflow-hidden ${
                    activeCategory === cat.id
                      ? "bg-brand-black text-white rounded-2xl"
                      : "bg-white text-gray-600 rounded-2xl border border-gray-100"
                  }`}
                >
                  {activeCategory === cat.id && (
                    <motion.div
                      layoutId="cat-active"
                      className="absolute inset-0 bg-brand-black rounded-2xl"
                      style={{ zIndex: -1 }}
                    />
                  )}
                  {/* Green triangle accent on active */}
                  {activeCategory === cat.id && (
                    <span className="absolute top-0 right-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-brand-green" />
                  )}
                  {cat.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Product sections */}
          {SECTIONS.map((section, si) => (
            <div key={si}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {/* Alternating geometric accents */}
                  {si === 0 && (
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <polygon points="6,0 12,12 0,12" fill="#2CA01C" />
                    </svg>
                  )}
                  {si === 1 && (
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <rect x="2" y="2" width="8" height="8" fill="#0D0D0D" transform="rotate(45 6 6)" />
                    </svg>
                  )}
                  {si === 2 && (
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <polygon points="6,0 12,6 6,12 0,6" fill="#2CA01C" opacity="0.7" />
                    </svg>
                  )}
                  <h3 className="font-black text-brand-black text-base">{section.title}</h3>
                </div>
                <button className="text-brand-green text-xs font-bold flex items-center gap-1 uppercase tracking-wide">
                  See all <ChevronRight size={12} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {section.products.map((product, pi) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: si * 0.08 + pi * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}

          {/* Bottom spacer for nav */}
          <div className="h-4" />
        </div>
      )}

      {/* Floating cart */}
      {cartCount > 0 && !cartOpen && (
        <motion.button
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setCartOpen(true)}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-brand-black text-white font-bold px-6 py-3.5 rounded-full flex items-center gap-3 border border-brand-green/30"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(44,160,28,0.2)" }}
        >
          <span className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center text-xs font-black">{cartCount}</span>
          View Cart
          <svg width="10" height="10" viewBox="0 0 10 10">
            <polygon points="5,0 10,5 5,10 0,5" fill="#2CA01C" />
          </svg>
        </motion.button>
      )}

      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
      <BottomNav />
    </div>
    </AuthGuard>
  );
}
