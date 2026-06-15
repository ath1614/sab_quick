"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import type { Role } from "@/lib/constants";

const HOME: Record<Role, string> = {
  customer: "/home",
  delivery: "/delivery",
  staff: "/staff",
  manager: "/manager",
  owner: "/owner",
  admin: "/admin",
};

/**
 * Client-side role gate (UX). Redirects users without an allowed role to
 * their own home. Authoritative enforcement is RLS in Postgres — a spoofed
 * client role only reveals an empty dashboard shell.
 */
export default function RoleGuard({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // Wait for the persisted auth store to hydrate before redirecting.
  // Wait a beat after mount before redirecting (auth store selector can read
  // null/stale on the first client render even with a valid session).
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setChecked(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!user) {
      router.replace("/auth");
    } else if (!allow.includes(user.role)) {
      router.replace(HOME[user.role] ?? "/home");
    }
  }, [checked, user, allow, router]);

  if (!user || !allow.includes(user.role)) {
    return <div style={{ position: "fixed", inset: 0, background: "#fff" }} />;
  }
  return <>{children}</>;
}
