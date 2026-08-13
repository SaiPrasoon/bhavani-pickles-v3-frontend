import { Product } from './product.model';
import { User } from './user.model';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone?: string;
}

export interface OrderItem {
  product: Product;
  name: string;
  weight: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  user: User | string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  totalAmount: number;
  shippingCost?: number;
  status: OrderStatus;
  notes?: string;
  isPaid: boolean;
  paidAt?: string;
  paymentType?: 'COD' | 'online';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: 'user' | 'admin';
  // Shiprocket shipping fields
  shiprocketOrderId?: number;
  shiprocketShipmentId?: number;
  awbCode?: string;
  courierName?: string;
  trackingUrl?: string;
  shippingLabelUrl?: string;
}

export const CANCELLABLE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing'];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready_to_ship: 'Ready to Ship',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export interface InitiatePaymentResponse {
  orderId: string;
  paymentType: 'COD' | 'online';
  razorpayOrderId?: string;
  amount?: number;
  currency?: string;
}

export interface VerifyPaymentPayload {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface GuestOrderItem {
  productId: string;
  name: string;
  weight: string;
  quantity: number;
  price: number;
}

export interface CustomerInfo {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  daily: { date: string; orders: number; revenue: number }[];
  statusBreakdown: { status: string; count: number }[];
}
