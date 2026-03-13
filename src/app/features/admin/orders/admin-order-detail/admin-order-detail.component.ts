import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Order, OrderStatus } from '../../../../core/models/order.model';
import { OrdersService } from '../../../../core/services/orders.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [FormsModule, DatePipe, TitleCasePipe],
  templateUrl: './admin-order-detail.component.html',
  styleUrl: './admin-order-detail.component.scss',
})
export class AdminOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ordersService = inject(OrdersService);
  private toast = inject(ToastService);

  order = signal<Order | null>(null);
  saving = signal(false);
  statuses: OrderStatus[] = [
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];

  updatedStatus = signal<OrderStatus | null>(null);

  ngOnInit(): void {
    this.fetchOrderDetails();
  }

  fetchOrderDetails(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ordersService.getOne(id).subscribe((o) => {
      this.order.set(o);
      this.updatedStatus.set(o.status);
    });
  }

  getUserName(order: Order): string {
    const user = order.user as any;
    return user?.name || user?.email || 'N/A';
  }

  updateStatus(): void {
    const o = this.order();
    if (!o) return;
    this.saving.set(true);
    this.ordersService.updateStatus(o._id, this.updatedStatus()!).subscribe({
      next: () => {
        this.fetchOrderDetails();
        this.toast.success('Status updated');
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  goBack(): void {
    window.history.back();
  }
}
