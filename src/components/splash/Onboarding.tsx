"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store";
import { Zap, MapPin, Package } from "lucide-react";

const slides = [
  {
    icon: Zap,
    title: "Lightning Fast",
    subtitle: "Delivered in 10 minutes",
    bg: "from-green-50 to-white",
  },
  {
    icon: MapPin,
    title: "Everything Nearby",
    subtitle: "1000+ products from local stores",
    bg: "from-emerald-50 to-white",
  },
  {
    icon: Package,
    title: "Right To Your Door",
    subtitle: "Track every order in real-time",
    bg: "from-teal-50 to-white",
  },
];

export default function Onboarding() {
  const [current, setCurrent] = useState(0);
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);

  const next = () => {
    if (current < slides.length - 1) setCurrent(current + 1);
    else setOnboardingDone();
  };

  const slide = slides[current];
  const Icon = slide.icon;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "2rem" }}>
      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <motion.div
              className="w-28 h-28 rounded-3xl flex items-center justify-center"
              style={{ background: "rgba(44,160,28,0.15)", border: "1px solid rgba(44,160,28,0.2)" }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon size={56} color="#2CA01C" strokeWidth={1.5} />
            </motion.div>
            <div>
              <h1 className="text-3xl font-black text-brand-black mb-2">{slide.title}</h1>
              <p className="text-gray-500 text-base">{slide.subtitle}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex gap-2 mb-8">
        {slides.map((_, i) => (
          <motion.div
            key={i}
            className="h-2 rounded-full"
            style={{ background: "#2CA01C" }}
            animate={{ width: i === current ? 24 : 8, opacity: i === current ? 1 : 0.25 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={next}
          className="w-full py-4 rounded-2xl bg-brand-green text-white font-bold text-lg shadow-green"
        >
          {current < slides.length - 1 ? "Next" : "Get Started"}
        </motion.button>
        {current < slides.length - 1 && (
          <button onClick={setOnboardingDone} className="text-gray-400 text-sm text-center py-2">
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
