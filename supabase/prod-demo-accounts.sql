-- PRODUCTION READY DEMO ACCOUNTS (V7 - Final PKEY Fix)
-- 1. Setup
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. REPAIR PERMISSIONS
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Cleanup & Creation Block
DO $$ 
DECLARE
    item RECORD;
    new_user_id UUID;
BEGIN
    -- PHASE A: DELETE EXISTING
    -- This removes records from auth.users (cascades) and public.users
    DELETE FROM auth.users WHERE email IN ('owner@sab.com', 'manager@sab.com', 'customer@sab.com', 'delivery@sab.com', 'staff@sab.com');
    DELETE FROM public.users WHERE email IN ('owner@sab.com', 'manager@sab.com', 'customer@sab.com', 'delivery@sab.com', 'staff@sab.com');

    -- PHASE B: CREATE NEW
    FOR item IN (
        SELECT 'owner@sab.com' as email, 'Password123' as pass, 'Demo Owner' as name, 'owner' as role UNION ALL
        SELECT 'manager@sab.com', 'Password123', 'Demo Manager', 'manager' UNION ALL
        SELECT 'customer@sab.com', 'Password123', 'Demo Customer', 'customer' UNION ALL
        SELECT 'delivery@sab.com', 'Password123', 'Demo Delivery', 'delivery' UNION ALL
        SELECT 'staff@sab.com', 'Password123', 'Demo Staff', 'staff'
    ) LOOP
        new_user_id := gen_random_uuid();

        -- 1. Create Auth User
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, aud, role,
            created_at, updated_at, confirmation_token, recovery_token,
            email_change_token_new, is_super_admin
        ) VALUES (
            new_user_id, '00000000-0000-0000-0000-000000000000', item.email,
            crypt(item.pass, gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('name', item.name, 'role', item.role),
            'authenticated', 'authenticated', now(), now(), '', '', '', false
        );

        -- 2. Create Identity
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id,
            last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), new_user_id,
            format('{"sub":"%s","email":"%s"}', new_user_id, item.email)::jsonb,
            'email', new_user_id::text, now(), now(), now()
        );

        -- 3. Create Public Profile with ON CONFLICT (UPSERT)
        -- This handles cases where the ID might still exist due to transaction lag
        INSERT INTO public.users (id, name, email, role)
        VALUES (new_user_id, item.name, item.email, item.role)
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            role = EXCLUDED.role;

        RAISE NOTICE 'Success: Created %', item.email;
    END LOOP;
END $$;

-- 4. Reload Schema
NOTIFY pgrst, 'reload schema';
