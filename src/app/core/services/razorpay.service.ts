import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '@env/environment';
import { InitiatePaymentResponse } from '../models/order.model';
import { RazorpaySuccessResponse } from '../models/razorpay.model';

@Injectable({ providedIn: 'root' })
export class RazorpayService {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  openCheckout(
    data: InitiatePaymentResponse,
    userName: string,
    userEmail: string,
    userPhone: string,
  ): Promise<RazorpaySuccessResponse> {
    return new Promise((resolve, reject) => {
      if (!this.isBrowser) { reject(new Error('Razorpay not available on server')); return; }
      let settled = false;

      const options = {
        key: environment.razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Bhavani Pickles',
        description: 'Order Payment',
        image: '/bhavani-pickles-logo.svg',
        order_id: data.razorpayOrderId,
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone,
        },
        theme: { color: '#950220' },
        handler: (response: RazorpaySuccessResponse) => {
          settled = true;
          resolve(response);
        },
        modal: {
          ondismiss: () => {
            if (!settled) reject(new Error('Payment cancelled'));
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        settled = true;
        reject(new Error(response.error?.description ?? 'Payment failed'));
      });
      rzp.open();
    });
  }
}
