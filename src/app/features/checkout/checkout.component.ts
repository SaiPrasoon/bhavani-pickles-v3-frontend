import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule, MatDividerModule],
  template: `
    <div class="checkout-layout">
      <mat-card class="form-card">
        <mat-card-header><mat-card-title>Shipping Address</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="placeOrder()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Street</mat-label>
              <input matInput formControlName="street">
            </mat-form-field>
            <div class="two-col">
              <mat-form-field appearance="outline">
                <mat-label>City</mat-label>
                <input matInput formControlName="city">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>State</mat-label>
                <input matInput formControlName="state">
              </mat-form-field>
            </div>
            <div class="two-col">
              <mat-form-field appearance="outline">
                <mat-label>Pincode</mat-label>
                <input matInput formControlName="pincode">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone">
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notes (optional)</mat-label>
              <textarea matInput formControlName="notes" rows="3"></textarea>
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" class="full-width" [disabled]="form.invalid || loading">
              {{ loading ? 'Placing Order...' : 'Place Order (₹' + (cartService.cart()?.totalAmount || 0) + ')' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="summary-card">
        <mat-card-header><mat-card-title>Order Summary</mat-card-title></mat-card-header>
        <mat-card-content>
          @for (item of cartService.cart()?.items; track item.product._id) {
            <div class="summary-item">
              <span>{{ item.product.name }} x{{ item.quantity }}</span>
              <span>₹{{ item.price * item.quantity }}</span>
            </div>
          }
          <mat-divider></mat-divider>
          <div class="total"><strong>Total: ₹{{ cartService.cart()?.totalAmount }}</strong></div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .checkout-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    @media (max-width: 768px) { .checkout-layout { grid-template-columns: 1fr; } }
    .full-width { width: 100%; margin-bottom: 12px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .summary-item { display: flex; justify-content: space-between; padding: 8px 0; }
    .total { padding: 12px 0; font-size: 1.1rem; }
    mat-divider { margin: 8px 0; }
  `],
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ordersService = inject(OrdersService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  cartService = inject(CartService);

  loading = false;
  form = this.fb.group({
    street: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', Validators.required],
    phone: [''],
    notes: [''],
  });

  ngOnInit() {
    this.cartService.loadCart().subscribe();
  }

  placeOrder() {
    if (this.form.invalid) return;
    this.loading = true;
    const { notes, ...address } = this.form.value;
    this.ordersService.create(address as any, notes || undefined).subscribe({
      next: (order) => {
        this.snackBar.open('Order placed successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/orders', order._id]);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to place order', 'Close', { duration: 3000 });
        this.loading = false;
      },
    });
  }
}
