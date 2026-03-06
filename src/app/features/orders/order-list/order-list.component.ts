import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { OrdersService } from '../../../core/services/orders.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatChipsModule, MatButtonModule, DatePipe, TitleCasePipe],
  template: `
    <h1>My Orders</h1>
    @if (orders.length) {
      <div class="orders-list">
        @for (order of orders; track order._id) {
          <mat-card class="order-card">
            <mat-card-header>
              <mat-card-title>Order #{{ order._id.slice(-8) }}</mat-card-title>
              <mat-card-subtitle>{{ order.createdAt | date:'medium' }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <mat-chip [class]="'status-' + order.status">{{ order.status | titlecase }}</mat-chip>
              <p>Items: {{ order.items.length }} | Total: ₹{{ order.totalAmount }}</p>
            </mat-card-content>
            <mat-card-actions>
              <a mat-button [routerLink]="['/orders', order._id]">View Details</a>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    } @else {
      <p>No orders yet. <a routerLink="/products">Start shopping!</a></p>
    }
  `,
  styles: [`
    .orders-list { display: flex; flex-direction: column; gap: 16px; }
    .order-card { }
    .status-pending { background: #fff9c4; }
    .status-confirmed { background: #e3f2fd; }
    .status-processing { background: #f3e5f5; }
    .status-shipped { background: #e8f5e9; }
    .status-delivered { background: #c8e6c9; }
    .status-cancelled { background: #ffebee; }
  `],
})
export class OrderListComponent implements OnInit {
  private ordersService = inject(OrdersService);
  orders: Order[] = [];

  ngOnInit() {
    this.ordersService.getMyOrders().subscribe((orders) => (this.orders = orders));
  }
}
