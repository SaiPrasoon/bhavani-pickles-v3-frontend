import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProductsService } from '../../../core/services/products.service';
import { OrdersService } from '../../../core/services/orders.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <h1>Admin Dashboard</h1>
    <div class="stats-grid">
      <mat-card class="stat-card">
        <mat-card-content>
          <mat-icon>inventory</mat-icon>
          <h2>{{ totalProducts }}</h2>
          <p>Products</p>
        </mat-card-content>
        <mat-card-actions><a mat-button routerLink="/admin/products">Manage</a></mat-card-actions>
      </mat-card>
      <mat-card class="stat-card">
        <mat-card-content>
          <mat-icon>receipt_long</mat-icon>
          <h2>{{ totalOrders }}</h2>
          <p>Orders</p>
        </mat-card-content>
        <mat-card-actions><a mat-button routerLink="/admin/orders">Manage</a></mat-card-actions>
      </mat-card>
      <mat-card class="stat-card">
        <mat-card-content>
          <mat-icon>category</mat-icon>
          <p>Categories</p>
        </mat-card-content>
        <mat-card-actions><a mat-button routerLink="/admin/categories">Manage</a></mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .stat-card { text-align: center; }
    .stat-card mat-icon { font-size: 48px; width: 48px; height: 48px; color: #2e7d32; }
    .stat-card h2 { font-size: 2rem; margin: 8px 0; }
  `],
})
export class DashboardComponent implements OnInit {
  private productsService = inject(ProductsService);
  private ordersService = inject(OrdersService);
  totalProducts = 0;
  totalOrders = 0;

  ngOnInit() {
    this.productsService.getAll().subscribe((res) => (this.totalProducts = res.total));
    this.ordersService.getAll().subscribe((orders) => (this.totalOrders = orders.length));
  }
}
