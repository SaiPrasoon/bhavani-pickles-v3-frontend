import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Category } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly base = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getAll() { return this.http.get<Category[]>(this.base); }
  getOne(id: string) { return this.http.get<Category>(`${this.base}/${id}`); }
  create(formData: FormData) { return this.http.post<Category>(this.base, formData); }
  update(id: string, data: FormData) { return this.http.patch<Category>(`${this.base}/${id}`, data); }
  delete(id: string) { return this.http.delete(`${this.base}/${id}`); }
}
