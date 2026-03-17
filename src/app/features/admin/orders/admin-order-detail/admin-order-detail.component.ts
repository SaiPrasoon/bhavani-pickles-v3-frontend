import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Order, OrderStatus, CANCELLABLE_STATUSES } from '../../../../core/models/order.model';
import { OrdersService } from '../../../../core/services/orders.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CancelReasonModalComponent } from '../../../../shared/cancel-reason-modal/cancel-reason-modal.component';

// Forward-only progression — cancelled is handled separately
const STATUS_PROGRESSION: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered',
];

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [FormsModule, DatePipe, TitleCasePipe, CancelReasonModalComponent],
  templateUrl: './admin-order-detail.component.html',
  styleUrl: './admin-order-detail.component.scss',
})
export class AdminOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ordersService = inject(OrdersService);
  private toast = inject(ToastService);

  order = signal<Order | null>(null);
  saving = signal(false);
  showCancelModal = signal(false);
  selectedStatus = signal<OrderStatus | null>(null);

  readonly progression = STATUS_PROGRESSION;

  // Statuses that can still be set (only forward from current)
  readonly allowedNextStatuses = computed<OrderStatus[]>(() => {
    const current = this.order()?.status;
    if (!current || current === 'delivered' || current === 'cancelled') return [];
    const idx = STATUS_PROGRESSION.indexOf(current);
    return STATUS_PROGRESSION.slice(idx + 1);
  });

  readonly isTerminal = computed(() => {
    const s = this.order()?.status;
    return s === 'delivered' || s === 'cancelled';
  });

  readonly isCancellable = computed(() => {
    const s = this.order()?.status;
    return !!s && CANCELLABLE_STATUSES.includes(s);
  });

  ngOnInit(): void {
    this.fetchOrderDetails();
  }

  fetchOrderDetails(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ordersService.getOne(id).subscribe((o) => {
      this.order.set(o);
      // Pre-select the next logical status
      const next = this.allowedNextStatuses()[0] ?? null;
      this.selectedStatus.set(next);
    });
  }

  getUserName(order: Order): string {
    const user = order.user as any;
    return user?.name || user?.email || 'N/A';
  }

  stepIndex(status: OrderStatus): number {
    return STATUS_PROGRESSION.indexOf(status);
  }

  stepState(status: OrderStatus): 'done' | 'current' | 'upcoming' | 'skipped' {
    const order = this.order();
    if (!order) return 'upcoming';
    const currentIdx = STATUS_PROGRESSION.indexOf(order.status);
    const stepIdx = STATUS_PROGRESSION.indexOf(status);
    if (order.status === 'cancelled') {
      return stepIdx < currentIdx ? 'done' : stepIdx === currentIdx ? 'current' : 'upcoming';
    }
    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'current';
    return 'upcoming';
  }

  saveStatus(): void {
    this.doUpdateStatus();
  }

  openCancelModal(): void {
    this.showCancelModal.set(true);
  }

  private doUpdateStatus(): void {
    const o = this.order();
    const status = this.selectedStatus();
    if (!o || !status) return;
    this.saving.set(true);
    this.ordersService.updateStatus(o._id, status).subscribe({
      next: () => {
        this.fetchOrderDetails();
        this.toast.success('Status updated');
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  onCancelConfirmed(reason: string | undefined): void {
    const o = this.order();
    if (!o) return;
    this.saving.set(true);
    this.ordersService.cancelOrder(o._id, reason).subscribe({
      next: () => {
        this.showCancelModal.set(false);
        this.fetchOrderDetails();
        this.toast.success('Order cancelled');
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  onCancelDismissed(): void {
    this.showCancelModal.set(false);
  }

  goBack(): void {
    window.history.back();
  }
}
