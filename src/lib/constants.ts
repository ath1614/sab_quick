export const BRAND = {
  green: "#2CA01C",
  black: "#0D0D0D",
  white: "#FFFFFF",
  surface: "#F7F8F9",
  glow: "rgba(44,160,28,0.15)",
} as const;

export const ROLES = ["customer", "delivery", "staff", "manager", "owner", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const DEMO_ACCOUNTS: Record<string, { email: string; password: string; role: Role }> = {
  owner: { email: "owner@sab.com", password: "Password123", role: "owner" },
  manager: { email: "manager@sab.com", password: "Password123", role: "manager" },
  staff: { email: "staff@sab.com", password: "Password123", role: "staff" },
  delivery: { email: "delivery@sab.com", password: "Password123", role: "delivery" },
  customer: { email: "customer@sab.com", password: "Password123", role: "customer" },
};

export const ORDER_STATUSES = ["new", "accepted", "preparing", "packed", "out_for_delivery", "delivered", "rejected"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
