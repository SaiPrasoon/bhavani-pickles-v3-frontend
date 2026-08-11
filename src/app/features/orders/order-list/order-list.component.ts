import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, Location } from '@angular/common';
import { OrdersService } from '@app/core/services/orders.service';
import { Order, ORDER_STATUS_LABELS } from '@app/core/models/order.model';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
})
export class OrderListComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private location = inject(Location);
  orders = signal<Order[]>([]);
  readonly statusLabels = ORDER_STATUS_LABELS;

  ngOnInit(): void {
    this.ordersService.getMyOrders().subscribe(orders => this.orders.set(orders));
  }

  goBack(): void { this.location.back(); }
}
