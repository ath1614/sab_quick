-- Demo Accounts for SAB QUICK
-- Run this in Supabase SQL Editor to create demo accounts
-- NOTE: You'll still need to sign up with these emails through the app to create the auth users!

-- These are just the public profiles - you need to create the auth users first via sign up!
-- Here are the demo credentials:

-- DEMO CUSTOMER
-- Email: customer@demo.com
-- Password: demo123
-- Role: customer

-- DEMO DELIVERY PARTNER
-- Email: delivery@demo.com
-- Password: demo123
-- Role: delivery

-- DEMO STAFF
-- Email: staff@demo.com
-- Password: demo123
-- Role: staff

-- DEMO MANAGER
-- Email: manager@demo.com
-- Password: demo123
-- Role: manager

-- DEMO OWNER
-- Email: owner@demo.com
-- Password: demo123
-- Role: owner

-- DEMO ADMIN
-- Email: admin@demo.com
-- Password: demo123
-- Role: admin

-- After signing up with these emails, you can run this to update their roles (if needed):
-- UPDATE public.users SET role = 'customer' WHERE email = 'customer@demo.com';
-- UPDATE public.users SET role = 'delivery' WHERE email = 'delivery@demo.com';
-- UPDATE public.users SET role = 'staff' WHERE email = 'staff@demo.com';
-- UPDATE public.users SET role = 'manager' WHERE email = 'manager@demo.com';
-- UPDATE public.users SET role = 'owner' WHERE email = 'owner@demo.com';
-- UPDATE public.users SET role = 'admin' WHERE email = 'admin@demo.com';
