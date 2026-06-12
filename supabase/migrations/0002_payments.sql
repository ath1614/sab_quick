-- ============================================================================
-- SAB QUICK — Payments support (0002)
-- ----------------------------------------------------------------------------
-- The Razorpay flow keys a `transactions` row by the Razorpay order id
-- (gateway_ref). A unique index makes webhook processing idempotent and lets
-- the create-order route upsert safely. NULLs remain allowed (legacy rows /
-- COD), since Postgres treats NULLs as distinct in a unique index.
-- Apply after 0001. Idempotent.
-- ============================================================================

create unique index if not exists uq_transactions_gateway_ref
  on public.transactions (gateway_ref);

create index if not exists idx_transactions_status on public.transactions (status);
