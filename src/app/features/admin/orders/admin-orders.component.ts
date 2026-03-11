import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { OrdersService } from '../../../core/services/orders.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, OrderStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [FormsModule, DatePipe, TitleCasePipe],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private toast = inject(ToastService);
  orders = signal<Order[]>([]);
  statuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  ngOnInit(): void {
    this.ordersService.getAll().subscribe(orders => this.orders.set(orders));
  }

  getUserName(order: Order): string {
    const user = order.user as any;
    return user?.name || user?.email || 'N/A';
  }

  updateStatus(order: Order): void {
    this.ordersService.updateStatus(order._id, order.status).subscribe(() => {
      this.toast.success('Status updated');
    });
  }

  goBack(): void { window.history.back(); }
}
