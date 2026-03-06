import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { OrdersService } from '../../../core/services/orders.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [MatCardModule, MatTableModule, MatChipsModule, MatDividerModule, DatePipe, TitleCasePipe],
  template: `
    @if (order) {
      <h1>Order #{{ order._id.slice(-8) }}</h1>
      <div class="order-layout">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Order Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Status: <mat-chip [class]="'status-' + order.status">{{ order.status | titlecase }}</mat-chip></p>
            <p>Date: {{ order.createdAt | date:'medium' }}</p>
            <p>Total: <strong>₹{{ order.totalAmount }}</strong></p>
            <mat-divider></mat-divider>
            <h3>Items</h3>
            <table mat-table [dataSource]="order.items" class="items-table">
              <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Product</th><td mat-cell *matCellDef="let i">{{ i.name }}</td></ng-container>
              <ng-container matColumnDef="qty"><th mat-header-cell *matHeaderCellDef>Qty</th><td mat-cell *matCellDef="let i">{{ i.quantity }}</td></ng-container>
              <ng-container matColumnDef="price"><th mat-header-cell *matHeaderCellDef>Price</th><td mat-cell *matCellDef="let i">₹{{ i.price }}</td></ng-container>
              <ng-container matColumnDef="subtotal"><th mat-header-cell *matHeaderCellDef>Subtotal</th><td mat-cell *matCellDef="let i">₹{{ i.price * i.quantity }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="['name','qty','price','subtotal']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['name','qty','price','subtotal'];"></tr>
            </table>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Shipping Address</mat-card-title></mat-card-header>
          <mat-card-content>
            <p>{{ order.shippingAddress.street }}</p>
            <p>{{ order.shippingAddress.city }}, {{ order.shippingAddress.state }} - {{ order.shippingAddress.pincode }}</p>
            @if (order.shippingAddress.phone) { <p>Phone: {{ order.shippingAddress.phone }}</p> }
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .order-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    @media (max-width: 768px) { .order-layout { grid-template-columns: 1fr; } }
    .items-table { width: 100%; }
    .status-pending { background: #fff9c4; }
    .status-confirmed { background: #e3f2fd; }
    .status-delivered { background: #c8e6c9; }
    .status-cancelled { background: #ffebee; }
    mat-divider { margin: 16px 0; }
  `],
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ordersService = inject(OrdersService);
  order: Order | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ordersService.getOne(id).subscribe((o) => (this.order = o));
  }
}
