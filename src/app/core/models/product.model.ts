export interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: Category;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  tags: string[];
  weight?: string;
  ingredients?: string;
  createdAt: string;
}

export interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
