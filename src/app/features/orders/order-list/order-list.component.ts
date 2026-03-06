import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { OrdersService } from '../../../core/services/orders.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
})
export class OrderListComponent implements OnInit {
  private ordersService = inject(OrdersService);
  orders = signal<Order[]>([]);

  ngOnInit(): void {
    this.ordersService.getMyOrders().subscribe(orders => this.orders.set(orders));
  }
}
