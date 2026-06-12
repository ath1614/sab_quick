import DeliveryDashboard from "@/components/delivery/DeliveryDashboard";
import RoleGuard from "@/components/layout/RoleGuard";
export default function Delivery() {
  return (
    <RoleGuard allow={["delivery", "owner", "admin"]}>
      <DeliveryDashboard />
    </RoleGuard>
  );
}
