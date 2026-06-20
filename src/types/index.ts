export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "customer" | "delivery" | "staff" | "manager" | "owner" | "admin";
  avatar?: string;
  permissions?: Permission[];
}

export type Permission =
  | "manage_staff"
  | "manage_products"
  | "manage_categories"
  | "view_orders"
  | "accept_orders"
  | "reject_orders"
  | "reject_items"
  | "manage_stock"
  | "view_analytics"
  | "manage_coupons";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
  image: string;
  category: string;
  unit: string;
  stock: number;
  eta: number;
  rating: number;
  reviews: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  productCount?: number;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  status: "pending" | "confirmed" | "rejected";
  rejectionReason?: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  status: "new" | "accepted" | "preparing" | "packed" | "out_for_delivery" | "delivered" | "rejected" | "cancelled";
  total: number;
  address: Address;
  createdAt: string;
  deliveryPartnerId?: string;
  eta?: number;
  rejectionReason?: string;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "staff" | "manager";
  permissions: Permission[];
  isActive: boolean;
  joinedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "flat";
  value: number;
  minOrder: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
}
