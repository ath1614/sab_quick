// Provider-agnostic delivery routing helpers. These are pure functions so they
// are fully unit-testable without a maps provider. A road-network optimizer
// (Mapbox/Google Directions) can later refine ETAs, but assignment and
// straight-line estimates work today.

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points in kilometres (Haversine). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Estimated delivery time in minutes from a straight-line distance.
 * Adds prep time and assumes an average urban speed, then applies a
 * detour factor (roads are not straight lines).
 */
export function estimateEtaMinutes(
  distanceKm: number,
  opts: { prepMinutes?: number; avgSpeedKmh?: number; detourFactor?: number } = {}
): number {
  const prep = opts.prepMinutes ?? 5;
  const speed = opts.avgSpeedKmh ?? 18;
  const detour = opts.detourFactor ?? 1.3;
  const travel = (distanceKm * detour) / speed * 60;
  return Math.round(prep + travel);
}

export interface DriverLoad {
  id: string;
  activeOrders: number;
  location?: LatLng;
}

/**
 * Pick the best driver for an order.
 *  - If driver locations are known, prefer the nearest among the least-loaded.
 *  - Otherwise fall back to pure load balancing (fewest active orders).
 * Returns null when there are no drivers.
 */
export function pickDriver(drivers: DriverLoad[], destination?: LatLng): string | null {
  if (drivers.length === 0) return null;

  const minLoad = Math.min(...drivers.map((d) => d.activeOrders));
  const leastLoaded = drivers.filter((d) => d.activeOrders === minLoad);

  if (destination && leastLoaded.some((d) => d.location)) {
    const ranked = [...leastLoaded].sort((a, b) => {
      const da = a.location ? haversineKm(a.location, destination) : Infinity;
      const db = b.location ? haversineKm(b.location, destination) : Infinity;
      return da - db;
    });
    return ranked[0].id;
  }

  return leastLoaded[0].id;
}
