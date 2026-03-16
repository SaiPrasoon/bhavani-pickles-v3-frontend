import { Component, ElementRef, HostListener, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { OrdersService } from '../../../core/services/orders.service';
import { Order, CANCELLABLE_STATUSES } from '../../../core/models/order.model';
import { ToastService } from '../../../core/services/toast.service';
import { CancelReasonModalComponent } from '../../../shared/cancel-reason-modal/cancel-reason-modal.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [DatePipe, TitleCasePipe, CancelReasonModalComponent],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss',
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ordersService = inject(OrdersService);
  private toast = inject(ToastService);
  private el = inject(ElementRef);

  order = signal<Order | null>(null);
  menuOpen = signal(false);
  showCancelModal = signal(false);
  cancelling = signal(false);

  readonly cancellableStatuses = CANCELLABLE_STATUSES;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.querySelector('.order-menu')?.contains(event.target)) {
      this.menuOpen.set(false);
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ordersService.getOne(id).subscribe((o) => this.order.set(o));
  }

  isCancellable(): boolean {
    const o = this.order();
    return !!o && this.cancellableStatuses.includes(o.status);
  }

  openCancelModal(): void {
    this.menuOpen.set(false);
    this.showCancelModal.set(true);
  }

  downloadInvoice(): void {
    this.menuOpen.set(false);
    this.toast.info('Invoice download coming soon.');
  }

  onCancelConfirmed(reason: string | undefined): void {
    const o = this.order();
    if (!o) return;
    this.cancelling.set(true);
    this.ordersService.cancelOrder(o._id, reason).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.showCancelModal.set(false);
        this.cancelling.set(false);
        this.toast.success('Order cancelled successfully.');
      },
      error: () => this.cancelling.set(false),
    });
  }

  goBack(): void {
    window.history.back();
  }
}
