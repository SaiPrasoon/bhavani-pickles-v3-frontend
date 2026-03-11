import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Order, ShippingAddress } from '../models/order.model';

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

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly base = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  initiatePayment(shippingAddress: ShippingAddress, paymentType: 'COD' | 'online', notes?: string) {
    return this.http.post<InitiatePaymentResponse>(`${this.base}/initiate`, { shippingAddress, paymentType, notes });
  }

  verifyPayment(orderId: string, payload: VerifyPaymentPayload) {
    return this.http.post<Order>(`${this.base}/${orderId}/verify-payment`, payload);
  }

  getMyOrders() { return this.http.get<Order[]>(`${this.base}/my`); }
  getAll() { return this.http.get<Order[]>(this.base); }
  getOne(id: string) { return this.http.get<Order>(`${this.base}/${id}`); }
  updateStatus(id: string, status: string) { return this.http.patch<Order>(`${this.base}/${id}/status`, { status }); }
}
