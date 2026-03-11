import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { ProductsService } from '../../../core/services/products.service';
import { OrdersService } from '../../../core/services/orders.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { Order, OrderStatus } from '../../../core/models/order.model';
import { Product } from '../../../core/models/product.model';

Chart.register(...registerables);

// ── Palette ────────────────────────────────────────────────────────────────────
const AMBER   = '#c8870a';
const CRIMSON = '#950220';
const CREAM   = 'rgba(240,235,224,0.85)';
const SURFACE = 'rgba(30,22,14,0)'; // transparent — canvas bg handled by CSS
const GRID    = 'rgba(240,235,224,0.08)';
const TICK    = 'rgba(176,160,144,0.9)';

const cartesianScales = () => ({
  x: { ticks: { color: TICK }, grid: { color: GRID } },
  y: { ticks: { color: TICK }, grid: { color: GRID }, beginAtZero: true },
});

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private productsService  = inject(ProductsService);
  private ordersService    = inject(OrdersService);
  private categoriesService = inject(CategoriesService);

  // ── Stat cards ──────────────────────────────────────────────────────────────
  totalProducts   = signal(0);
  totalOrders     = signal(0);
  totalRevenue    = signal(0);
  totalCategories = signal(0);

  // ── Orders over last 7 days (line chart) ────────────────────────────────────
  ordersLineData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  ordersLineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: CREAM } },
      tooltip: { backgroundColor: 'rgba(14,10,5,0.92)', titleColor: CREAM, bodyColor: TICK },
    },
    scales: cartesianScales(),
  };

  // ── Revenue over last 7 days (bar chart) ────────────────────────────────────
  revenueBarData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  revenueBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: CREAM } },
      tooltip: { backgroundColor: 'rgba(14,10,5,0.92)', titleColor: CREAM, bodyColor: TICK },
    },
    scales: cartesianScales(),
  };

  // ── Products per category (horizontal bar) ──────────────────────────────────
  productsCatData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  productsCatOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(14,10,5,0.92)', titleColor: CREAM, bodyColor: TICK },
    },
    scales: cartesianScales(),
  };

  // ── Orders per category (pie) ───────────────────────────────────────────────
  ordersCatData = signal<ChartData<'pie'>>({ labels: [], datasets: [] });
  ordersCatOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: CREAM, padding: 14 } },
      tooltip: { backgroundColor: 'rgba(14,10,5,0.92)', titleColor: CREAM, bodyColor: TICK },
    },
  };

  // ── Orders by status (doughnut) ─────────────────────────────────────────────
  statusDoughnutData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  statusDoughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: CREAM, padding: 16 } },
      tooltip: { backgroundColor: 'rgba(14,10,5,0.92)', titleColor: CREAM, bodyColor: TICK },
    },
  };

  ngOnInit(): void {
    this.categoriesService.getAll().subscribe(cats => this.totalCategories.set(cats.length));
    forkJoin({
      products: this.productsService.getAll({ limit: 1000 }),
      orders:   this.ordersService.getAll(),
    }).subscribe(({ products, orders }) => {
      this.totalProducts.set(products.total);
      this.buildCharts(orders, products.items);
    });
  }

  goBack(): void { window.history.back(); }

  private buildCharts(orders: Order[], products: Product[]): void {
    this.totalOrders.set(orders.length);
    this.totalRevenue.set(orders.reduce((sum, o) => sum + o.totalAmount, 0));

    // Last 7 days labels
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const labels = days.map(d => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }));

    const ordersPerDay = days.map(day =>
      orders.filter(o => {
        const od = new Date(o.createdAt);
        return od.toDateString() === day.toDateString();
      }).length
    );

    const revenuePerDay = days.map(day =>
      orders
        .filter(o => new Date(o.createdAt).toDateString() === day.toDateString())
        .reduce((sum, o) => sum + o.totalAmount, 0)
    );

    this.ordersLineData.set({
      labels,
      datasets: [{
        label: 'Orders',
        data: ordersPerDay,
        borderColor: AMBER,
        backgroundColor: 'rgba(200,135,10,0.12)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: AMBER,
        pointRadius: 4,
      }],
    });

    this.revenueBarData.set({
      labels,
      datasets: [{
        label: 'Revenue (₹)',
        data: revenuePerDay,
        backgroundColor: 'rgba(149,2,32,0.7)',
        borderColor: CRIMSON,
        borderWidth: 1,
        borderRadius: 4,
      }],
    });

    // Status breakdown
    const statusLabels: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const statusColors = ['#e8c96a', '#64b5f6', '#ce93d8', '#81c784', '#66bb6a', '#ef9a9a'];
    const statusCounts = statusLabels.map(s => orders.filter(o => o.status === s).length);

    this.statusDoughnutData.set({
      labels: statusLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
      datasets: [{
        data: statusCounts,
        backgroundColor: statusColors.map(c => c + 'cc'),
        borderColor: statusColors,
        borderWidth: 1,
      }],
    });

    // Products per category
    const catProductMap = new Map<string, number>();
    products.forEach(p => {
      const name = p.category?.name ?? 'Uncategorised';
      catProductMap.set(name, (catProductMap.get(name) ?? 0) + 1);
    });
    const catNames = Array.from(catProductMap.keys());
    const catProductCounts = catNames.map(n => catProductMap.get(n)!);
    const catColors = catNames.map((_, i) => `hsl(${(i * 47) % 360}, 55%, 55%)`);

    this.productsCatData.set({
      labels: catNames,
      datasets: [{
        label: 'Products',
        data: catProductCounts,
        backgroundColor: catColors.map(c => c.replace('55%)', '55%, 0.7)')),
        borderColor: catColors,
        borderWidth: 1,
        borderRadius: 4,
      }],
    });

    // Orders per category (count order items by product category)
    const catOrderMap = new Map<string, number>();
    orders.forEach(o =>
      o.items.forEach(item => {
        const name = (item.product as any)?.category?.name ?? item.name ?? 'Other';
        catOrderMap.set(name, (catOrderMap.get(name) ?? 0) + item.quantity);
      })
    );
    const orderCatNames = Array.from(catOrderMap.keys());
    const orderCatCounts = orderCatNames.map(n => catOrderMap.get(n)!);
    const pieColors = orderCatNames.map((_, i) => `hsl(${(i * 67 + 30) % 360}, 60%, 58%)`);

    this.ordersCatData.set({
      labels: orderCatNames,
      datasets: [{
        data: orderCatCounts,
        backgroundColor: pieColors.map(c => c.replace('58%)', '58%, 0.8)')),
        borderColor: pieColors,
        borderWidth: 1,
      }],
    });
  }
}
