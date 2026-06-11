import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#2CA01C",
          black: "#0D0D0D",
          surface: "#F7F8F9",
          glow: "rgba(44,160,28,0.15)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.14)",
        green: "0 4px 24px rgba(44,160,28,0.25)",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "pulse-green": "pulseGreen 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGreen: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(44,160,28,0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(44,160,28,0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
