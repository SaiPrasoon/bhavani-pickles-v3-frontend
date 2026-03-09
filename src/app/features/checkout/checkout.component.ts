import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';
import { ToastService } from '../../core/services/toast.service';

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
  private router = inject(Router);
  private toast = inject(ToastService);
  cartService = inject(CartService);

  loading = signal(false);
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
  }

  placeOrder(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const { notes, ...address } = this.form.value;
    this.ordersService.create(address as any, notes || undefined).subscribe({
      next: (order) => {
        this.toast.success('Order placed successfully!');
        this.router.navigate(['/orders', order._id]);
      },
      error: () => this.loading.set(false),
    });
  }
}
