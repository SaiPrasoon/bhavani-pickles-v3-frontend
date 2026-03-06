import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatChipsModule],
  template: `
    <section class="hero">
      <h1>Authentic Indian Pickles</h1>
      <p>Handcrafted with love, traditional recipes passed down for generations.</p>
      <a mat-raised-button color="primary" routerLink="/products">Shop Now</a>
    </section>

    <section class="categories">
      <h2>Shop by Category</h2>
      <div class="category-grid">
        @for (cat of categories; track cat._id) {
          <mat-card class="cat-card" routerLink="/products" [queryParams]="{category: cat._id}">
            <mat-card-header>
              <mat-card-title>{{ cat.name }}</mat-card-title>
            </mat-card-header>
            @if (cat.description) {
              <mat-card-content><p>{{ cat.description }}</p></mat-card-content>
            }
          </mat-card>
        }
      </div>
    </section>

    <section class="featured">
      <h2>Featured Products</h2>
      <div class="product-grid">
        @for (product of featuredProducts; track product._id) {
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
                  <span class="original">₹{{ product.price }}</span>
                  ₹{{ product.discountPrice }}
                } @else {
                  ₹{{ product.price }}
                }
              </p>
            </mat-card-content>
            <mat-card-actions>
              <a mat-button color="primary" [routerLink]="['/products', product._id]">View Details</a>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    </section>
  `,
  styles: [`
    .hero { text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #e8f5e9, #fff9c4); border-radius: 12px; margin-bottom: 40px; }
    .hero h1 { font-size: 2.5rem; margin-bottom: 16px; color: #2e7d32; }
    .hero p { font-size: 1.2rem; margin-bottom: 24px; color: #555; }
    h2 { margin-bottom: 20px; color: #333; }
    .category-grid, .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 40px; }
    .cat-card, .product-card { cursor: pointer; transition: transform 0.2s; }
    .cat-card:hover, .product-card:hover { transform: translateY(-4px); }
    .price { font-size: 1.2rem; font-weight: bold; color: #2e7d32; }
    .original { text-decoration: line-through; color: #999; margin-right: 8px; font-size: 1rem; }
  `],
})
export class HomeComponent implements OnInit {
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  categories: Category[] = [];
  featuredProducts: Product[] = [];

  ngOnInit() {
    this.categoriesService.getAll().subscribe((cats) => (this.categories = cats));
    this.productsService.getAll({ limit: 8 }).subscribe((res) => (this.featuredProducts = res.items));
  }
}
