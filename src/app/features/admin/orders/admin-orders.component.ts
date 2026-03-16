import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { OrdersService } from '../../../core/services/orders.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, OrderStatus, CANCELLABLE_STATUSES } from '../../../core/models/order.model';
import { CancelReasonModalComponent } from '../../../shared/cancel-reason-modal/cancel-reason-modal.component';

const STATUS_PROGRESSION: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered',
];

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe, CancelReasonModalComponent],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private toast = inject(ToastService);

  orders = signal<Order[]>([]);
  saving = signal(false);
  showCancelModal = signal(false);
  pendingCancelOrder = signal<Order | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.ordersService.getAll().subscribe(orders => this.orders.set(orders));
  }

  getUserName(order: Order): string {
    const user = order.user as any;
    return user?.name || user?.email || 'N/A';
  }

  isTerminal(order: Order): boolean {
    return order.status === 'delivered' || order.status === 'cancelled';
  }

  allowedNextStatuses(order: Order): OrderStatus[] {
    if (this.isTerminal(order)) return [];
    const idx = STATUS_PROGRESSION.indexOf(order.status);
    return STATUS_PROGRESSION.slice(idx + 1);
  }

  isCancellable(order: Order): boolean {
    return CANCELLABLE_STATUSES.includes(order.status);
  }

  onStatusChange(order: Order, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as OrderStatus;
    // Reset select visual immediately — actual update comes from API refresh
    select.value = '';

    if (!newStatus) return;

    if (newStatus === 'cancelled') {
      this.pendingCancelOrder.set(order);
      this.showCancelModal.set(true);
      return;
    }

    this.saving.set(true);
    this.ordersService.updateStatus(order._id, newStatus).subscribe({
      next: () => {
        this.loadOrders();
        this.toast.success('Status updated');
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  onCancelConfirmed(reason: string | undefined): void {
    const order = this.pendingCancelOrder();
    if (!order) return;
    this.saving.set(true);
    this.ordersService.cancelOrder(order._id, reason).subscribe({
      next: () => {
        this.showCancelModal.set(false);
        this.pendingCancelOrder.set(null);
        this.loadOrders();
        this.toast.success('Order cancelled');
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  onCancelDismissed(): void {
    this.showCancelModal.set(false);
    this.pendingCancelOrder.set(null);
  }

  goBack(): void { window.history.back(); }
}
