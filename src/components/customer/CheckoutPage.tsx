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
  const [address, setAddress] = useState({
    line1: "",
    landmark: "",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001"
  });
  const [payMethod, setPayMethod] = useState("upi");
  const [placing, setPlacing] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuthStore();
  const { items, total, clearCart } = useCartStore();
  const router = useRouter();

  // Reverse geocoding to get real address text from GPS coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Use OpenStreetMap Nominatim API for free reverse geocoding
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data.address) {
        const addr = data.address;
        const line1 = [
          addr.house_number, addr.road, addr.suburb, addr.neighbourhood
        ].filter(Boolean).join(", ");
        
        setAddress({
          line1: line1 || "📍 My Current Location",
          landmark: addr.landmark || addr.poi || "",
          city: addr.city || addr.town || addr.district || "Mumbai",
          state: addr.state || "Maharashtra",
          pincode: addr.postcode || "400001"
        });
      }
    } catch (e) {
      // Fallback if API fails
    }
  };

  // Fetch GPS location and reverse geocode
  const getLocation = () => {
    if (!navigator.geolocation) return;
    
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await reverseGeocode(position.coords.latitude, position.coords.longitude);
        setFetchingLocation(false);
      },
      () => {
        setFetchingLocation(false);
      }
    );
  };

  useEffect(() => {
    // Auto-fetch location on page load
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
        address: {
          line1: `${address.line1}${address.landmark ? `, ${address.landmark}` : ''}`,
          city: address.city,
          pincode: address.pincode
        },
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
          {/* Step 0 — Address (Zepto/Blinkit Style) */}
          {step === 0 && (
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
              {/* Primary Location Button (Like Zepto) */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={getLocation}
                className="w-full bg-white rounded-3xl p-4 shadow-card flex items-center gap-3 border-2 border-brand-green/30 mb-2"
              >
                <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center">
                  {fetchingLocation ? (
                    <Loader2 size={22} className="animate-spin text-brand-green" />
                  ) : (
                    <LocateFixed size={22} className="text-brand-green" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-black text-brand-black text-base">
                    {fetchingLocation ? "Fetching your address..." : "Use My Current Location"}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {fetchingLocation ? "Please wait..." : "GPS will auto-detect and fill your address"}
                  </p>
                </div>
                <ArrowRight size={20} className="text-gray-300" />
              </motion.button>

              {/* Address Form */}
              <div className="bg-white rounded-3xl p-4 shadow-card space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={18} className="text-brand-green" />
                  <h3 className="font-black text-lg text-brand-black">Enter Complete Address</h3>
                </div>

                <div className="space-y-3">
                  {/* House/Flat/Street */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">House / Flat No. & Street</label>
                    <input
                      value={address.line1}
                      onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                      placeholder="A-101, Green Avenue, Main Road"
                      className="w-full px-4 py-3.5 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                    />
                  </div>

                  {/* Landmark */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Landmark (Optional)</label>
                    <input
                      value={address.landmark}
                      onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                      placeholder="Near Pizza Hut, Opp. Park"
                      className="w-full px-4 py-3.5 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                    />
                  </div>

                  {/* City & State Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">City</label>
                      <input
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        placeholder="Mumbai"
                        className="w-full px-4 py-3.5 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">State</label>
                      <input
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        placeholder="Maharashtra"
                        className="w-full px-4 py-3.5 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                      />
                    </div>
                  </div>

                  {/* PIN Code */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">PIN Code</label>
                    <input
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                      placeholder="400001"
                      maxLength={6}
                      className="w-full px-4 py-3.5 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                    />
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(1)}
                className="w-full py-4 rounded-2xl bg-brand-green text-white font-black text-base shadow-green flex items-center justify-center gap-2">
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
