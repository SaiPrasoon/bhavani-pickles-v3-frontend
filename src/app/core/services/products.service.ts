import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { Product, ProductsResponse, ProductFilters } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly base = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getAll(filters: ProductFilters = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') params = params.set(key, String(val));
    });
    return this.http.get<ProductsResponse>(this.base, { params });
  }

  getOne(id: string) {
    return this.http.get<Product>(`${this.base}/${id}`);
  }

  create(data: object) {
    return this.http.post<Product>(this.base, data);
  }

  update(id: string, data: object) {
    return this.http.patch<Product>(`${this.base}/${id}`, data);
  }

  delete(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }

  getBestSellers() {
    return this.http.get<Product[]>(`${this.base}/best-sellers`);
  }

  toggleBestSeller(id: string) {
    return this.http.patch<Product>(`${this.base}/${id}/best-seller`, {});
  }
}
