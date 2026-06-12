import OwnerDashboard from "@/components/owner/OwnerDashboard";
import RoleGuard from "@/components/layout/RoleGuard";
export default function Owner() {
  return (
    <RoleGuard allow={["owner", "admin"]}>
      <OwnerDashboard />
    </RoleGuard>
  );
}
