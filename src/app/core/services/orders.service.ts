import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import {
  Order, OrderStatus, ShippingAddress,
  InitiatePaymentResponse, VerifyPaymentPayload,
  GuestOrderItem, CustomerInfo, DashboardStats,
} from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly base = `${environment.apiUrl}/orders`;
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(private http: HttpClient) {}

  initiatePayment(
    shippingAddress: ShippingAddress,
    paymentType: 'COD' | 'online',
    customer: CustomerInfo,
    notes?: string,
    guestItems?: GuestOrderItem[],
    shippingCost?: number,
  ) {
    return this.http.post<InitiatePaymentResponse>(`${this.base}/initiate`, {
      shippingAddress,
      paymentType,
      customerName: customer.customerName,
      customerEmail: customer.customerEmail,
      customerPhone: customer.customerPhone,
      notes,
      shippingCost,
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

  getShippingRates(pincode: string, weight = 0.5, cod = false) {
    return this.http.get<{
      available: boolean;
      shippingFee: number;
      estimatedDelivery: string | null;
      couriers: { name: string; rate: number; etd: string }[];
    }>(`${this.base}/shipping-rates`, {
      params: { pincode, weight: String(weight), cod: String(cod) },
    });
  }

  trackGuestOrder(orderId: string, email: string) {
    return this.http.get<Order>(`${this.base}/track`, {
      params: { orderId, email },
    });
  }

  shipOrder(id: string) {
    return this.http.post<Order>(`${this.base}/${id}/ship`, {});
  }

  getTracking(id: string) {
    return this.http.get<any>(`${this.base}/${id}/tracking`);
  }

  getShippingLabel(id: string) {
    return this.http.get<{ labelUrl: string }>(`${this.base}/${id}/label`);
  }

  downloadInvoice(id: string): void {
    if (!this.isBrowser) return;
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
