"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";

export interface SavedAddress {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  pincode: string;
  lat?: number | null;
  lng?: number | null;
  is_default?: boolean;
}

export type NewAddress = Omit<SavedAddress, "id" | "is_default">;

/**
 * Saved delivery addresses for the current user. RLS scopes every query to the
 * owner ("Users can manage own addresses"), so no explicit user filter needed.
 */
export function useAddresses() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const key = ["addresses", user?.id];

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<SavedAddress[]> => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const addAddress = async (a: NewAddress, makeDefault = false) => {
    if (!user) return false;
    if (makeDefault) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    }
    const { error } = await supabase.from("addresses").insert({
      user_id: user.id,
      label: a.label,
      line1: a.line1,
      line2: a.line2 ?? null,
      city: a.city,
      pincode: a.pincode,
      lat: a.lat ?? null,
      lng: a.lng ?? null,
      is_default: makeDefault,
    });
    if (!error) invalidate();
    return !error;
  };

  const removeAddress = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (!error) invalidate();
    return !error;
  };

  const setDefault = async (id: string) => {
    if (!user) return false;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    if (!error) invalidate();
    return !error;
  };

  return {
    addresses: query.data ?? [],
    isLoading: query.isLoading,
    addAddress,
    removeAddress,
    setDefault,
  };
}
