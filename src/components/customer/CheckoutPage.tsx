"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCartStore, useAuthStore } from "@/store";
import { formatCurrency } from "@/lib/utils";
import { MapPin, CreditCard, CheckCircle, ArrowRight, LocateFixed, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import AuthGuard from "@/components/layout/AuthGuard";
import { createOrder } from "@/lib/orders";

const STEPS = ["Address", "Payment", "Confirm"];

const PAY_METHODS = [
  { id: "upi", label: "UPI / PhonePe / GPay", icon: CreditCard },
  { id: "card", label: "Credit / Debit Card", icon: CreditCard },
  { id: "cod", label: "Cash on Delivery", icon: CreditCard },
];

export default function CheckoutPage() {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({ line1: "", city: "Mumbai", pincode: "400001" });
  const [payMethod, setPayMethod] = useState("upi");
  const [placing, setPlacing] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuthStore();
  const { items, total, clearCart } = useCartStore();
  const router = useRouter();

  // Try to fetch user's current location on mount
  useEffect(() => {
    const getLocation = async () => {
      if (!navigator.geolocation) return;
      
      setFetchingLocation(true);
      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // For now, we use the lat/lng to show a "Current Location" label
            // In a real app, you'd reverse geocode to get city/pincode
            setAddress(prev => ({
              ...prev,
              line1: `📍 Near Current Location (${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)})`
            }));
            setFetchingLocation(false);
          },
          () => {
            // If user denies or fails, just leave as default
            setFetchingLocation(false);
          }
        );
      } catch (e) {
        setFetchingLocation(false);
      }
    };

    getLocation();
  }, []);

  const placeOrder = async () => {
    setPlacing(true);
    setError("");
    try {
      const order = await createOrder({
        items,
        total: total(),
        paymentMethod: payMethod,
        address,
        userId: user?.id,
      });
      clearCart();
      router.push(`/orders/track?id=${order.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-brand-surface pb-10">
        <AppHeader title="Checkout" back backHref="/cart" subtitle={`Step ${step + 1} of ${STEPS.length}`} />

        {/* Step indicator */}
        <div className="flex items-center px-5 py-3 bg-white border-b border-gray-100">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                i < step ? "bg-brand-green text-white" : i === step ? "bg-brand-black text-white" : "bg-gray-100 text-gray-400"
              }`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-semibold ml-1.5 ${i === step ? "text-brand-black" : "text-gray-400"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-100 mx-2" />}
            </div>
          ))}
        </div>

        <div className="px-4 mt-4 space-y-3">
          {/* Step 0 — Address (Improved UX like Blinkit/Zomato) */}
          {step === 0 && (
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
              <div className="bg-white rounded-3xl p-4 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={18} className="text-brand-green" />
                  <h3 className="font-black text-lg text-brand-black">Delivery Address</h3>
                </div>

                {/* Big Current Location Button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    // Re-trigger location fetch
                    setFetchingLocation(true);
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setAddress(prev => ({
                          ...prev,
                          line1: `📍 Near Current Location (${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)})`
                        }));
                        setFetchingLocation(false);
                      },
                      () => {
                        setFetchingLocation(false);
                      }
                    );
                  }}
                  className="w-full py-4 rounded-2xl bg-brand-green/10 border-2 border-brand-green/30 flex items-center justify-center gap-2 mb-3 hover:bg-brand-green/20 transition-all"
                >
                  {fetchingLocation ? (
                    <><Loader2 size={20} className="animate-spin text-brand-green" /> Fetching your location...</>
                  ) : (
                    <><LocateFixed size={20} className="text-brand-green" /> <span className="font-bold text-brand-green">Use My Current Location</span></>
                  )}
                </motion.button>

                {/* Manual Address Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Enter Address Details</label>
                  <input
                    value={address.line1}
                    onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                    placeholder="House / Flat No., Street, Area, Landmark"
                    className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1">City</label>
                      <input
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        placeholder="City"
                        className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1">PIN</label>
                      <input
                        value={address.pincode}
                        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                        placeholder="400001"
                        className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(1)}
                className="w-full py-4 rounded-2xl bg-brand-green text-white font-bold shadow-green flex items-center justify-center gap-2">
                Continue to Payment <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          )}

          {/* Step 1 — Payment */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
              <div className="bg-white rounded-3xl p-4 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={16} className="text-brand-green" />
                  <h3 className="font-bold text-brand-black">Payment Method</h3>
                </div>
                {PAY_METHODS.map(({ id, label }) => (
                  <button key={id} onClick={() => setPayMethod(id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl mb-2 border-2 transition-all ${payMethod === id ? "border-brand-green bg-brand-green/5" : "border-gray-100 bg-brand-surface"}`}>
                    <span className="font-semibold text-sm text-brand-black">{label}</span>
                    {payMethod === id && <CheckCircle size={16} className="text-brand-green" />}
                  </button>
                ))}
              </div>

              {/* Order summary */}
              <div className="bg-white rounded-3xl p-4 shadow-card">
                <h3 className="font-bold text-brand-black mb-3">Order Summary</h3>
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-600 truncate flex-1 mr-2">{product.name} × {quantity}</span>
                    <span className="font-semibold text-brand-black flex-shrink-0">{formatCurrency(product.price * quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 mt-1">
                  <span className="font-bold text-brand-black">Total</span>
                  <span className="font-black text-brand-green text-lg">{formatCurrency(total())}</span>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 py-4 rounded-2xl bg-brand-surface text-brand-black font-bold border border-gray-200">
                  Back
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={placeOrder}
                  disabled={placing}
                  className="flex-[2] py-4 rounded-2xl bg-brand-green text-white font-bold shadow-green disabled:opacity-60 flex items-center justify-center gap-2">
                  {placing ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Placing...</>
                  ) : (
                    <>Place Order · {formatCurrency(total())}</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
