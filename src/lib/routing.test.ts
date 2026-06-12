import { describe, it, expect } from "vitest";
import { haversineKm, estimateEtaMinutes, pickDriver } from "@/lib/routing";

describe("haversineKm", () => {
  it("is ~0 for the same point", () => {
    expect(haversineKm({ lat: 19.07, lng: 72.87 }, { lat: 19.07, lng: 72.87 })).toBeCloseTo(0, 5);
  });
  it("approximates a known distance (Mumbai → Pune ~120km)", () => {
    const d = haversineKm({ lat: 19.076, lng: 72.8777 }, { lat: 18.5204, lng: 73.8567 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(130);
  });
});

describe("estimateEtaMinutes", () => {
  it("returns prep time for a zero-distance order", () => {
    expect(estimateEtaMinutes(0, { prepMinutes: 5 })).toBe(5);
  });
  it("grows with distance", () => {
    expect(estimateEtaMinutes(5)).toBeGreaterThan(estimateEtaMinutes(1));
  });
});

describe("pickDriver", () => {
  it("returns null with no drivers", () => {
    expect(pickDriver([])).toBeNull();
  });
  it("load-balances to the least-busy driver", () => {
    const id = pickDriver([
      { id: "a", activeOrders: 3 },
      { id: "b", activeOrders: 1 },
      { id: "c", activeOrders: 5 },
    ]);
    expect(id).toBe("b");
  });
  it("prefers nearest among the least-loaded when locations are known", () => {
    const dest = { lat: 19.0, lng: 72.8 };
    const id = pickDriver(
      [
        { id: "far", activeOrders: 1, location: { lat: 19.5, lng: 73.5 } },
        { id: "near", activeOrders: 1, location: { lat: 19.01, lng: 72.81 } },
        { id: "busy-near", activeOrders: 4, location: { lat: 19.0, lng: 72.8 } },
      ],
      dest
    );
    expect(id).toBe("near");
  });
});
