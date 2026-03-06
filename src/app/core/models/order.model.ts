import { Product } from './product.model';
import { User } from './user.model';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
}

export interface OrderItem {
  product: Product;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  user: User | string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  isPaid: boolean;
  createdAt: string;
}
