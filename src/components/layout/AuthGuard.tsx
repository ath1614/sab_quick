"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // Don't judge auth until the persisted store has hydrated, otherwise a
  // reload of a protected page bounces a logged-in user to /auth.
  const [ready, setReady] = useState(
    () => typeof window !== "undefined" && useAuthStore.persist.hasHydrated()
  );
  useEffect(() => useAuthStore.persist.onFinishHydration(() => setReady(true)), []);

  useEffect(() => {
    if (ready && !user) router.replace("/auth");
  }, [ready, user, router]);

  if (!ready || !user) return <div style={{ position: "fixed", inset: 0, background: "#fff" }} />;
  return <>{children}</>;
}
