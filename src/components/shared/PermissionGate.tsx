"use client";
import type { Permission } from "@/types";

interface Props {
  userPermissions: Permission[];
  required: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PermissionGate({ userPermissions, required, children, fallback = null }: Props) {
  if (!userPermissions.includes(required)) return <>{fallback}</>;
  return <>{children}</>;
}
