import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';
import { UserService } from '../../core/services/user.service';
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
  private userService = inject(UserService);
  private router = inject(Router);
  private toast = inject(ToastService);
  cartService = inject(CartService);

  loading = signal(false);
  savedAddresses = signal<Address[]>([]);
  selectedAddressId = signal<string | null>(null);
  useNewAddress = signal(false);

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

  placeOrder(): void {
    const notes = this.form.value.notes || undefined;

    if (!this.useNewAddress()) {
      const addr = this.savedAddresses().find(a => a._id === this.selectedAddressId());
      if (!addr) return;
      const shippingAddress = {
        street: addr.line2 ? `${addr.line1}, ${addr.line2}` : addr.line1,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        phone: addr.phone,
      };
      this.loading.set(true);
      this.ordersService.create(shippingAddress, notes).subscribe({
        next: (order) => {
          this.cartService.clearLocal();
          this.toast.success('Order placed successfully!');
          this.router.navigate(['/orders', order._id]);
        },
        error: () => this.loading.set(false),
      });
      return;
    }

    if (this.form.invalid) return;
    this.loading.set(true);
    const { notes: _notes, ...address } = this.form.value;
    this.ordersService.create(address as any, notes).subscribe({
      next: (order) => {
        this.cartService.clearLocal();
        this.toast.success('Order placed successfully!');
        this.router.navigate(['/orders', order._id]);
      },
      error: () => this.loading.set(false),
    });
  }

  get canPlace(): boolean {
    if (this.loading()) return false;
    if (!this.useNewAddress()) return !!this.selectedAddressId();
    return this.form.valid;
  }
}
