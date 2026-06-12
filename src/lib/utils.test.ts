import { describe, it, expect } from "vitest";
import { formatCurrency, formatETA, cn } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats INR with no decimals", () => {
    expect(formatCurrency(1000)).toBe("₹1,000");
    expect(formatCurrency(0)).toBe("₹0");
  });
});

describe("formatETA", () => {
  it("renders minutes under an hour", () => {
    expect(formatETA(10)).toBe("10 mins");
  });
  it("renders hours and minutes over an hour", () => {
    expect(formatETA(90)).toBe("1h 30m");
  });
});

describe("cn", () => {
  it("merges and dedupes tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe("text-sm font-bold");
  });
});
