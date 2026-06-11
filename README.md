# SAB QUICK 🛵

> **Right To Your Door** — Groceries delivered in 10 minutes.

A production-ready **PWA + Capacitor** mobile-first app built with Next.js 15.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion + GSAP |
| State | Zustand + TanStack Query |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL) |
| Cache | Redis |
| Media | Cloudinary |
| Realtime | Socket.IO |
| Mobile | Capacitor (Android + iOS) |
| Deploy | Docker + VPS + Cloudflare |

---

## Quick Start

```bash
cd sabquick
npm install
cp .env.example .env.local
# Fill in your Supabase + Redis credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Owner | owner@sab.com | Password123 |
| Manager | manager@sab.com | Password123 |
| Staff | staff@sab.com | Password123 |
| Delivery | delivery@sab.com | Password123 |
| Customer | customer@sab.com | Password123 |

---

## Routes

| Path | Description |
|---|---|
| `/` | Splash → Onboarding → Auto-route |
| `/auth` | Login (email + demo accounts) |
| `/home` | Customer home |
| `/explore` | Product search & filter |
| `/cart` | Cart management |
| `/checkout` | Address → Payment → Confirm |
| `/orders` | Order history |
| `/orders/track` | Live order tracking |
| `/profile` | User profile |
| `/delivery` | Delivery partner dashboard |
| `/staff` | Staff inventory + packing panel |
| `/manager` | Manager analytics |
| `/owner` | Owner business dashboard |
| `/admin` | Admin super panel |

---

## Database

Run `supabase/schema.sql` in your Supabase SQL Editor to create all tables with RLS policies and seed demo data.

---

## Docker

```bash
docker-compose up -d
```

---

## Capacitor (Mobile)

```bash
npm run build
npx cap add android
npx cap add ios
npx cap sync
npx cap open android   # Opens Android Studio
npx cap open ios       # Opens Xcode
```

---

## Brand

- Primary Green: `#2CA01C`
- Deep Black: `#0D0D0D`
- Surface: `#F7F8F9`
- Accent Glow: `rgba(44,160,28,0.15)`
