import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cookie-backed browser client. Using @supabase/ssr (instead of the plain
// supabase-js client) means the auth session is stored in cookies the server
// and proxy.ts can read — required for server-side route protection.
export const supabase = createBrowserClient(url, key);
