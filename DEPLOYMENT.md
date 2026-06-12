# SAB QUICK — Deployment & Setup

Auto-deployed to **Vercel** from `main` on GitHub.

## 1. Vercel project settings
- **Root Directory:** `sabquick` (the app is nested in the repo).
- Framework preset: Next.js. Build command/output: defaults.

## 2. Environment variables (Vercel → Settings → Environment Variables)
Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only — never `NEXT_PUBLIC`)
- `NEXT_PUBLIC_APP_URL` = your deployed URL (used for auth email redirects)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

Optional (features activate when present):
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

Never set `NEXT_PUBLIC_ENABLE_DEMO` in production (it exposes one-click role logins).

## 3. Database migrations (Supabase SQL editor, in order)
1. `supabase/schema.sql` (base schema, if not already applied)
2. `supabase/migrations/0001_production_hardening.sql`
3. `supabase/migrations/0002_payments.sql`
4. `supabase/migrations/0003_live_tracking.sql`

After 0001, once the client uses the `place_order` RPC (it does), you may
optionally run the commented `revoke insert on orders/order_items` lines at the
bottom of 0001 to fully prevent client-set prices.

## 4. Razorpay setup (online payments)
1. Create a Razorpay account; grab Key ID + Key Secret (test mode is fine).
2. Set the 4 Razorpay env vars above.
3. In the Razorpay dashboard → **Webhooks**, add:
   - URL: `https://<your-app>/api/payment/webhook`
   - Secret: same value as `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.captured`, `payment.failed`
4. COD works with no Razorpay config. Online UI appears only when
   `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set.

Payment flow: order is created (pending) → Razorpay checkout → `/api/payment/verify`
gives instant UI confirmation → the **webhook is the source of truth** and marks
the order `paid`/`failed` + records a `transactions` row.

## 5. Mapbox setup (live tracking + autocomplete)
1. Create a Mapbox account; copy the default public token.
2. Set `NEXT_PUBLIC_MAPBOX_TOKEN`.
3. The customer track page then shows a live map; the driver dashboard's
   "Online" toggle broadcasts GPS to `delivery_locations`; checkout shows
   address autocomplete. Without the token, all of these degrade gracefully.

## 6. Local development
```bash
cd sabquick
cp .env.example .env.local   # fill in values
npm install
npm run dev
```
Quality gates: `npm run lint`, `npm test`, `npm run build`. CI runs all of these
on every push (`.github/workflows/ci.yml`).

## 7. Capacitor (mobile app)
Since the app is now server-backed (not a static export), point the native app
at the deployed URL via `server.url` in `capacitor.config.json` rather than
bundling the `out/` directory.
