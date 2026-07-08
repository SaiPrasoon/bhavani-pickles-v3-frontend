import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, Location } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { ProductsService } from '@app/core/services/products.service';
import { OrdersService } from '@app/core/services/orders.service';
import { DashboardStats } from '@app/core/models/order.model';
import { CategoriesService } from '@app/core/services/categories.service';
import { UserService } from '@app/core/services/user.service';
import { Product } from '@app/core/models/product.model';

Chart.register(...registerables);

// ── Palette ────────────────────────────────────────────────────────────────────
const AMBER   = '#c8870a';
const CRIMSON = '#950220';
const CREAM   = 'rgba(240,235,224,0.85)';
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
  private userService = inject(UserService);
  private location = inject(Location);

  // ── Stat cards ──────────────────────────────────────────────────────────────
  totalProducts   = signal(0);
  totalOrders     = signal(0);
  totalRevenue    = signal(0);
  totalCategories = signal(0);
  totalUsers      = signal(0);

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
    this.userService.getAllUsers().subscribe(users => this.totalUsers.set(users.length));

    forkJoin({
      products: this.productsService.getAll({ limit: 1000 }),
      stats: this.ordersService.getDashboardStats(),
    }).subscribe(({ products, stats }) => {
      this.totalProducts.set(products.total);
      this.buildCharts(stats, products.items);
    });
  }

  goBack(): void { this.location.back(); }

  private buildCharts(stats: DashboardStats, products: Product[]): void {
    this.totalOrders.set(stats.totalOrders);
    this.totalRevenue.set(stats.totalRevenue);

    // Daily labels
    const labels = stats.daily.map(d => {
      const date = new Date(d.date + 'T00:00:00');
      return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
    });

    this.ordersLineData.set({
      labels,
      datasets: [{
        label: 'Orders',
        data: stats.daily.map(d => d.orders),
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
        data: stats.daily.map(d => d.revenue),
        backgroundColor: 'rgba(149,2,32,0.7)',
        borderColor: CRIMSON,
        borderWidth: 1,
        borderRadius: 4,
      }],
    });

    // Status breakdown
    const statusColorMap: Record<string, string> = {
      pending: '#e8c96a',
      confirmed: '#64b5f6',
      processing: '#ce93d8',
      shipped: '#81c784',
      delivered: '#66bb6a',
      cancelled: '#ef9a9a',
    };
    const statusLabels = stats.statusBreakdown.map(s => s.status.charAt(0).toUpperCase() + s.status.slice(1));
    const statusCounts = stats.statusBreakdown.map(s => s.count);
    const statusColors = stats.statusBreakdown.map(s => statusColorMap[s.status] ?? '#888');

    this.statusDoughnutData.set({
      labels: statusLabels,
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
  }
}
