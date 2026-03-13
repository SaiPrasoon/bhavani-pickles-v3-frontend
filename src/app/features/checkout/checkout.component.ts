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
  readonly authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  cartService = inject(CartService);

  loading = signal(false);
  savedAddresses = signal<Address[]>([]);
  selectedAddressId = signal<string | null>(null);
  useNewAddress = signal(false);
  paymentType = signal<'COD' | 'online'>('online');

  form = this.fb.group({
    name:    ['', Validators.required],
    email:   ['', [Validators.required, Validators.email]],
    phone:   ['', Validators.required],
    street:  ['', Validators.required],
    city:    ['', Validators.required],
    state:   ['', Validators.required],
    pincode: ['', Validators.required],
    notes:   [''],
  });

  ngOnInit(): void {
    this.cartService.loadCart().subscribe();

    const user = this.authService.user();
    if (user) {
      this.form.patchValue({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
      });
    }

    if (this.authService.isLoggedIn()) {
      this.userService.getProfile().subscribe(u => {
        this.savedAddresses.set(u.addresses ?? []);
        const def = u.addresses?.find(a => a.isDefault) ?? u.addresses?.[0];
        if (def?._id) {
          this.selectedAddressId.set(def._id);
        } else {
          this.useNewAddress.set(true);
        }
      });
    } else {
      this.useNewAddress.set(true);
    }
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

    const customer = {
      customerName: this.form.value.name!,
      customerEmail: this.form.value.email!,
      customerPhone: this.form.value.phone || undefined,
    };

    // For guests, pass the cart items in the request
    const guestItems = !this.authService.isLoggedIn()
      ? (this.cartService.cart()?.items ?? []).map(i => ({
          productId: i.product._id,
          name: i.product.name,
          weight: i.weight,
          quantity: i.quantity,
          price: i.price,
        }))
      : undefined;

    this.loading.set(true);
    this.ordersService
      .initiatePayment(shippingAddress, this.paymentType(), customer, notes, guestItems)
      .subscribe({
        next: (data) => {
          if (data.paymentType === 'COD') {
            this.cartService.clearLocal();
            this.toast.success('Order placed! We will collect payment on delivery.');
            if (this.authService.isLoggedIn()) {
              this.router.navigate(['/orders', data.orderId]);
            } else {
              this.router.navigate(['/']);
            }
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
    if (
      !this.form.value.street ||
      !this.form.value.city ||
      !this.form.value.state ||
      !this.form.value.pincode
    ) return null;
    return {
      street: this.form.value.street!,
      city: this.form.value.city!,
      state: this.form.value.state!,
      pincode: this.form.value.pincode!,
      phone: this.form.value.phone || undefined,
    };
  }

  private openRazorpay(data: InitiatePaymentResponse): void {
    const user = this.authService.user();
    const name = user?.name ?? this.form.value.name ?? '';
    const email = user?.email ?? this.form.value.email ?? '';
    const phone = user?.phone ?? this.form.value.phone ?? '';

    this.razorpayService
      .openCheckout(data as any, name, email, phone)
      .then((response) => {
        this.ordersService.verifyPayment(data.orderId, {
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        }).subscribe({
          next: (order) => {
            this.cartService.clearLocal();
            this.toast.success('Payment successful! Order confirmed.');
            if (this.authService.isLoggedIn()) {
              this.router.navigate(['/orders', order._id]);
            } else {
              this.router.navigate(['/']);
            }
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
    const v = this.form.value;
    if (!v.name || !this.form.get('email')!.valid || !v.phone) return false;
    if (!this.useNewAddress()) return !!this.selectedAddressId();
    return !!(v.street && v.city && v.state && v.pincode);
  }

  goBack(): void { window.history.back(); }
}
