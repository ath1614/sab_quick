"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { Truck, MapPin } from "lucide-react";
import { loadMapbox, mapsEnabled } from "@/lib/maps";

interface Props {
  driver?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  route?: [number, number][] | null; // [lng, lat] polyline
  className?: string;
}

/**
 * Live map. Renders a real Mapbox map when NEXT_PUBLIC_MAPBOX_TOKEN is set,
 * otherwise falls back to the styled placeholder so the UI is unaffected.
 */
export default function LiveMap({ driver, destination, route, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const driverMarker = useRef<any>(null);
  const destMarker = useRef<any>(null);

  useEffect(() => {
    if (!mapsEnabled() || !containerRef.current) return;
    let cancelled = false;

    loadMapbox()
      .then((mapboxgl) => {
        if (cancelled || !containerRef.current) return;
        const center = driver || destination || { lat: 19.076, lng: 72.8777 };
        mapRef.current = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [center.lng, center.lat],
          zoom: 13,
        });
      })
      .catch(() => {
        /* leave the fallback visible */
      });

    return () => {
      cancelled = true;
      mapRef.current?.remove?.();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when coordinates change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !(window as any).mapboxgl) return;
    const mapboxgl = (window as any).mapboxgl;

    if (driver) {
      if (!driverMarker.current) {
        driverMarker.current = new mapboxgl.Marker({ color: "#2CA01C" });
      }
      driverMarker.current.setLngLat([driver.lng, driver.lat]).addTo(map);
      map.easeTo({ center: [driver.lng, driver.lat], duration: 800 });
    }
    if (destination) {
      if (!destMarker.current) {
        destMarker.current = new mapboxgl.Marker({ color: "#0D0D0D" });
      }
      destMarker.current.setLngLat([destination.lng, destination.lat]).addTo(map);
    }
  }, [driver, destination]);

  // Draw / update the route polyline.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route || route.length === 0) return;

    const draw = () => {
      const data = {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "LineString" as const, coordinates: route },
      };
      const src = map.getSource("route");
      if (src) {
        src.setData(data);
      } else {
        map.addSource("route", { type: "geojson", data });
        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#2CA01C", "line-width": 4 },
        });
      }
    };

    if (map.isStyleLoaded()) draw();
    else map.once("load", draw);
  }, [route]);

  if (mapsEnabled()) {
    return <div ref={containerRef} className={className} />;
  }

  // Fallback placeholder (no token configured).
  return (
    <div
      className={className}
      style={{ background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)", position: "relative" }}
    >
      <svg className="absolute inset-0 w-full h-full opacity-20">
        {[1, 2, 3].map((i) => <line key={`h${i}`} x1="0" y1={`${i * 25}%`} x2="100%" y2={`${i * 25}%`} stroke="#2CA01C" strokeWidth="1" />)}
        {[1, 2, 3, 4, 5].map((i) => <line key={`v${i}`} x1={`${i * 16.6}%`} y1="0" x2={`${i * 16.6}%`} y2="100%" stroke="#2CA01C" strokeWidth="1" />)}
      </svg>
      <div className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-brand-green flex items-center justify-center shadow-green">
        <Truck size={18} className="text-white" />
      </div>
      <div className="absolute right-8 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brand-black flex items-center justify-center">
        <MapPin size={14} className="text-brand-green" />
      </div>
    </div>
  );
}
