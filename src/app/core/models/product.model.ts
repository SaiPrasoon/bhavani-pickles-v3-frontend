export interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;
}

export interface ProductVariant {
  weight: string;
  price: number;
  discountedPrice?: number;
  stock: number;
  leftoverStock: number;
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
  isOutOfStock: boolean;
  createdAt: string;
}

export interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ProductSubmitPayload {
  name: string;
  description: string;
  category: string;
  variants: { weight: string; price: number; discountedPrice?: number; stock: number }[];
  images: string[];
  isActive: boolean;
}
