-- Run this in Supabase SQL Editor to fix the order status constraint
-- Go to: https://supabase.com/dashboard/project/xenlelwvvbnopcjckopr/sql

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'new',
    'accepted', 
    'preparing',
    'packed',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'rejected'
  ));

-- Verify it works
SELECT 'Constraint updated successfully' as result;
