import { Component, OnInit, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { OrdersService } from '../../../core/services/orders.service';
import { Order, OrderStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatSnackBarModule, FormsModule, DatePipe],
  template: `
    <h1>Orders</h1>
    <table mat-table [dataSource]="orders" class="full-width">
      <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef>Order</th><td mat-cell *matCellDef="let o">#{{ o._id.slice(-8) }}</td></ng-container>
      <ng-container matColumnDef="user"><th mat-header-cell *matHeaderCellDef>Customer</th><td mat-cell *matCellDef="let o">{{ getUserName(o) }}</td></ng-container>
      <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef>Total</th><td mat-cell *matCellDef="let o">₹{{ o.totalAmount }}</td></ng-container>
      <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let o">{{ o.createdAt | date:'short' }}</td></ng-container>
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let o">
          <mat-select [(ngModel)]="o.status" (ngModelChange)="updateStatus(o)">
            @for (s of statuses; track s) { <mat-option [value]="s">{{ s | titlecase }}</mat-option> }
          </mat-select>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns;"></tr>
    </table>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class AdminOrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private snackBar = inject(MatSnackBar);
  orders: Order[] = [];
  columns = ['id', 'user', 'total', 'date', 'status'];
  statuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  ngOnInit() {
    this.ordersService.getAll().subscribe((orders) => (this.orders = orders));
  }

  getUserName(order: Order): string {
    const user = order.user as any;
    return user?.name || user?.email || 'N/A';
  }

  updateStatus(order: Order) {
    this.ordersService.updateStatus(order._id, order.status).subscribe(() => {
      this.snackBar.open('Status updated', 'Close', { duration: 2000 });
    });
  }
}
