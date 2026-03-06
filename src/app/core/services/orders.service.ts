import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Order, ShippingAddress } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly base = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  create(shippingAddress: ShippingAddress, notes?: string) {
    return this.http.post<Order>(this.base, { shippingAddress, notes });
  }

  getMyOrders() { return this.http.get<Order[]>(`${this.base}/my`); }
  getAll() { return this.http.get<Order[]>(this.base); }
  getOne(id: string) { return this.http.get<Order>(`${this.base}/${id}`); }
  updateStatus(id: string, status: string) { return this.http.patch<Order>(`${this.base}/${id}/status`, { status }); }
}
