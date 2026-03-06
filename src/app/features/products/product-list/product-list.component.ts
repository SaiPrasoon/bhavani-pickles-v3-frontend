import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ProductsService } from '../../../core/services/products.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [RouterLink, FormsModule, MatCardModule, MatButtonModule, MatSelectModule, MatInputModule, MatFormFieldModule, MatPaginatorModule, MatSnackBarModule, MatIconModule],
  template: `
    <h1>Our Products</h1>
    <div class="filters">
      <mat-form-field>
        <mat-label>Search</mat-label>
        <input matInput [(ngModel)]="search" (ngModelChange)="onFilter()" placeholder="Search pickles...">
      </mat-form-field>
      <mat-form-field>
        <mat-label>Category</mat-label>
        <mat-select [(ngModel)]="selectedCategory" (ngModelChange)="onFilter()">
          <mat-option value="">All</mat-option>
          @for (cat of categories; track cat._id) {
            <mat-option [value]="cat._id">{{ cat.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    <div class="product-grid">
      @for (product of products; track product._id) {
        <mat-card class="product-card">
          @if (product.images.length) {
            <img mat-card-image [src]="product.images[0]" [alt]="product.name">
          }
          <mat-card-header>
            <mat-card-title>{{ product.name }}</mat-card-title>
            <mat-card-subtitle>{{ product.category.name }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p class="price">
              @if (product.discountPrice) {
                <span class="original">₹{{ product.price }}</span> ₹{{ product.discountPrice }}
              } @else { ₹{{ product.price }} }
            </p>
            <p class="stock" [class.low]="product.stock < 10">
              {{ product.stock > 0 ? (product.stock < 10 ? 'Only ' + product.stock + ' left' : 'In Stock') : 'Out of Stock' }}
            </p>
          </mat-card-content>
          <mat-card-actions>
            <a mat-button [routerLink]="['/products', product._id]">Details</a>
            <button mat-raised-button color="primary" (click)="addToCart(product)" [disabled]="product.stock === 0">
              <mat-icon>add_shopping_cart</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
      }
    </div>

    @if (total > 0) {
      <mat-paginator [length]="total" [pageSize]="limit" (page)="onPage($event)" showFirstLastButtons></mat-paginator>
    }
  `,
  styles: [`
    h1 { margin-bottom: 20px; }
    .filters { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .product-card { transition: transform 0.2s; }
    .product-card:hover { transform: translateY(-4px); }
    .price { font-size: 1.2rem; font-weight: bold; color: #2e7d32; }
    .original { text-decoration: line-through; color: #999; margin-right: 6px; font-size: 1rem; }
    .stock { font-size: 0.85rem; color: #4caf50; }
    .stock.low { color: #ff9800; }
  `],
})
export class ProductListComponent implements OnInit {
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  products: Product[] = [];
  categories: Category[] = [];
  total = 0;
  page = 1;
  limit = 12;
  search = '';
  selectedCategory = '';

  ngOnInit() {
    this.categoriesService.getAll().subscribe((cats) => (this.categories = cats));
    this.route.queryParams.subscribe((params) => {
      if (params['category']) this.selectedCategory = params['category'];
      this.load();
    });
  }

  load() {
    this.productsService.getAll({ search: this.search, category: this.selectedCategory, page: this.page, limit: this.limit }).subscribe((res) => {
      this.products = res.items;
      this.total = res.total;
    });
  }

  onFilter() { this.page = 1; this.load(); }

  onPage(event: PageEvent) {
    this.page = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.load();
  }

  addToCart(product: Product) {
    if (!this.authService.isLoggedIn()) {
      this.snackBar.open('Please login to add items to cart', 'Login', { duration: 3000 });
      return;
    }
    this.cartService.addItem(product._id, 1).subscribe(() => {
      this.snackBar.open(`${product.name} added to cart!`, 'Close', { duration: 2000 });
    });
  }
}
