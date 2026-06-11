"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace("/auth");
  }, [user, router]);

  if (!user) return <div style={{ position: "fixed", inset: 0, background: "#fff" }} />;
  return <>{children}</>;
}
