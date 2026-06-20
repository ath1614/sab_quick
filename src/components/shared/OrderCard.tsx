"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Check, X, Clock, MapPin, ArrowRight, User } from "lucide-react";
import { useBusinessStore } from "@/store";
import type { Order, Permission } from "@/types";
import { formatCurrency } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-50 text-blue-700",
  accepted: "bg-brand-green/10 text-brand-green",
  preparing: "bg-yellow-50 text-yellow-700",
  packed: "bg-purple-50 text-purple-700",
  out_for_delivery: "bg-orange-50 text-orange-700",
  delivered: "bg-gray-100 text-gray-600",
  rejected: "bg-red-50 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  new: "New", accepted: "Accepted", preparing: "Preparing",
  packed: "Packed", out_for_delivery: "Out for Delivery",
  delivered: "Delivered", rejected: "Rejected",
};

// What the next action is for each status
const NEXT_STATUS: Partial<Record<Order["status"], { label: string; next: Order["status"] }>> = {
  accepted: { label: "Start Preparing", next: "preparing" },
  preparing: { label: "Mark as Packed", next: "packed" },
  packed: { label: "Out for Delivery", next: "out_for_delivery" },
  out_for_delivery: { label: "Mark Delivered", next: "delivered" },
};

interface Props {
  order: Order;
  permissions: Permission[];
}

export default function OrderCard({ order, permissions }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [rejectOrderOpen, setRejectOrderOpen] = useState(false);
  const [rejectItemId, setRejectItemId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [now] = useState(() => Date.now());
  const { acceptOrder, rejectOrder, rejectOrderItem, updateOrderStatus, deliveryPartners, assignDeliveryPartner } = useBusinessStore();

  const canAccept = permissions.includes("accept_orders");
  const canRejectOrder = permissions.includes("reject_orders");
  const canRejectItem = permissions.includes("reject_items");
  const canManageStock = permissions.includes("manage_stock");

  const timeAgo = (iso: string) => {
    const mins = Math.floor((now - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const handleRejectOrder = () => {
    if (!reason.trim()) return;
    rejectOrder(order.id, reason);
    setRejectOrderOpen(false);
    setReason("");
  };

  const handleRejectItem = () => {
    if (!reason.trim() || !rejectItemId) return;
    rejectOrderItem(order.id, rejectItemId, reason);
    setRejectItemId(null);
    setReason("");
  };

  const isTerminal = ["delivered", "rejected", "cancelled"].includes(order.status);
  const nextAction = NEXT_STATUS[order.status];
  const assignedPartner = deliveryPartners.find(p => p.id === order.deliveryPartnerId);

  return (
    <motion.div layout className="bg-white rounded-3xl shadow-card overflow-hidden">
      {/* Header — always visible */}
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-brand-black text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${STATUS_STYLES[order.status]}`}>
                {STATUS_LABEL[order.status]}
              </span>
            </div>
            <p className="text-sm font-semibold text-brand-black mt-0.5">{order.customerName}</p>
            <p className="text-xs text-gray-400">{order.customerPhone}</p>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <p className="font-black text-brand-green">{formatCurrency(order.total)}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-0.5">
              <Clock size={10} /> {timeAgo(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 flex items-center gap-1 truncate flex-1 mr-2">
            <MapPin size={10} className="flex-shrink-0" /> {order.address.line1}, {order.address.city}
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
            {order.items.length} items
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
        {assignedPartner && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <User size={12} />
            <span>{assignedPartner.name}</span>
          </div>
        )}
      </div>

      {/* Expanded section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {/* Items list */}
            <div className="border-t border-gray-50 px-4 py-3 space-y-2.5">
              {order.items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.product.image} alt={item.product.name}
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-black truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-400">
                      x{item.quantity} · {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                    {item.status === "rejected" && (
                      <p className="text-xs text-red-500 font-medium mt-0.5">
                        Rejected: {item.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.status === "confirmed" && (
                      <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check size={10} className="text-green-600" />
                      </span>
                    )}
                    {item.status === "rejected" && (
                      <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                        <X size={10} className="text-red-500" />
                      </span>
                    )}
                    {item.status === "confirmed" && canRejectItem && ["new", "accepted", "preparing"].includes(order.status) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setRejectItemId(item.product.id); setReason(""); }}
                        className="text-xs text-red-500 font-semibold border border-red-200 px-2 py-0.5 rounded-lg"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Reject item form */}
            {rejectItemId && (
              <div className="px-4 pb-3">
                <div className="bg-red-50 rounded-2xl p-3">
                  <p className="text-xs font-bold text-red-600 mb-2">Reason for rejecting item</p>
                  <input value={reason} onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Out of stock, damaged..."
                    className="w-full text-sm px-3 py-2 rounded-xl bg-white border border-red-200 focus:outline-none mb-2" />
                  <div className="flex gap-2">
                    <button onClick={handleRejectItem}
                      className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold">
                      Confirm Reject
                    </button>
                    <button onClick={() => setRejectItemId(null)}
                      className="flex-1 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {!isTerminal && (
              <div className="px-4 pb-4 space-y-2">
                {/* Delivery partner assignment */}
                {(order.status === "packed" || order.status === "out_for_delivery") && (canAccept || canManageStock) && (
                  <div className="bg-brand-surface rounded-2xl p-3">
                    <p className="text-xs font-bold text-gray-600 mb-2">Assign Delivery Partner</p>
                    <select
                      value={order.deliveryPartnerId || ""}
                      onChange={(e) => assignDeliveryPartner(order.id, e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-xl bg-white border border-gray-200 focus:outline-none"
                    >
                      <option value="">Select partner</option>
                      {deliveryPartners.map(partner => (
                        <option key={partner.id} value={partner.id}>{partner.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2">
                  {/* Accept new order */}
                  {order.status === "new" && canAccept && (
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => acceptOrder(order.id)}
                      className="flex-1 py-3 rounded-2xl bg-brand-green text-white font-bold text-sm flex items-center justify-center gap-2 shadow-green">
                      <Check size={15} /> Accept Order
                    </motion.button>
                  )}

                  {/* Progress order through workflow */}
                  {nextAction && (canAccept || canManageStock) && (
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => updateOrderStatus(order.id, nextAction.next)}
                      className="flex-1 py-3 rounded-2xl bg-brand-black text-white font-bold text-sm flex items-center justify-center gap-2">
                      {nextAction.label} <ArrowRight size={14} />
                    </motion.button>
                  )}

                  {/* Reject — only before the order is packed/dispatched */}
                  {canRejectOrder && ["new", "accepted", "preparing"].includes(order.status) && (
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => { setRejectOrderOpen(true); setReason(""); }}
                      className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                      <X size={16} className="text-red-500" />
                    </motion.button>
                  )}
                </div>

                {/* Reject order form */}
                {rejectOrderOpen && (
                  <div className="bg-red-50 rounded-2xl p-3">
                    <p className="text-xs font-bold text-red-600 mb-2">Reason for rejecting order</p>
                    <input value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Store closed, items unavailable..."
                      className="w-full text-sm px-3 py-2 rounded-xl bg-white border border-red-200 focus:outline-none mb-2" />
                    <div className="flex gap-2">
                      <button onClick={handleRejectOrder}
                        className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold">
                        Confirm Reject
                      </button>
                      <button onClick={() => setRejectOrderOpen(false)}
                        className="flex-1 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
