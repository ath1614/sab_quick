-- ============================================================================
-- SAB QUICK — Misc data fixes  (0008)
-- ----------------------------------------------------------------------------
-- Adds a column so an item-rejection reason actually persists (it was kept in
-- local state only and lost on reload / invisible to other roles). Run after 0007.
-- ============================================================================

alter table public.order_items add column if not exists rejection_reason text;
