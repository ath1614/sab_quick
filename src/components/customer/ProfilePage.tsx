"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store";
import { useRouter } from "next/navigation";
import { Package, MapPin, LogOut, ChevronRight, User, Check, Trash2, Plus, Star } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import AppHeader from "@/components/layout/AppHeader";
import AuthGuard from "@/components/layout/AuthGuard";
import { useAddresses } from "@/hooks/useAddresses";

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuthStore();
  const router = useRouter();
  const { addresses, addAddress, removeAddress, setDefault } = useAddresses();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addr, setAddr] = useState({ label: "Home", line1: "", city: "", pincode: "" });

  const saveProfile = async () => {
    setSaving(true);
    const ok = await updateProfile({ name: name.trim(), phone: phone.trim() });
    setSaving(false);
    if (ok) setEditing(false);
  };

  const saveAddress = async () => {
    if (!addr.line1.trim() || !/^\d{6}$/.test(addr.pincode)) return;
    const ok = await addAddress(addr, addresses.length === 0);
    if (ok) {
      setAddr({ label: "Home", line1: "", city: "", pincode: "" });
      setShowAddrForm(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-brand-surface pb-28">
        <AppHeader title="Profile" />

        {/* Avatar + editable profile */}
        <div className="mx-4 mt-4 bg-white rounded-3xl p-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-green/10 border-2 border-brand-green/20 flex items-center justify-center flex-shrink-0">
              <User size={28} className="text-brand-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-brand-black text-lg truncate">{user?.name}</p>
              <p className="text-sm text-gray-400 truncate">{user?.email}</p>
              <span className="inline-block mt-1.5 bg-brand-green/10 text-brand-green text-xs font-bold px-2.5 py-0.5 rounded-lg capitalize">
                {user?.role}
              </span>
            </div>
            {!editing && (
              <button onClick={() => { setName(user?.name ?? ""); setPhone(user?.phone ?? ""); setEditing(true); }}
                className="text-xs font-bold text-brand-green px-3 py-1.5 rounded-xl bg-brand-green/10">
                Edit
              </button>
            )}
          </div>

          {editing && (
            <div className="mt-4 space-y-2.5">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
                className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel"
                className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20" />
              <div className="flex gap-2">
                <button onClick={saveProfile} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold disabled:opacity-60">
                  {saving ? "Saving..." : "Save"}
                </button>
                <button onClick={() => setEditing(false)}
                  className="flex-1 py-2.5 rounded-xl bg-brand-surface border border-gray-200 text-sm font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Saved addresses */}
        <div className="mx-4 mt-3 bg-white rounded-3xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-brand-green" />
              <h3 className="font-bold text-brand-black text-sm">Saved Addresses</h3>
            </div>
            <button onClick={() => setShowAddrForm((v) => !v)} className="text-xs font-bold text-brand-green flex items-center gap-1">
              <Plus size={13} /> Add
            </button>
          </div>

          {addresses.length === 0 && !showAddrForm && (
            <p className="text-xs text-gray-400 py-2">No saved addresses yet.</p>
          )}

          <div className="space-y-2">
            {addresses.map((a) => (
              <div key={a.id} className="bg-brand-surface rounded-2xl p-3 flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-brand-black text-sm">{a.label}</span>
                    {a.is_default && <span className="text-[10px] font-bold text-brand-green bg-brand-green/10 px-1.5 py-0.5 rounded">Default</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{a.line1}, {a.city} {a.pincode}</p>
                </div>
                {!a.is_default && (
                  <button onClick={() => setDefault(a.id)} aria-label="Set default" className="text-gray-300 hover:text-brand-green">
                    <Star size={15} />
                  </button>
                )}
                <button onClick={() => removeAddress(a.id)} aria-label="Delete address" className="text-gray-300 hover:text-red-400">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {showAddrForm && (
            <div className="mt-2 space-y-2">
              <input value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} placeholder="Label (Home, Office)"
                className="w-full px-3 py-2.5 rounded-xl bg-brand-surface text-sm focus:outline-none" />
              <input value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} placeholder="House / flat, street"
                className="w-full px-3 py-2.5 rounded-xl bg-brand-surface text-sm focus:outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} placeholder="City"
                  className="w-full px-3 py-2.5 rounded-xl bg-brand-surface text-sm focus:outline-none" />
                <input value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value })} placeholder="PIN" maxLength={6} inputMode="numeric"
                  className="w-full px-3 py-2.5 rounded-xl bg-brand-surface text-sm focus:outline-none" />
              </div>
              <button onClick={saveAddress}
                className="w-full py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold flex items-center justify-center gap-1">
                <Check size={14} /> Save Address
              </button>
            </div>
          )}
        </div>

        {/* My Orders */}
        <div className="px-4 mt-3 space-y-2">
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => router.push("/orders")}
            className="w-full bg-white rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-brand-surface flex items-center justify-center">
              <Package size={17} className="text-brand-green" />
            </div>
            <span className="flex-1 text-left font-semibold text-brand-black text-sm">My Orders</span>
            <ChevronRight size={15} className="text-gray-300" />
          </motion.button>

          <motion.button whileTap={{ scale: 0.97 }}
            aria-label="Log out" onClick={async () => { await logout(); router.replace("/auth"); }}
            className="w-full bg-red-50 border border-red-100 rounded-2xl px-4 py-4 flex items-center gap-3 mt-2">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <LogOut size={17} className="text-red-500" />
            </div>
            <span className="font-semibold text-red-500 text-sm">Sign Out</span>
          </motion.button>
        </div>

        <BottomNav />
      </div>
    </AuthGuard>
  );
}
