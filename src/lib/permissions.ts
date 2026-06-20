import type { Permission } from "@/types";

// Sensible default permissions per role. Used when a user's stored permissions
// array is empty/unset, so a freshly-created manager/staff isn't left unable to
// act (which previously stranded orders). An owner can still narrow these by
// explicitly setting a non-empty permissions array on the user.
export const ROLE_DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  staff: ["view_orders", "accept_orders", "reject_orders", "reject_items", "manage_stock"],
  manager: [
    "view_orders", "accept_orders", "reject_orders", "reject_items",
    "manage_stock", "manage_products", "manage_categories",
    "view_analytics", "manage_coupons", "manage_staff",
  ],
  owner: [
    "view_orders", "accept_orders", "reject_orders", "reject_items",
    "manage_stock", "manage_products", "manage_categories",
    "view_analytics", "manage_coupons", "manage_staff",
  ],
  admin: [
    "view_orders", "accept_orders", "reject_orders", "reject_items",
    "manage_stock", "manage_products", "manage_categories",
    "view_analytics", "manage_coupons", "manage_staff",
  ],
};

/**
 * Resolve the effective permission set for a user. Priority:
 *   explicit staff-record permissions > the auth user's permissions > role defaults.
 * An empty array is treated as "unset" so defaults apply.
 */
export function resolvePermissions(
  role: string | undefined,
  recordPerms?: Permission[] | null,
  userPerms?: Permission[] | null
): Permission[] {
  if (recordPerms && recordPerms.length) return recordPerms;
  if (userPerms && userPerms.length) return userPerms;
  return ROLE_DEFAULT_PERMISSIONS[role ?? ""] ?? ["view_orders"];
}
