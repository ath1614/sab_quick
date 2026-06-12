// Mapbox integration, gated on NEXT_PUBLIC_MAPBOX_TOKEN. Everything degrades
// gracefully when the token is absent so the app is unaffected without it.
/* eslint-disable @typescript-eslint/no-explicit-any */

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function mapsEnabled() {
  return Boolean(MAPBOX_TOKEN);
}

const MAPBOX_VERSION = "v3.9.0";
let loaderPromise: Promise<any> | null = null;

/** Lazily load mapbox-gl from the CDN (no npm dependency). */
export function loadMapbox(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if ((window as any).mapboxgl) return Promise.resolve((window as any).mapboxgl);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = `https://api.mapbox.com/mapbox-gl-js/${MAPBOX_VERSION}/mapbox-gl.css`;
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = `https://api.mapbox.com/mapbox-gl-js/${MAPBOX_VERSION}/mapbox-gl.js`;
    script.onload = () => {
      const gl = (window as any).mapboxgl;
      if (gl) {
        gl.accessToken = MAPBOX_TOKEN;
        resolve(gl);
      } else reject(new Error("mapbox-gl failed to load"));
    };
    script.onerror = () => reject(new Error("mapbox-gl failed to load"));
    document.body.appendChild(script);
  });
  return loaderPromise;
}

export interface GeoSuggestion {
  label: string;
  lat: number;
  lng: number;
  city?: string;
  pincode?: string;
}

/** Address autocomplete via the Mapbox Geocoding API. Returns [] without a token. */
export async function geocodeSearch(query: string): Promise<GeoSuggestion[]> {
  if (!MAPBOX_TOKEN || query.trim().length < 3) return [];
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?access_token=${MAPBOX_TOKEN}&country=in&limit=5&types=address,place,locality,neighborhood,poi`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features ?? []).map((f: any): GeoSuggestion => {
      const ctx: any[] = f.context ?? [];
      const find = (k: string) => ctx.find((c) => String(c.id).startsWith(k))?.text;
      return {
        label: f.place_name,
        lng: f.center?.[0],
        lat: f.center?.[1],
        city: find("place") || find("locality"),
        pincode: find("postcode"),
      };
    });
  } catch {
    return [];
  }
}
