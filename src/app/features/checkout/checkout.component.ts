import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { hasError } from '@app/core/utils/form.utils';
import { CartService } from '@app/core/services/cart.service';
import { OrdersService } from '@app/core/services/orders.service';
import { InitiatePaymentResponse } from '@app/core/models/order.model';
import { RazorpayService } from '@app/core/services/razorpay.service';
import { UserService } from '@app/core/services/user.service';
import { AuthService } from '@app/core/services/auth.service';
import { ToastService } from '@app/core/services/toast.service';
import { Address } from '@app/core/models/user.model';
import { COUNTRIES, getCountry } from '@app/core/data/geo.data';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private ordersService = inject(OrdersService);
  private razorpayService = inject(RazorpayService);
  private userService = inject(UserService);
  readonly authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  cartService = inject(CartService);
  private location = inject(Location);

  readonly hasError = hasError;
  loading = signal(false);
  savedAddresses = signal<Address[]>([]);
  selectedAddressId = signal<string | null>(null);
  useNewAddress = signal(false);
  paymentType = signal<'COD' | 'online'>('online');

  // Shipping rates
  shippingFee = signal(0);
  estimatedDelivery = signal<string | null>(null);
  shippingAvailable = signal<boolean | null>(null); // null = not checked yet
  checkingShipping = signal(false);

  readonly countries = COUNTRIES;
  readonly selectedCountry = signal('IN');

  readonly states = computed(() => getCountry(this.selectedCountry())?.states ?? []);
  readonly pincodeLabel = computed(() => getCountry(this.selectedCountry())?.pincodeLabel ?? 'Pincode');

  form = this.fb.group({
    name:    ['', Validators.required],
    email:   ['', [Validators.required, Validators.email]],
    phone:   ['', [Validators.required, Validators.pattern(/^\+?[\d\s-]{7,15}$/)]],
    street:  ['', Validators.required],
    city:    ['', Validators.required],
    country: ['IN', Validators.required],
    state:   ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{5,6}$/)]],
    notes:   [''],
  });

  private pincodeSub?: { unsubscribe(): void };

  ngOnDestroy(): void {
    this.pincodeSub?.unsubscribe();
  }

  ngOnInit(): void {
    this.cartService.loadCart().subscribe();

    // Keep selectedCountry signal in sync and reset dependent fields
    this.form.get('country')!.valueChanges.subscribe(code => {
      this.selectedCountry.set(code ?? 'IN');
      this.form.patchValue({ state: '', pincode: '' }, { emitEvent: false });
    });

    // Check shipping rates when pincode changes (for new address)
    this.pincodeSub = this.form.get('pincode')!.valueChanges.subscribe(val => {
      if (val && val.length >= 6) this.fetchShippingRates(val);
    });

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
          if (def.pincode) this.fetchShippingRates(def.pincode);
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
    const addr = this.savedAddresses().find(a => a._id === id);
    if (addr?.pincode) this.fetchShippingRates(addr.pincode);
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
            this.router.navigate(['/order-status'], {
              queryParams: { type: 'success', orderId: data.orderId },
            });
          } else {
            this.openRazorpay(data);
          }
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/order-status'], { queryParams: { type: 'failure' } });
        },
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
        country: addr.country ?? 'IN',
        phone: addr.phone,
      };
    }
    const v = this.form.value;
    if (!v.street || !v.city || !v.state || !v.pincode || !v.country) return null;
    return {
      street: v.street,
      city: v.city,
      state: v.state,
      pincode: v.pincode,
      country: v.country,
      phone: v.phone || undefined,
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
            this.router.navigate(['/order-status'], {
              queryParams: { type: 'success', orderId: order._id },
            });
          },
          error: () => {
            this.loading.set(false);
            this.router.navigate(['/order-status'], { queryParams: { type: 'failure' } });
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
    return !!(v.street && v.city && v.country && v.state && v.pincode);
  }

  fetchShippingRates(pincode: string): void {
    this.checkingShipping.set(true);
    this.ordersService.getShippingRates(pincode, 0.5, this.paymentType() === 'COD').subscribe({
      next: (res) => {
        this.shippingAvailable.set(res.available);
        this.shippingFee.set(res.shippingFee);
        this.estimatedDelivery.set(res.estimatedDelivery);
        this.checkingShipping.set(false);
      },
      error: () => {
        this.shippingAvailable.set(null);
        this.checkingShipping.set(false);
      },
    });
  }

  goBack(): void { this.location.back(); }
}
