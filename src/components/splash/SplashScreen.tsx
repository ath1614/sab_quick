"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store";

export default function SplashScreen() {
  const setSplashDone = useAppStore((s) => s.setSplashDone);
  const [scene, setScene] = useState(0);

  useEffect(() => {
    // Scene 1: streaks → Scene 2: logo assembles → Scene 3: glow pulse → Scene 4: fade out
    const timings = [100, 500, 1000, 1600, 2400, 3000];
    const timers = timings.map((t, i) => setTimeout(() => setScene(i + 1), t));
    const done = setTimeout(() => setSplashDone(), 3600);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [setSplashDone]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>

      {/* Green delivery streaks */}
      {scene >= 1 &&
        [0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              height: 2,
              width: 48 + i * 16,
              top: `${18 + i * 14}%`,
              background: "linear-gradient(90deg, transparent, #2CA01C, transparent)",
              filter: "blur(0.5px)",
            }}
            initial={{ x: -120, opacity: 0 }}
            animate={{ x: "110vw", opacity: [0, 1, 0] }}
            transition={{ duration: 0.55, delay: i * 0.07, ease: "easeOut" }}
          />
        ))}

      {/* Logo — assembles from scale + fade */}
      {scene >= 2 && (
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.05 }}
        >
          {/* Glow ring behind logo */}
          {scene >= 3 && (
            <motion.div
              className="absolute rounded-full"
              style={{ width: 180, height: 180, background: "radial-gradient(circle, rgba(44,160,28,0.18) 0%, transparent 70%)" }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [1, 1.35, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="SAB QUICK"
            style={{ width: 160, height: "auto", objectFit: "contain" }}
            className="relative z-10 drop-shadow-2xl"
          />
        </motion.div>
      )}

      {/* Particle trails */}
      {scene >= 3 &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={`p${i}`}
            className="absolute rounded-full bg-brand-green"
            style={{ width: 4, height: 4, left: `${40 + i * 10}%`, top: `${55 + i * 5}%` }}
            animate={{ y: [-4, 4, -4], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.2 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

      {/* Fade-out transition */}
      {scene >= 5 && (
        <motion.div
          className="absolute inset-0"
          style={{ background: "#F7F8F9" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
