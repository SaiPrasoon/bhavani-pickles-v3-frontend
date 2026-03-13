import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Order, OrderStatus, ShippingAddress } from '../models/order.model';

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

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly base = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  initiatePayment(
    shippingAddress: ShippingAddress,
    paymentType: 'COD' | 'online',
    customer: CustomerInfo,
    notes?: string,
    guestItems?: GuestOrderItem[],
  ) {
    return this.http.post<InitiatePaymentResponse>(`${this.base}/initiate`, {
      shippingAddress,
      paymentType,
      customerName: customer.customerName,
      customerEmail: customer.customerEmail,
      customerPhone: customer.customerPhone,
      notes,
      ...(guestItems?.length ? { guestItems } : {}),
    });
  }

  verifyPayment(orderId: string, payload: VerifyPaymentPayload) {
    return this.http.post<Order>(`${this.base}/${orderId}/verify-payment`, payload);
  }

  getMyOrders() {
    return this.http.get<Order[]>(`${this.base}/my`);
  }
  getAll() {
    return this.http.get<Order[]>(this.base);
  }
  getOne(id: string) {
    return this.http.get<Order>(`${this.base}/${id}`);
  }
  updateStatus(id: string, status: OrderStatus) {
    return this.http.patch<Order>(`${this.base}/${id}/status`, { status });
  }
}
