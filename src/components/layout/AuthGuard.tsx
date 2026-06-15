"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // The persisted auth store can read as null on the first client render even
  // when a session exists (zustand/SSR selector lag). Wait a beat after mount
  // before redirecting, so a logged-in user reloading a page isn't bounced.
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setChecked(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (checked && !user) router.replace("/auth");
  }, [checked, user, router]);

  if (!user) return <div style={{ position: "fixed", inset: 0, background: "#fff" }} />;
  return <>{children}</>;
}
