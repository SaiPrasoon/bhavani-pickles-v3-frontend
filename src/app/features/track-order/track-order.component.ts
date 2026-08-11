import { Component, inject, signal } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '@app/core/services/orders.service';
import { Order, OrderStatus } from '@app/core/models/order.model';

const STATUS_PROGRESSION: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered',
];

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [FormsModule, DatePipe, TitleCasePipe],
  templateUrl: './track-order.component.html',
  styleUrl: './track-order.component.scss',
})
export class TrackOrderComponent {
  private ordersService = inject(OrdersService);

  orderId = '';
  email = '';
  loading = signal(false);
  order = signal<Order | null>(null);
  error = signal<string | null>(null);

  readonly progression = STATUS_PROGRESSION;

  track(): void {
    if (!this.orderId.trim() || !this.email.trim()) return;
    this.loading.set(true);
    this.error.set(null);
    this.order.set(null);

    this.ordersService.trackGuestOrder(this.orderId.trim(), this.email.trim()).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Order not found. Please check your Order ID and email.');
        this.loading.set(false);
      },
    });
  }

  stepState(status: OrderStatus): 'done' | 'current' | 'upcoming' {
    const o = this.order();
    if (!o) return 'upcoming';
    const currentIdx = STATUS_PROGRESSION.indexOf(o.status);
    const stepIdx = STATUS_PROGRESSION.indexOf(status);
    if (o.status === 'cancelled') {
      return stepIdx < currentIdx ? 'done' : 'upcoming';
    }
    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'current';
    return 'upcoming';
  }
}
