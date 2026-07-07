import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
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

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  daily: { date: string; orders: number; revenue: number }[];
  statusBreakdown: { status: string; count: number }[];
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
  getAll(query?: { status?: string; page?: number; limit?: number }) {
    let params = new HttpParams();
    if (query) {
      Object.entries(query).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') params = params.set(key, String(val));
      });
    }
    return this.http.get<{ items: Order[]; total: number; page: number; limit: number; pages: number }>(
      this.base,
      { params },
    );
  }
  getOne(id: string) {
    return this.http.get<Order>(`${this.base}/${id}`);
  }
  updateStatus(id: string, status: OrderStatus) {
    return this.http.patch<Order>(`${this.base}/${id}/status`, { status });
  }

  cancelOrder(id: string, reason?: string) {
    return this.http.patch<Order>(`${this.base}/${id}/cancel`, { reason });
  }

  getDashboardStats() {
    return this.http.get<DashboardStats>(`${this.base}/dashboard-stats`);
  }

  downloadInvoice(id: string): void {
    this.http
      .get(`${this.base}/${id}/invoice`, { responseType: 'blob' })
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${id.slice(-8).toUpperCase()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }
}
