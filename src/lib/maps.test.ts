import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("geocodeSearch", () => {
  it("returns [] when no token is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "");
    const { geocodeSearch } = await import("@/lib/maps");
    expect(await geocodeSearch("anything")).toEqual([]);
  });

  it("returns [] for short queries", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "tok");
    const { geocodeSearch } = await import("@/lib/maps");
    expect(await geocodeSearch("ab")).toEqual([]);
  });

  it("parses Mapbox features when configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "tok");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          features: [
            {
              place_name: "Andheri West, Mumbai",
              center: [72.83, 19.13],
              context: [
                { id: "place.1", text: "Mumbai" },
                { id: "postcode.1", text: "400053" },
              ],
            },
          ],
        }),
      })
    );
    const { geocodeSearch } = await import("@/lib/maps");
    const out = await geocodeSearch("andheri");
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ city: "Mumbai", pincode: "400053", lat: 19.13, lng: 72.83 });
  });
});
