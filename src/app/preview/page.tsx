"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Bell, MapPin, ChevronRight, Zap, ShoppingCart, Home, Package, User } from "lucide-react";
import { useBusinessStore, useCartStore } from "@/store";
import ProductCard from "@/components/ui/ProductCard";

// Self-contained preview page — no redirects, no splash, no auth gate
// Loaded inside the device preview iframe
export default function PreviewPage() {
  const { products, categories } = useBusinessStore();
  const cartCount = useCartStore((s) => s.count());
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    // Small delay so Zustand hydrates from localStorage
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeProducts = products.filter((p) => p.isActive);
  const filtered = search
    ? activeProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : activeProducts;

  const SECTIONS = [
    { title: "Delivered in 10 mins", items: activeProducts.slice(0, 4) },
    { title: "Trending Now", items: activeProducts.slice(2, 6) },
    { title: "New Arrivals", items: activeProducts.slice(4, 8) },
  ];

  return (
    <div className="min-h-screen bg-brand-surface flex flex-col" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden bg-brand-black flex-shrink-0" style={{ paddingTop: 44 }}>
        {/* Geometric SVG */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 200" preserveAspectRatio="xMidYMid slice">
          <polygon points="260,0 390,0 390,160 200,200" fill="#2CA01C" opacity="0.12" />
          <polygon points="310,0 390,0 390,80" fill="#2CA01C" opacity="0.18" />
          <polygon points="0,170 110,200 0,200" fill="#ffffff" opacity="0.04" />
          <polygon points="355,16 370,8 385,16 385,32 370,40 355,32" fill="none" stroke="#2CA01C" strokeWidth="1.2" opacity="0.5" />
          <polygon points="16,0 32,16 16,32 0,16" fill="#2CA01C" opacity="0.2" />
          <line x1="0" y1="180" x2="180" y2="50" stroke="#2CA01C" strokeWidth="0.5" opacity="0.18" />
          {[0,1,2,3].map((c) => [0,1,2].map((r) => (
            <circle key={`${c}-${r}`} cx={308 + c * 18} cy={95 + r * 18} r="1.5" fill="#2CA01C" opacity="0.3" />
          )))}
        </svg>

        {/* Top bar */}
        <div className="relative z-10 px-4 pt-3 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
            <div>
              <p className="text-white/40 text-[9px] font-medium uppercase tracking-widest flex items-center gap-1">
                <MapPin size={7} color="#2CA01C" /> Delivering to
              </p>
              <p className="font-bold text-white text-[11px]">Mumbai 400001</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Bell size={14} color="rgba(255,255,255,0.7)" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-green rounded-full" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="logo" className="w-8 h-8 rounded-xl object-cover" style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
        </div>

        {/* Greeting */}
        <div className="relative z-10 px-4 pt-2 pb-1">
          <p className="text-white/40 text-[10px] font-medium">Good morning</p>
          <h1 className="text-white font-black text-xl leading-tight">Hello, Atharv</h1>
        </div>

        {/* Search */}
        <div className="relative z-10 px-4 pt-2 pb-4">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" color="rgba(255,255,255,0.35)" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groceries..."
              className="w-full text-sm text-white placeholder-white/30 focus:outline-none rounded-2xl py-3 pl-9 pr-10"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            {cartCount > 0 && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-xl bg-brand-green flex items-center justify-center">
                <ShoppingCart size={12} color="white" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white text-brand-green text-[8px] font-black rounded-full flex items-center justify-center">{cartCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Diagonal cut */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 390 20" preserveAspectRatio="none">
          <polygon points="0,20 390,0 390,20" fill="#F7F8F9" />
        </svg>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto pb-20" style={{ overscrollBehavior: "none" }}>
        <div className="px-3 pt-3 space-y-5">

          {/* Hero banner */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #1a1a1a 60%, #0f2010 100%)" }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 120" preserveAspectRatio="xMidYMid slice">
              <polygon points="200,0 340,0 340,120 140,120" fill="#2CA01C" opacity="0.08" />
              <polygon points="270,0 340,0 340,55" fill="#2CA01C" opacity="0.14" />
              <polygon points="290,35 310,18 330,35 310,52" fill="none" stroke="#2CA01C" strokeWidth="1" opacity="0.4" />
            </svg>
            <div className="relative z-10 p-4">
              <div className="flex items-center gap-1.5 mb-2 w-fit rounded-lg px-2 py-1" style={{ background: "rgba(44,160,28,0.2)", border: "1px solid rgba(44,160,28,0.3)" }}>
                <Zap size={10} color="#2CA01C" fill="#2CA01C" />
                <span className="text-[9px] font-black text-brand-green uppercase tracking-widest">Express</span>
              </div>
              <h2 className="text-lg font-black text-white leading-tight">
                Groceries in<br /><span className="text-brand-green">10 Minutes</span>
              </h2>
              <p className="text-white/40 text-[10px] mt-1 mb-2.5">Free delivery on first order</p>
              <div className="bg-brand-green text-white font-bold text-[10px] px-4 py-2 rounded-xl w-fit" style={{ boxShadow: "0 4px 16px rgba(44,160,28,0.35)" }}>
                Order Now
              </div>
            </div>
            {[0,1,2,3].map((i) => (
              <motion.div key={i} className="absolute rounded-full" style={{ height: 1, width: 24 + i * 12, top: `${28 + i * 18}%`, right: 0, background: "rgba(44,160,28,0.35)" }}
                animate={{ x: [0, -160], opacity: [0, 0.8, 0] }}
                transition={{ duration: 1.1, delay: i * 0.22, repeat: Infinity, ease: "easeOut" }} />
            ))}
          </motion.div>

          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,0 10,5 5,10 0,5" fill="#2CA01C" /></svg>
                <span className="font-black text-brand-black text-sm">Categories</span>
              </div>
              <span className="text-brand-green text-[10px] font-bold uppercase tracking-wide flex items-center gap-0.5">All <ChevronRight size={10} /></span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {[{ id: "all", name: "All" }, ...categories].map((cat) => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className="flex-shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold transition-all relative overflow-hidden"
                  style={{
                    background: activeCategory === cat.id ? "#0D0D0D" : "#fff",
                    color: activeCategory === cat.id ? "#fff" : "#555",
                    border: activeCategory === cat.id ? "none" : "1px solid #f0f0f0",
                  }}>
                  {activeCategory === cat.id && (
                    <span className="absolute top-0 right-0 w-0 h-0" style={{ borderLeft: "8px solid transparent", borderTop: "8px solid #2CA01C" }} />
                  )}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Search results or sections */}
          {search ? (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{filtered.length} results</p>
              <div className="grid grid-cols-2 gap-2.5">
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          ) : (
            SECTIONS.map((section, si) => (
              <div key={si}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 10 10">
                      {si === 0 && <polygon points="5,0 10,10 0,10" fill="#2CA01C" />}
                      {si === 1 && <rect x="1.5" y="1.5" width="7" height="7" fill="#0D0D0D" transform="rotate(45 5 5)" />}
                      {si === 2 && <polygon points="5,0 10,5 5,10 0,5" fill="#2CA01C" opacity="0.7" />}
                    </svg>
                    <span className="font-black text-brand-black text-sm">{section.title}</span>
                  </div>
                  <span className="text-brand-green text-[10px] font-bold uppercase tracking-wide">See all</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {section.items.map((p, pi) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.06 + pi * 0.04 }}>
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 px-3 py-2 rounded-[26px]"
          style={{ background: "#0D0D0D", boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(44,160,28,0.15)" }}>
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "explore", icon: Search, label: "Explore" },
            { id: "cart", icon: ShoppingCart, label: "Cart" },
            { id: "orders", icon: Package, label: "Orders" },
            { id: "profile", icon: User, label: "Profile" },
          ].map(({ id, icon: Icon, label }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className="relative flex flex-col items-center px-3 py-1.5 rounded-2xl transition-all"
                style={{ background: active ? "rgba(44,160,28,0.15)" : "transparent" }}>
                {active && <span className="absolute inset-0 rounded-2xl" style={{ border: "1px solid rgba(44,160,28,0.25)" }} />}
                <Icon size={18} color={active ? "#2CA01C" : "rgba(255,255,255,0.3)"} strokeWidth={active ? 2.5 : 1.8} />
                {active && <span className="text-[8px] font-bold mt-0.5" style={{ color: "#2CA01C" }}>{label}</span>}
                {id === "cart" && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-green text-white text-[8px] font-black rounded-full flex items-center justify-center">{cartCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
