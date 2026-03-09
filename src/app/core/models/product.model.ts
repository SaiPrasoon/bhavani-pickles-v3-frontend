export interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;
}

export interface ProductVariant {
  weight: string;
  quantity: number;
  price: number;
  discountedPrice?: number;
  stock: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: Category;
  variants: ProductVariant[];
  images: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
