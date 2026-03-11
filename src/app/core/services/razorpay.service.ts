import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { InitiatePaymentResponse } from './orders.service';

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

@Injectable({ providedIn: 'root' })
export class RazorpayService {
  openCheckout(
    data: InitiatePaymentResponse,
    userName: string,
    userEmail: string,
    userPhone: string,
  ): Promise<RazorpaySuccessResponse> {
    return new Promise((resolve, reject) => {
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
        handler: (response: RazorpaySuccessResponse) => resolve(response),
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled')),
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) =>
        reject(new Error(response.error?.description ?? 'Payment failed')),
      );
      rzp.open();
    });
  }
}
