import { MAPBOX_TOKEN } from "@/lib/maps";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ResolvedAddress {
  line1: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

/**
 * Reverse-geocode GPS coords to a structured address. Uses Mapbox when a token
 * is configured, otherwise falls back to free OpenStreetMap Nominatim.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<Partial<ResolvedAddress> | null> {
  try {
    if (MAPBOX_TOKEN) {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
          `?access_token=${MAPBOX_TOKEN}&types=address,place,postcode,region,locality,neighborhood&limit=1`
      );
      if (res.ok) {
        const data = await res.json();
        const f = data.features?.[0];
        if (f) {
          const ctx: any[] = f.context ?? [];
          const find = (k: string) => ctx.find((c) => String(c.id).startsWith(k))?.text;
          return {
            line1: [f.address, f.text].filter(Boolean).join(" ") || f.place_name || "",
            city: find("place") || find("locality") || find("district") || "",
            state: find("region") || "",
            pincode: find("postcode") || "",
            lat,
            lng,
          };
        }
      }
    }

    // Fallback: Nominatim
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    return {
      line1: [a.house_number, a.road, a.suburb, a.neighbourhood].filter(Boolean).join(", "),
      city: a.city || a.town || a.district || "",
      state: a.state || "",
      pincode: a.postcode || "",
      lat,
      lng,
    };
  } catch {
    return null;
  }
}
