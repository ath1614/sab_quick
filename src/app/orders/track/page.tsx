import { Suspense } from "react";
import OrderTrackPage from "@/components/customer/OrderTrackPage";

export default function Track() {
  return (
    <Suspense fallback={null}>
      <OrderTrackPage />
    </Suspense>
  );
}
