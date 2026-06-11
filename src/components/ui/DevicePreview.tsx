"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, X, RotateCcw, ExternalLink } from "lucide-react";

export default function DevicePreview() {
  const [open, setOpen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const show = (() => {
    // Only show on desktop browsers, not on mobile and not inside iframe
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    const inFrame = (() => { try { return window.self !== window.top; } catch { return true; } })();
    const onPreview = window.location.pathname === "/preview";
    return !isMobile && !inFrame && !onPreview;
  })();

  if (!show) return null;

  return (
    <>
      {/* Trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ delay: 1 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setOpen(true)}
            style={{
              position: "fixed",
              bottom: 24,
              right: 16,
              zIndex: 9990,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 16,
              background: "linear-gradient(135deg,#0D0D0D,#1c1c1c)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(44,160,28,0.45)",
              color: "white",
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              overflow: "hidden",
            }}
          >
            {/* Green corner accent */}
            <span style={{ position: "absolute", top: 0, right: 0, width: 0, height: 0, borderLeft: "12px solid transparent", borderTop: "12px solid #2CA01C" }} />
            <Smartphone size={15} color="#2CA01C" />
            Preview App
          </motion.button>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 9991,
              background: "#080808",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {/* Dot grid bg */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15 }}>
              <defs>
                <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="#2CA01C" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>

            {/* Top bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", zIndex: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="logo" style={{ width: 32, height: 32, borderRadius: 10, objectFit: "contain" }} />
                <div>
                  <div style={{ color: "white", fontWeight: 900, fontSize: 13, lineHeight: 1 }}>SAB QUICK</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 }}>Android Preview</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { icon: <RotateCcw size={14} />, onClick: () => setIframeKey(k => k + 1), title: "Reload" },
                  { icon: <ExternalLink size={14} />, onClick: () => window.open("/preview", "_blank"), title: "Open tab" },
                  { icon: <X size={16} />, onClick: () => setOpen(false), title: "Close" },
                ].map(({ icon, onClick, title }) => (
                  <button key={title} onClick={onClick} title={title}
                    style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone frame */}
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              style={{ position: "relative", width: 375, height: 740, flexShrink: 0 }}
            >
              {/* Shell */}
              <div style={{
                position: "absolute", inset: 0, borderRadius: 50, pointerEvents: "none", zIndex: 20,
                background: "linear-gradient(160deg,#2e2e2e 0%,#0e0e0e 50%,#1a1a1a 100%)",
                boxShadow: "0 0 0 1.5px rgba(255,255,255,0.1), 0 0 0 3px rgba(0,0,0,0.9), 0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.15)",
              }} />

              {/* Buttons */}
              {[{ left: -3, top: 110, h: 34 }, { left: -3, top: 158, h: 34 }].map((b, i) => (
                <div key={i} style={{ position: "absolute", left: b.left, top: b.top, width: 3, height: b.h, background: "#2a2a2a", borderRadius: 2, zIndex: 25 }} />
              ))}
              <div style={{ position: "absolute", right: -3, top: 134, width: 3, height: 52, background: "#2a2a2a", borderRadius: 2, zIndex: 25 }} />

              {/* Screen */}
              <div style={{ position: "absolute", inset: 8, borderRadius: 42, overflow: "hidden", background: "#000", zIndex: 10 }}>

                {/* Status bar */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 44, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 24px 6px", background: "linear-gradient(180deg,rgba(0,0,0,0.5) 0%,transparent 100%)", zIndex: 30, pointerEvents: "none" }}>
                  <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>9:41</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width="15" height="10" viewBox="0 0 15 10">
                      <rect x="0" y="6" width="2.5" height="4" rx="0.5" fill="white" />
                      <rect x="4" y="4" width="2.5" height="6" rx="0.5" fill="white" />
                      <rect x="8" y="2" width="2.5" height="8" rx="0.5" fill="white" />
                      <rect x="12" y="0" width="2.5" height="10" rx="0.5" fill="white" opacity="0.35" />
                    </svg>
                    <svg width="13" height="10" viewBox="0 0 13 10">
                      <circle cx="6.5" cy="9" r="1.2" fill="white" />
                      <path d="M3.5 6.5 Q6.5 4.2 9.5 6.5" stroke="white" strokeWidth="1.1" fill="none" strokeLinecap="round" />
                      <path d="M1 4 Q6.5 0.5 12 4" stroke="white" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.5" />
                    </svg>
                    <svg width="22" height="11" viewBox="0 0 22 11">
                      <rect x="0.5" y="1" width="18" height="9" rx="2" stroke="white" strokeWidth="1" fill="none" />
                      <rect x="19" y="3.5" width="2.5" height="4" rx="1" fill="white" opacity="0.4" />
                      <rect x="2" y="2.5" width="13" height="6" rx="1" fill="white" />
                    </svg>
                  </div>
                </div>

                {/* Dynamic island */}
                <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 120, height: 30, background: "#000", borderRadius: 20, zIndex: 30, pointerEvents: "none" }} />

                {/* App iframe */}
                <iframe
                  key={iframeKey}
                  src="/preview"
                  title="SAB QUICK"
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", borderRadius: 42 }}
                />

                {/* Home bar */}
                <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", width: 120, height: 4, background: "rgba(255,255,255,0.25)", borderRadius: 4, zIndex: 30, pointerEvents: "none" }} />
              </div>

              {/* Glare */}
              <div style={{ position: "absolute", inset: 8, borderRadius: 42, background: "linear-gradient(130deg,rgba(255,255,255,0.05) 0%,transparent 45%)", zIndex: 21, pointerEvents: "none" }} />

              {/* Green glow */}
              <div style={{ position: "absolute", bottom: -16, left: "50%", transform: "translateX(-50%)", width: 180, height: 20, background: "rgba(44,160,28,0.3)", borderRadius: "50%", filter: "blur(16px)", zIndex: 0 }} />
            </motion.div>

            {/* Hint */}
            <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2CA01C", display: "inline-block" }} />
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 500 }}>Live preview · fully interactive</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
