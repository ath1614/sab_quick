import ManagerPanel from "@/components/manager/ManagerPanel";
import RoleGuard from "@/components/layout/RoleGuard";
export default function Manager() {
  return (
    <RoleGuard allow={["manager", "owner", "admin"]}>
      <ManagerPanel />
    </RoleGuard>
  );
}
