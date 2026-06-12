// Client-side Razorpay checkout integration.
/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function isOnlinePaymentEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export type PaymentResult = "paid" | "failed" | "dismissed";

/**
 * Creates a Razorpay order on the server, opens checkout, and verifies the
 * result. Resolves with the outcome. The order is already persisted (pending)
 * before this is called, so a dismissal/failure simply leaves it pending.
 */
export async function payWithRazorpay(opts: {
  appOrderId: string;
  customerName?: string;
  customerEmail?: string;
}): Promise<PaymentResult> {
  const res = await fetch("/api/payment/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: opts.appOrderId }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Payment init failed" }));
    throw new Error(error || "Payment init failed");
  }
  const { razorpayOrderId, amount, currency, keyId } = await res.json();

  const loaded = await loadRazorpayScript();
  if (!loaded) throw new Error("Could not load the payment gateway. Check your connection.");

  return new Promise<PaymentResult>((resolve) => {
    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      order_id: razorpayOrderId,
      name: "SAB QUICK",
      description: "Order payment",
      prefill: { name: opts.customerName, email: opts.customerEmail },
      theme: { color: "#2CA01C" },
      handler: async (resp: any) => {
        const v = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appOrderId: opts.appOrderId,
            razorpayOrderId,
            razorpayPaymentId: resp.razorpay_payment_id,
            signature: resp.razorpay_signature,
          }),
        });
        resolve(v.ok ? "paid" : "failed");
      },
      modal: { ondismiss: () => resolve("dismissed") },
    });
    rzp.on("payment.failed", () => resolve("failed"));
    rzp.open();
  });
}
