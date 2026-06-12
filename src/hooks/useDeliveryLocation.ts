"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Driver side: while `active`, watch GPS and upsert the position into
 * delivery_locations for each of the partner's in-flight orders.
 */
export function useBroadcastLocation(
  active: boolean,
  orderIds: string[],
  partnerId?: string
) {
  const orderIdsRef = useRef(orderIds);
  useEffect(() => {
    orderIdsRef.current = orderIds;
  }, [orderIds]);

  useEffect(() => {
    if (!active || !partnerId || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading } = pos.coords;
        for (const orderId of orderIdsRef.current) {
          supabase
            .from("delivery_locations")
            .upsert(
              {
                order_id: orderId,
                partner_id: partnerId,
                lat: latitude,
                lng: longitude,
                heading: heading ?? null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "order_id" }
            )
            .then(() => {});
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [active, partnerId]);
}

/**
 * Customer side: subscribe to the live location for one order.
 */
export function useOrderLocation(orderId?: string | null) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    supabase
      .from("delivery_locations")
      .select("lat, lng")
      .eq("order_id", orderId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setLocation({ lat: data.lat, lng: data.lng });
      });

    const channel = supabase
      .channel(`loc-${orderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_locations", filter: `order_id=eq.${orderId}` },
        (payload) => {
          const row = payload.new as { lat: number; lng: number } | undefined;
          if (row) setLocation({ lat: row.lat, lng: row.lng });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return location;
}
