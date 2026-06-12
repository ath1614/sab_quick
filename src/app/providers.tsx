"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useInitialData } from "@/lib/useInitialData";
import { useRealtimeSubscriptions } from "@/lib/realtime";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";

function StoreInitializers() {
  useInitialData();
  useRealtimeSubscriptions();
  return null;
}

function AuthListener() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Get user profile from DB
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        
        if (profile) {
          setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role as "customer" | "delivery" | "staff" | "manager" | "owner" | "admin",
            phone: profile.phone ?? undefined,
            permissions: profile.permissions ?? [],
          }, session);
        }
      } else {
        setUser(null, null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <StoreInitializers />
      <AuthListener />
      {children}
    </QueryClientProvider>
  );
}
