import { Product } from './product.model';

export interface CartItem {
  product: Product;
  weight: string;
  quantity: number;
  price: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalAmount: number;
}
