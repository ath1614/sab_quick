"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useCartStore, useAuthStore, useLocationStore } from "@/store";
import { reverseGeocode as resolveAddress } from "@/lib/geo";
import { formatCurrency } from "@/lib/utils";
import { MapPin, CreditCard, CheckCircle, ArrowRight, LocateFixed, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import AuthGuard from "@/components/layout/AuthGuard";
import { createOrder } from "@/lib/orders";
import { payWithRazorpay, isOnlinePaymentEnabled } from "@/lib/payments-client";
import { deliveryFeeFor } from "@/lib/pricing";
import { geocodeSearch, mapsEnabled, type GeoSuggestion } from "@/lib/maps";

const STEPS = ["Address", "Payment"];

// Online methods only appear when Razorpay is configured; COD always works.
const ONLINE_ENABLED = isOnlinePaymentEnabled();
const PAY_METHODS = [
  ...(ONLINE_ENABLED
    ? [
        { id: "upi", label: "UPI / PhonePe / GPay", icon: CreditCard },
        { id: "card", label: "Credit / Debit Card", icon: CreditCard },
      ]
    : []),
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
  const [payMethod, setPayMethod] = useState(ONLINE_ENABLED ? "upi" : "cod");
  const [couponCode, setCouponCode] = useState("");
  const [placing, setPlacing] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [error, setError] = useState("");
  const [addrQuery, setAddrQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onAddrSearch = (q: string) => {
    setAddrQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSuggestions(await geocodeSearch(q));
    }, 300);
  };

  const setLocation = useLocationStore((s) => s.setLocation);

  const pickSuggestion = (s: GeoSuggestion) => {
    setAddress((a) => ({
      ...a,
      line1: s.line1 || s.label,
      city: s.city || a.city,
      state: s.state || a.state,
      pincode: s.pincode || a.pincode,
    }));
    setLocation({ label: s.city || s.line1, city: s.city, pincode: s.pincode });
    setAddrQuery("");
    setSuggestions([]);
  };
  const { user } = useAuthStore();
  const { items, total, clearCart } = useCartStore();
  const router = useRouter();

  const subtotal = total();
  const deliveryFee = deliveryFeeFor(subtotal);

  // Guard: never let an empty cart reach checkout.
  useEffect(() => {
    if (items.length === 0 && !placing) router.replace("/cart");
  }, [items.length, placing, router]);

  // Fetch GPS location, reverse-geocode it, and fill the address + location store.
  const getLocation = () => {
    if (!navigator.geolocation) return;

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const r = await resolveAddress(position.coords.latitude, position.coords.longitude);
        if (r) {
          setAddress((a) => ({
            ...a,
            line1: r.line1 || a.line1,
            city: r.city || a.city,
            state: r.state || a.state,
            pincode: r.pincode || a.pincode,
          }));
          setLocation({ label: r.city || r.line1, city: r.city, pincode: r.pincode });
        }
        setFetchingLocation(false);
      },
      () => {
        setFetchingLocation(false);
      }
    );
  };

  useEffect(() => {
    // Auto-fetch location on mount. Deferred to a microtask so the initial
    // setState happens after commit, not synchronously inside the effect.
    queueMicrotask(getLocation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placeOrder = async () => {
    if (!address.line1.trim()) {
      setError("Please enter your delivery address.");
      setStep(0);
      return;
    }
    if (!/^\d{6}$/.test(address.pincode)) {
      setError("Please enter a valid 6-digit PIN code.");
      setStep(0);
      return;
    }
    setPlacing(true);
    setError("");
    try {
      // total is computed server-side in place_order(); not trusted from here.
      const order = await createOrder({
        items,
        paymentMethod: payMethod,
        couponCode: couponCode.trim() || undefined,
        address: {
          line1: `${address.line1}${address.landmark ? `, ${address.landmark}` : ""}`,
          city: address.city,
          pincode: address.pincode,
        },
      });

      // Cash on Delivery — nothing more to collect now.
      if (payMethod === "cod") {
        clearCart();
        router.push(`/orders/track?id=${order.id}`);
        return;
      }

      // Online payment via Razorpay. The order is already saved (pending); a
      // dismissed/failed payment simply leaves it pending and retryable.
      const result = await payWithRazorpay({
        appOrderId: order.id,
        customerName: user?.name,
        customerEmail: user?.email,
      });
      if (result === "paid") {
        clearCart();
        router.push(`/orders/track?id=${order.id}`);
      } else if (result === "dismissed") {
        setError("Payment cancelled. Your order is saved as pending — retry from Orders.");
      } else {
        setError("Payment failed. Please try another method or retry from Orders.");
      }
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
              {/* Address autocomplete (only when Mapbox is configured) */}
              {mapsEnabled() && (
                <div className="relative">
                  <input
                    value={addrQuery}
                    onChange={(e) => onAddrSearch(e.target.value)}
                    placeholder="🔍 Search for your address"
                    className="w-full px-4 py-3.5 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => pickSuggestion(s)}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-brand-surface border-b border-gray-50 last:border-0"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

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

              {/* Coupon */}
              <div className="bg-white rounded-3xl p-4 shadow-card">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Coupon Code (Optional)</label>
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE10"
                  className="w-full px-4 py-3.5 rounded-xl bg-brand-surface text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                />
                <p className="text-xs text-gray-400 mt-1.5">Discount is verified and applied securely at checkout.</p>
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
                <div className="flex justify-between text-sm pt-2.5 text-gray-500">
                  <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 text-gray-500">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex justify-between pt-3 mt-1 border-t border-gray-100">
                  <span className="font-bold text-brand-black">Total{couponCode ? " (before coupon)" : ""}</span>
                  <span className="font-black text-brand-green text-lg">{formatCurrency(subtotal + deliveryFee)}</span>
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
                    <>Place Order · {formatCurrency(subtotal + deliveryFee)}</>
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
