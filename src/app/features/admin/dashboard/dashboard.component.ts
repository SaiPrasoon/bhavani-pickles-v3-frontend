import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../../../core/services/products.service';
import { OrdersService } from '../../../core/services/orders.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private productsService = inject(ProductsService);
  private ordersService = inject(OrdersService);
  totalProducts = 0;
  totalOrders = 0;

  ngOnInit(): void {
    this.productsService.getAll().subscribe(res => this.totalProducts = res.total);
    this.ordersService.getAll().subscribe(orders => this.totalOrders = orders.length);
  }
}
