"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, useBusinessStore } from "@/store";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, Tag, Users, LogOut, Percent,
  DollarSign, ShoppingBag, Activity,
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, AlertTriangle
} from "lucide-react";
import OrderCard from "@/components/shared/OrderCard";
import ProductForm from "@/components/shared/ProductForm";
import { ALL_PERMISSIONS } from "@/lib/demo-data";
import type { Product, Category, StaffMember, Permission, Coupon } from "@/types";
import { formatCurrency } from "@/lib/utils";

type Tab = "dashboard" | "orders" | "products" | "categories" | "staff" | "coupons";

const OWNER_PERMISSIONS: Permission[] = [
  "view_orders","accept_orders","reject_orders","reject_items",
  "manage_stock","manage_products","manage_categories",
  "view_analytics","manage_staff","manage_coupons",
];

export default function OwnerDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const {
    products, categories, orders, staff, coupons,
    addProduct, updateProduct, updateStock,
    addCategory, updateCategory, deleteCategory,
    addStaffMember, updateStaffPermissions, toggleStaffActive,
    addCoupon, updateCoupon, deleteCoupon, toggleCouponActive,
  } = useBusinessStore();

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [newStaffPassword, setNewStaffPassword] = useState<{ email: string; password: string } | null>(null);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [stockEditing, setStockEditing] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState(0);

  const newOrders = orders.filter((o) => o.status === "new").length;
  const todayRevenue = orders.filter((o) => o.status !== "rejected" && o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const lowStock = products.filter((p) => p.stock < 15);

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "orders", label: "Orders", icon: ShoppingBag },
    { key: "products", label: "Products", icon: Package },
    { key: "categories", label: "Categories", icon: Tag },
    { key: "staff", label: "Staff", icon: Users },
    { key: "coupons", label: "Coupons", icon: Percent },
  ];

  return (
    <div className="min-h-screen bg-brand-surface safe-top">
      {/* New-staff credentials — shown once; the only copy of the temp password */}
      {newStaffPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-card">
            <h3 className="font-black text-brand-black text-lg">Staff account created</h3>
            <p className="text-sm text-gray-500 mt-1">Share these credentials — the password is shown only once.</p>
            <div className="mt-4 bg-brand-surface rounded-2xl p-4 space-y-2">
              <div><p className="text-xs text-gray-400">Email</p><p className="font-bold text-brand-black text-sm break-all">{newStaffPassword.email}</p></div>
              <div><p className="text-xs text-gray-400">Temporary password</p><p className="font-mono font-bold text-brand-black">{newStaffPassword.password}</p></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => navigator.clipboard?.writeText(`${newStaffPassword.email} / ${newStaffPassword.password}`)}
                className="flex-1 py-3 rounded-2xl bg-brand-surface border border-gray-200 font-bold text-sm">Copy</button>
              <button onClick={() => setNewStaffPassword(null)}
                className="flex-1 py-3 rounded-2xl bg-brand-green text-white font-bold text-sm">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-3 flex items-center justify-between border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Owner</p>
          <h1 className="text-xl font-black text-brand-black">{user?.name}</h1>
        </div>
        <button aria-label="Log out" onClick={async () => { await logout(); router.replace("/auth"); }}
          className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center">
          <LogOut size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 flex overflow-x-auto scrollbar-hide px-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              tab === key ? "border-brand-green text-brand-green" : "border-transparent text-gray-400"
            }`}>
            <Icon size={14} /> {label}
            {key === "orders" && newOrders > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand-green text-white text-[9px] font-black flex items-center justify-center">{newOrders}</span>
            )}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 pb-10 space-y-4">

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Revenue", value: formatCurrency(todayRevenue), icon: DollarSign, sub: `${orders.length} orders` },
                { label: "New Orders", value: newOrders, icon: ShoppingBag, sub: "Pending action" },
                { label: "Products", value: products.filter(p => p.isActive).length, icon: Package, sub: `${lowStock.length} low stock` },
                { label: "Staff", value: staff.filter(s => s.isActive).length, icon: Users, sub: "Active members" },
              ].map(({ label, value, icon: Icon, sub }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-white rounded-3xl p-4 shadow-card">
                  <Icon size={18} className="text-brand-green mb-2" />
                  <p className="font-black text-xl text-brand-black">{value}</p>
                  <p className="text-xs font-semibold text-gray-500">{label}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </motion.div>
              ))}
            </div>

            {lowStock.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-red-500" />
                  <p className="text-sm font-bold text-red-600">Low Stock Alert</p>
                </div>
                {lowStock.map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-red-100 last:border-0">
                    <span className="text-sm text-brand-black font-medium">{p.name}</span>
                    <span className="text-sm font-black text-red-500">{p.stock} left</span>
                  </div>
                ))}
              </div>
            )}

            {/* Health bars */}
            <div className="bg-white rounded-3xl p-4 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} className="text-brand-green" />
                <h3 className="font-bold text-brand-black text-sm">Store Health</h3>
              </div>
              {[
                { label: "Inventory Health", score: Math.round((products.filter(p => p.stock > 15).length / Math.max(products.length, 1)) * 100) },
                { label: "Order Acceptance", score: Math.round((orders.filter(o => o.status !== "rejected").length / Math.max(orders.length, 1)) * 100) },
                { label: "Active Products", score: Math.round((products.filter(p => p.isActive).length / Math.max(products.length, 1)) * 100) },
              ].map(({ label, score }) => (
                <div key={label} className="mb-3 last:mb-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 font-medium">{label}</span>
                    <span className="font-bold text-brand-black">{score}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-brand-green rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1 }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── ORDERS ── */}
        {tab === "orders" && (
          <>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {["all","new","accepted","preparing","delivered","rejected"].map((s) => (
                <button key={s} onClick={() => setOrderFilter(s)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all capitalize ${
                    orderFilter === s
                      ? "bg-brand-black text-white border-brand-black"
                      : "bg-white border-gray-100 text-gray-500"
                  }`}>
                  {s === "all" ? "All" : s.replace(/_/g, " ")}
                  {s !== "all" && (
                    <span className="ml-1 opacity-60">
                      ({orders.filter(o => o.status === s).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
            {(() => {
              const filtered = orderFilter === "all" ? orders : orders.filter(o => o.status === orderFilter);
              return filtered.length === 0
                ? <div className="text-center py-16 text-gray-400 font-medium">No orders</div>
                : <div className="space-y-3">{filtered.map((order) => (
                    <OrderCard key={order.id} order={order} permissions={OWNER_PERMISSIONS} />
                  ))}</div>;
            })()}
          </>
        )}

        {/* ── PRODUCTS ── */}
        {tab === "products" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-500">{products.length} products</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
                className="flex items-center gap-1.5 bg-brand-green text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-green">
                <Plus size={14} /> Add Product
              </motion.button>
            </div>

            <AnimatePresence>
              {showProductForm && (
                <ProductForm
                  categories={categories}
                  initial={editingProduct ?? undefined}
                  onSave={(data) => {
                    if (editingProduct) updateProduct(editingProduct.id, data);
                    else addProduct(data);
                    setShowProductForm(false);
                    setEditingProduct(null);
                  }}
                  onCancel={() => { setShowProductForm(false); setEditingProduct(null); }}
                />
              )}
            </AnimatePresence>

            <div className="space-y-2">
              {products.map((product) => {
                const cat = categories.find((c) => c.id === product.category);
                return (
                  <div key={product.id} className="bg-white rounded-2xl p-3 shadow-card flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.image} alt={product.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-brand-black text-sm truncate">{product.name}</p>
                        {!product.isActive && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Inactive</span>}
                      </div>
                      <p className="text-xs text-gray-400">{cat?.name} · {product.unit}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold text-brand-green">{formatCurrency(product.price)}</span>
                        {stockEditing === product.id ? (
                          <div className="flex items-center gap-1">
                            <input type="number" value={stockValue} onChange={(e) => setStockValue(+e.target.value)}
                              className="w-14 text-xs px-2 py-1 rounded-lg bg-brand-surface border border-gray-200 focus:outline-none" />
                            <button onClick={() => { updateStock(product.id, stockValue); setStockEditing(null); }}
                              className="text-xs text-brand-green font-bold">Save</button>
                          </div>
                        ) : (
                          <button onClick={() => { setStockEditing(product.id); setStockValue(product.stock); }}
                            className={`text-xs font-semibold ${product.stock < 15 ? "text-red-500" : "text-gray-500"}`}>
                            Stock: {product.stock}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button onClick={() => { setEditingProduct(product); setShowProductForm(true); }}
                        className="w-8 h-8 rounded-xl bg-brand-surface flex items-center justify-center">
                        <Pencil size={13} className="text-gray-500" />
                      </button>
                      <button onClick={() => updateProduct(product.id, { isActive: !product.isActive })}
                        className="w-8 h-8 rounded-xl bg-brand-surface flex items-center justify-center">
                        {product.isActive
                          ? <ToggleRight size={16} className="text-brand-green" />
                          : <ToggleLeft size={16} className="text-gray-400" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── CATEGORIES ── */}
        {tab === "categories" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-500">{categories.length} categories</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditingCategory(null); setCategoryName(""); setShowCategoryForm(true); }}
                className="flex items-center gap-1.5 bg-brand-green text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-green">
                <Plus size={14} /> Add Category
              </motion.button>
            </div>

            <AnimatePresence>
              {showCategoryForm && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl p-4 shadow-card">
                  <p className="text-sm font-bold text-brand-black mb-3">{editingCategory ? "Edit Category" : "New Category"}</p>
                  <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Category name" className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none mb-3" />
                  <div className="flex gap-2">
                    <button onClick={() => {
                      if (!categoryName.trim()) return;
                      if (editingCategory) updateCategory(editingCategory.id, { name: categoryName, slug: categoryName.toLowerCase().replace(/\s+/g, "-") });
                      else addCategory({ name: categoryName, slug: categoryName.toLowerCase().replace(/\s+/g, "-") });
                      setShowCategoryForm(false); setCategoryName("");
                    }} className="flex-1 py-3 rounded-xl bg-brand-green text-white font-bold text-sm">Save</button>
                    <button onClick={() => setShowCategoryForm(false)} className="flex-1 py-3 rounded-xl bg-brand-surface text-gray-500 font-semibold text-sm">Cancel</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat.id).length;
                return (
                  <div key={cat.id} className="bg-white rounded-2xl p-4 shadow-card flex items-center justify-between">
                    <div>
                      <p className="font-bold text-brand-black text-sm">{cat.name}</p>
                      <p className="text-xs text-gray-400">{count} products</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingCategory(cat); setCategoryName(cat.name); setShowCategoryForm(true); }}
                        className="w-8 h-8 rounded-xl bg-brand-surface flex items-center justify-center">
                        <Pencil size={13} className="text-gray-500" />
                      </button>
                      <button onClick={() => deleteCategory(cat.id)}
                        className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── STAFF ── */}
        {tab === "staff" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-500">{staff.length} members</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditingStaff(null); setShowStaffForm(true); }}
                className="flex items-center gap-1.5 bg-brand-green text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-green">
                <Plus size={14} /> Add Member
              </motion.button>
            </div>

            <AnimatePresence>
              {showStaffForm && (
                <StaffForm
                  initial={editingStaff}
                  onSave={async (data) => {
                    if (editingStaff) {
                      await updateStaffPermissions(editingStaff.id, data.permissions);
                    } else {
                      const pw = await addStaffMember(data);
                      if (pw) setNewStaffPassword({ email: data.email, password: pw });
                    }
                    setShowStaffForm(false);
                    setEditingStaff(null);
                  }}
                  onCancel={() => { setShowStaffForm(false); setEditingStaff(null); }}
                />
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {staff.map((member) => (
                <div key={member.id} className="bg-white rounded-2xl p-4 shadow-card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-brand-black text-sm">{member.name}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg capitalize ${member.role === "manager" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                          {member.role}
                        </span>
                        {!member.isActive && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Inactive</span>}
                      </div>
                      <p className="text-xs text-gray-400">{member.email}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setEditingStaff(member); setShowStaffForm(true); }}
                        className="w-8 h-8 rounded-xl bg-brand-surface flex items-center justify-center">
                        <Pencil size={13} className="text-gray-500" />
                      </button>
                      <button onClick={() => toggleStaffActive(member.id)}
                        className="w-8 h-8 rounded-xl bg-brand-surface flex items-center justify-center">
                        {member.isActive ? <ToggleRight size={16} className="text-brand-green" /> : <ToggleLeft size={16} className="text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {member.permissions.map((p) => {
                      const perm = ALL_PERMISSIONS.find((x) => x.key === p);
                      return (
                        <span key={p} className="text-xs bg-brand-green/10 text-brand-green font-semibold px-2 py-0.5 rounded-lg">
                          {perm?.label ?? p}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── COUPONS ── */}
        {tab === "coupons" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-500">{coupons.length} coupons</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditingCoupon(null); setShowCouponForm(true); }}
                className="flex items-center gap-1.5 bg-brand-green text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-green">
                <Plus size={14} /> Add Coupon
              </motion.button>
            </div>

            <AnimatePresence>
              {showCouponForm && (
                <CouponForm
                  initial={editingCoupon}
                  onSave={async (data) => {
                    if (editingCoupon) {
                      await updateCoupon(editingCoupon.id, data);
                    } else {
                      await addCoupon(data);
                    }
                    setShowCouponForm(false);
                    setEditingCoupon(null);
                  }}
                  onCancel={() => { setShowCouponForm(false); setEditingCoupon(null); }}
                />
              )}
            </AnimatePresence>

            <div className="space-y-2">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="bg-white rounded-2xl p-4 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-brand-black bg-brand-green/10 px-3 py-1 rounded-xl">
                        {coupon.code}
                      </span>
                      {!coupon.isActive && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Inactive</span>}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setEditingCoupon(coupon); setShowCouponForm(true); }}
                        className="w-8 h-8 rounded-xl bg-brand-surface flex items-center justify-center">
                        <Pencil size={13} className="text-gray-500" />
                      </button>
                      <button onClick={() => toggleCouponActive(coupon.id)}
                        className="w-8 h-8 rounded-xl bg-brand-surface flex items-center justify-center">
                        {coupon.isActive ? <ToggleRight size={16} className="text-brand-green" /> : <ToggleLeft size={16} className="text-gray-400" />}
                      </button>
                      <button onClick={() => deleteCoupon(coupon.id)}
                        className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-bold ${coupon.type === "percent" ? "text-brand-green" : "text-blue-600"}`}>
                      {coupon.type === "percent" ? `${coupon.value}% OFF` : `${formatCurrency(coupon.value)} OFF`}
                    </span>
                    {coupon.minOrder > 0 && <span className="text-xs text-gray-500">Min. {formatCurrency(coupon.minOrder)}</span>}
                    {coupon.maxDiscount && <span className="text-xs text-gray-500">Max. {formatCurrency(coupon.maxDiscount)}</span>}
                  </div>
                  {coupon.usageLimit && (
                    <p className="text-xs text-gray-400 mt-1">
                      {coupon.usedCount}/{coupon.usageLimit} used
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Inline Coupon Form ─────────────────────────────────────────────────────────
function CouponForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Coupon | null;
  onSave: (data: Omit<Coupon, "id" | "usedCount" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [type, setType] = useState<"percent" | "flat">(initial?.type ?? "percent");
  const [value, setValue] = useState(initial?.value ?? 10);
  const [minOrder, setMinOrder] = useState(initial?.minOrder ?? 0);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(initial?.maxDiscount);
  const [usageLimit, setUsageLimit] = useState<number | undefined>(initial?.usageLimit);
  const [validFrom, setValidFrom] = useState(initial?.validFrom ?? new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState<string | undefined>(initial?.validUntil);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="bg-white rounded-2xl p-4 shadow-card space-y-3">
      <p className="font-bold text-brand-black text-sm">{initial ? "Edit Coupon" : "New Coupon"}</p>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Coupon code (e.g. SAVE10)"
        className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none"
      />

      <div className="flex gap-2">
        <button
          onClick={() => setType("percent")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${type === "percent" ? "bg-brand-green text-white" : "bg-brand-surface text-gray-500"}`}
        >
          % Off
        </button>
        <button
          onClick={() => setType("flat")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${type === "flat" ? "bg-brand-green text-white" : "bg-brand-surface text-gray-500"}`}
        >
          Fixed Off
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 font-semibold mb-1 block">Discount Value</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(+e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-semibold mb-1 block">Min. Order</label>
          <input
            type="number"
            value={minOrder}
            onChange={(e) => setMinOrder(+e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 font-semibold mb-1 block">Max. Discount</label>
          <input
            type="number"
            value={maxDiscount ?? ""}
            onChange={(e) => setMaxDiscount(e.target.value ? +e.target.value : undefined)}
            placeholder="Optional"
            className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-semibold mb-1 block">Usage Limit</label>
          <input
            type="number"
            value={usageLimit ?? ""}
            onChange={(e) => setUsageLimit(e.target.value ? +e.target.value : undefined)}
            placeholder="Optional"
            className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 font-semibold mb-1 block">Valid From</label>
          <input
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-semibold mb-1 block">Valid Until</label>
          <input
            type="date"
            value={validUntil ?? ""}
            onChange={(e) => setValidUntil(e.target.value || undefined)}
            placeholder="Optional"
            className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave({
            code,
            type,
            value,
            minOrder,
            maxDiscount,
            usageLimit,
            validFrom,
            validUntil,
            isActive: initial?.isActive ?? true,
          })}
          className="flex-1 py-3 rounded-xl bg-brand-green text-white font-bold text-sm"
        >
          Save Coupon
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-brand-surface text-gray-500 font-semibold text-sm"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

// ── Inline Staff Form ─────────────────────────────────────────────────────────
function StaffForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: StaffMember | null;
  onSave: (data: Omit<StaffMember, "id" | "joinedAt">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [role, setRole] = useState<"staff" | "manager">(initial?.role ?? "staff");
  const [perms, setPerms] = useState<Permission[]>(initial?.permissions ?? []);

  const toggle = (p: Permission) =>
    setPerms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="bg-white rounded-2xl p-4 shadow-card space-y-3">
      <p className="font-bold text-brand-black text-sm">{initial ? "Edit Permissions" : "Add Staff Member"}</p>

      {!initial && (
        <>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
            className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone"
            className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none" />
          <div className="flex gap-2">
            {(["staff", "manager"] as const).map((r) => (
              <button key={r} onClick={() => setRole(r)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${role === r ? "bg-brand-green text-white" : "bg-brand-surface text-gray-500"}`}>
                {r}
              </button>
            ))}
          </div>
        </>
      )}

      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Permissions</p>
        <div className="space-y-2">
          {ALL_PERMISSIONS.map(({ key, label, description }) => (
            <button key={key} onClick={() => toggle(key)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${perms.includes(key) ? "border-brand-green bg-brand-green/5" : "border-gray-100 bg-brand-surface"}`}>
              <div>
                <p className="text-sm font-semibold text-brand-black">{label}</p>
                <p className="text-xs text-gray-400">{description}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-2 ${perms.includes(key) ? "border-brand-green bg-brand-green" : "border-gray-300"}`}>
                {perms.includes(key) && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave({ name, email, phone, role, permissions: perms, isActive: true })}
          className="flex-1 py-3 rounded-xl bg-brand-green text-white font-bold text-sm">Save</button>
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-brand-surface text-gray-500 font-semibold text-sm">Cancel</button>
      </div>
    </motion.div>
  );
}
