import type { Product, Category, Order, StaffMember, Permission } from "@/types";

export const DEMO_CATEGORIES: Category[] = [
  { id: "cat1", name: "Groceries", slug: "groceries", productCount: 2 },
  { id: "cat2", name: "Vegetables", slug: "vegetables", productCount: 2 },
  { id: "cat3", name: "Dairy", slug: "dairy", productCount: 2 },
  { id: "cat4", name: "Snacks", slug: "snacks", productCount: 1 },
  { id: "cat5", name: "Fruits", slug: "fruits", productCount: 1 },
  { id: "cat6", name: "Household", slug: "household", productCount: 1 },
];

export const DEMO_PRODUCTS: Product[] = [
  { id: "p1", name: "Fresh Tomatoes", description: "Farm fresh red tomatoes", price: 29, mrp: 40, image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400", category: "cat2", unit: "500g", stock: 50, eta: 10, rating: 4.5, reviews: 128, isActive: true },
  { id: "p2", name: "Amul Butter", description: "Pasteurised butter", price: 55, mrp: 60, image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400", category: "cat3", unit: "100g", stock: 30, eta: 10, rating: 4.8, reviews: 342, isActive: true },
  { id: "p3", name: "Lay's Classic", description: "American style cream & onion", price: 20, mrp: 20, image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400", category: "cat4", unit: "26g", stock: 100, eta: 10, rating: 4.3, reviews: 89, isActive: true },
  { id: "p4", name: "Bananas", description: "Ripe yellow bananas", price: 35, mrp: 45, image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400", category: "cat5", unit: "6 pcs", stock: 40, eta: 10, rating: 4.6, reviews: 201, isActive: true },
  { id: "p5", name: "Tata Salt", description: "Iodised salt", price: 22, mrp: 24, image: "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400", category: "cat1", unit: "1kg", stock: 80, eta: 10, rating: 4.7, reviews: 512, isActive: true },
  { id: "p6", name: "Surf Excel", description: "Matic liquid detergent", price: 120, mrp: 140, image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400", category: "cat6", unit: "500ml", stock: 25, eta: 10, rating: 4.4, reviews: 167, isActive: true },
  { id: "p7", name: "Spinach", description: "Fresh palak leaves", price: 18, mrp: 25, image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400", category: "cat2", unit: "250g", stock: 8, eta: 10, rating: 4.2, reviews: 76, isActive: true },
  { id: "p8", name: "Amul Milk", description: "Full cream milk", price: 28, mrp: 28, image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400", category: "cat3", unit: "500ml", stock: 60, eta: 10, rating: 4.9, reviews: 890, isActive: true },
];

export const DEMO_ORDERS: Order[] = [
  {
    id: "ORD001", userId: "u1", customerName: "Atharv Shah", customerPhone: "9876543210",
    status: "new", total: 245, createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    address: { id: "a1", label: "Home", line1: "12 Green Park", city: "Mumbai", pincode: "400001" },
    items: [
      { product: DEMO_PRODUCTS[0], quantity: 2, unitPrice: 29, status: "pending" },
      { product: DEMO_PRODUCTS[4], quantity: 3, unitPrice: 22, status: "pending" },
      { product: DEMO_PRODUCTS[7], quantity: 2, unitPrice: 28, status: "pending" },
    ],
  },
  {
    id: "ORD002", userId: "u2", customerName: "Priya Mehta", customerPhone: "9123456780",
    status: "accepted", total: 480, createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    address: { id: "a2", label: "Office", line1: "45 BKC Tower", city: "Mumbai", pincode: "400051" },
    items: [
      { product: DEMO_PRODUCTS[1], quantity: 1, unitPrice: 55, status: "confirmed" },
      { product: DEMO_PRODUCTS[2], quantity: 4, unitPrice: 20, status: "confirmed" },
      { product: DEMO_PRODUCTS[3], quantity: 2, unitPrice: 35, status: "confirmed" },
      { product: DEMO_PRODUCTS[5], quantity: 1, unitPrice: 120, status: "confirmed" },
    ],
  },
  {
    id: "ORD003", userId: "u3", customerName: "Rohan Verma", customerPhone: "9988776655",
    status: "preparing", total: 120, createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    address: { id: "a3", label: "Home", line1: "8 Andheri West", city: "Mumbai", pincode: "400058" },
    items: [
      { product: DEMO_PRODUCTS[6], quantity: 2, unitPrice: 18, status: "confirmed" },
      { product: DEMO_PRODUCTS[4], quantity: 2, unitPrice: 22, status: "confirmed" },
      { product: DEMO_PRODUCTS[7], quantity: 1, unitPrice: 28, status: "rejected", rejectionReason: "Out of stock" },
    ],
  },
];

export const DEMO_STAFF: StaffMember[] = [
  {
    id: "s1", name: "Manager", email: "manager@sab.com", phone: "9000000001",
    role: "manager", isActive: true, joinedAt: "2024-01-15",
    permissions: ["view_orders", "accept_orders", "reject_orders", "reject_items", "manage_stock", "view_analytics"],
  },
  {
    id: "s2", name: "Staff", email: "staff@sab.com", phone: "9000000002",
    role: "staff", isActive: true, joinedAt: "2024-03-10",
    permissions: ["view_orders", "reject_items", "manage_stock"],
  },
];

export const ALL_PERMISSIONS: { key: Permission; label: string; description: string }[] = [
  { key: "view_orders", label: "View Orders", description: "See all incoming orders" },
  { key: "accept_orders", label: "Accept Orders", description: "Accept or confirm orders" },
  { key: "reject_orders", label: "Reject Orders", description: "Reject entire orders" },
  { key: "reject_items", label: "Reject Items", description: "Reject individual items in an order" },
  { key: "manage_stock", label: "Manage Stock", description: "Update product stock quantities" },
  { key: "manage_products", label: "Manage Products", description: "Add, edit or deactivate products" },
  { key: "manage_categories", label: "Manage Categories", description: "Add or edit product categories" },
  { key: "view_analytics", label: "View Analytics", description: "Access sales and performance data" },
  { key: "manage_staff", label: "Manage Staff", description: "Add staff and assign permissions" },
  { key: "manage_coupons", label: "Manage Coupons", description: "Create and manage discount coupons" },
];
