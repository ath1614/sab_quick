"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore, useAuthStore } from "@/store";
import SplashScreen from "@/components/splash/SplashScreen";
import Onboarding from "@/components/splash/Onboarding";

const ROLE_ROUTES: Record<string, string> = {
  customer: "/home",
  delivery: "/delivery",
  staff: "/staff",
  manager: "/manager",
  owner: "/owner",
  admin: "/admin",
};

export default function RootPage() {
  const { splashDone, onboardingDone } = useAppStore();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (splashDone && onboardingDone) {
      if (user) router.replace(ROLE_ROUTES[user.role] ?? "/home");
      else router.replace("/auth");
    }
  }, [splashDone, onboardingDone, user, router]);

  // Always show splash on every fresh load
  if (!splashDone) return <SplashScreen />;

  // Show onboarding only first time
  if (!onboardingDone) return <Onboarding />;

  // Waiting for router.replace to fire
  return <div style={{ position: "fixed", inset: 0, background: "#F7F8F9" }} />;
}
