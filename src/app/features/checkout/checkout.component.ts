import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrdersService, InitiatePaymentResponse } from '../../core/services/orders.service';
import { RazorpayService } from '../../core/services/razorpay.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Address } from '../../core/models/user.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ordersService = inject(OrdersService);
  private razorpayService = inject(RazorpayService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  cartService = inject(CartService);

  loading = signal(false);
  savedAddresses = signal<Address[]>([]);
  selectedAddressId = signal<string | null>(null);
  useNewAddress = signal(false);
  paymentType = signal<'COD' | 'online'>('online');

  form = this.fb.group({
    street:  ['', Validators.required],
    city:    ['', Validators.required],
    state:   ['', Validators.required],
    pincode: ['', Validators.required],
    phone:   [''],
    notes:   [''],
  });

  ngOnInit(): void {
    this.cartService.loadCart().subscribe();
    this.userService.getProfile().subscribe(u => {
      this.savedAddresses.set(u.addresses ?? []);
      const def = u.addresses?.find(a => a.isDefault) ?? u.addresses?.[0];
      if (def?._id) {
        this.selectedAddressId.set(def._id);
      } else {
        this.useNewAddress.set(true);
      }
    });
  }

  selectSavedAddress(id: string): void {
    this.selectedAddressId.set(id);
    this.useNewAddress.set(false);
  }

  switchToNew(): void {
    this.selectedAddressId.set(null);
    this.useNewAddress.set(true);
  }

  selectPaymentType(type: 'COD' | 'online'): void {
    this.paymentType.set(type);
  }

  placeOrder(): void {
    const notes = this.form.value.notes || undefined;
    const shippingAddress = this.resolveShippingAddress();
    if (!shippingAddress) return;

    this.loading.set(true);

    this.ordersService.initiatePayment(shippingAddress, this.paymentType(), notes).subscribe({
      next: (data) => {
        if (data.paymentType === 'COD') {
          this.cartService.clearLocal();
          this.toast.success('Order placed! We will collect payment on delivery.');
          this.router.navigate(['/orders', data.orderId]);
        } else {
          this.openRazorpay(data);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  private resolveShippingAddress() {
    if (!this.useNewAddress()) {
      const addr = this.savedAddresses().find(a => a._id === this.selectedAddressId());
      if (!addr) return null;
      return {
        street: addr.line2 ? `${addr.line1}, ${addr.line2}` : addr.line1,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        phone: addr.phone,
      };
    }
    if (this.form.invalid) return null;
    const { notes: _notes, ...address } = this.form.value;
    return address as any;
  }

  private openRazorpay(data: InitiatePaymentResponse): void {
    const user = this.authService.user();
    this.razorpayService
      .openCheckout(data as any, user?.name ?? '', user?.email ?? '', '')
      .then((response) => {
        this.ordersService.verifyPayment(data.orderId, {
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        }).subscribe({
          next: (order) => {
            this.cartService.clearLocal();
            this.toast.success('Payment successful! Order confirmed.');
            this.router.navigate(['/orders', order._id]);
          },
          error: () => {
            this.toast.error('Payment verification failed. Contact support.');
            this.loading.set(false);
          },
        });
      })
      .catch((err: Error) => {
        if (err.message !== 'Payment cancelled') {
          this.toast.error(err.message);
        }
        this.loading.set(false);
      });
  }

  get canPlace(): boolean {
    if (this.loading()) return false;
    if (!this.useNewAddress()) return !!this.selectedAddressId();
    return this.form.valid;
  }

  goBack(): void { window.history.back(); }
}
