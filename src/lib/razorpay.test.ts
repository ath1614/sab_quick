import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import { verifyPaymentSignature, verifyWebhookSignature, razorpayConfigured } from "@/lib/razorpay";

describe("razorpay signature verification", () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_key";
    process.env.RAZORPAY_KEY_SECRET = "secret123";
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec";
  });

  it("accepts a correct payment signature", () => {
    const sig = crypto.createHmac("sha256", "secret123").update("order_1|pay_1").digest("hex");
    expect(verifyPaymentSignature("order_1", "pay_1", sig)).toBe(true);
  });

  it("rejects a tampered payment signature", () => {
    expect(verifyPaymentSignature("order_1", "pay_1", "deadbeef")).toBe(false);
  });

  it("accepts a correct webhook signature", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const sig = crypto.createHmac("sha256", "whsec").update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig)).toBe(true);
  });

  it("rejects a webhook signature for a different body", () => {
    const sig = crypto.createHmac("sha256", "whsec").update("{}").digest("hex");
    expect(verifyWebhookSignature('{"event":"x"}', sig)).toBe(false);
  });

  it("reports configured when keys present", () => {
    expect(razorpayConfigured()).toBe(true);
  });
});
