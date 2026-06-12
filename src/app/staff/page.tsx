import StaffPanel from "@/components/staff/StaffPanel";
import RoleGuard from "@/components/layout/RoleGuard";
export default function Staff() {
  return (
    <RoleGuard allow={["staff", "manager", "owner", "admin"]}>
      <StaffPanel />
    </RoleGuard>
  );
}
