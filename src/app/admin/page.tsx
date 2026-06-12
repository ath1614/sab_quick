import AdminPanel from "@/components/admin/AdminPanel";
import RoleGuard from "@/components/layout/RoleGuard";
export default function Admin() {
  return (
    <RoleGuard allow={["admin"]}>
      <AdminPanel />
    </RoleGuard>
  );
}
