import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const ALLOWED_NEW_ROLES = ["staff", "manager", "delivery"];

/**
 * Create a staff/manager/delivery user. Owner/admin only.
 * Creating an auth user requires the service role, so this must run server-side.
 * Body: { name, email, phone?, role, permissions? }
 * Returns a generated temporary password to share with the new user.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the caller is an owner/admin (RLS lets them read their own row).
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!me || !["owner", "admin"].includes(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let b: { name?: string; email?: string; phone?: string; role?: string; permissions?: string[] };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!b.name || !b.email || !b.role) {
    return NextResponse.json({ error: "name, email and role are required" }, { status: 400 });
  }
  if (!ALLOWED_NEW_ROLES.includes(b.role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const tempPassword = crypto.randomBytes(9).toString("base64url"); // ~12 chars

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: b.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name: b.name, role: b.role },
  });

  if (createErr || !created.user) {
    return NextResponse.json(
      { error: createErr?.message ?? "Could not create user" },
      { status: 400 }
    );
  }

  // The handle_new_user trigger inserts the profile; fill in the extra fields.
  await admin
    .from("users")
    .update({ phone: b.phone ?? null, permissions: b.permissions ?? [], is_active: true })
    .eq("id", created.user.id);

  return NextResponse.json({ id: created.user.id, tempPassword });
}
