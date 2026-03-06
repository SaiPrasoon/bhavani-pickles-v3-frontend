import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ProductsService } from '../../../core/services/products.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatChipsModule, MatSnackBarModule, MatDividerModule],
  template: `
    @if (product) {
      <div class="detail-layout">
        <div class="images">
          @if (product.images.length) {
            <img [src]="product.images[0]" [alt]="product.name" class="main-image">
          } @else {
            <div class="placeholder-image"><mat-icon>image_not_supported</mat-icon></div>
          }
        </div>
        <div class="info">
          <h1>{{ product.name }}</h1>
          <p class="category">{{ product.category.name }}</p>
          <div class="price-block">
            @if (product.discountPrice) {
              <span class="original">₹{{ product.price }}</span>
              <span class="price">₹{{ product.discountPrice }}</span>
              <span class="discount">{{ getDiscount(product) }}% OFF</span>
            } @else {
              <span class="price">₹{{ product.price }}</span>
            }
          </div>
          @if (product.weight) { <p>Weight: {{ product.weight }}</p> }
          <p class="stock" [class.out]="product.stock === 0">
            {{ product.stock > 0 ? 'In Stock (' + product.stock + ' available)' : 'Out of Stock' }}
          </p>
          <div class="qty-actions">
            <button mat-raised-button color="primary" (click)="addToCart()" [disabled]="product.stock === 0">
              <mat-icon>add_shopping_cart</mat-icon> Add to Cart
            </button>
          </div>
          <mat-divider></mat-divider>
          <h3>Description</h3>
          <p>{{ product.description }}</p>
          @if (product.ingredients) {
            <h3>Ingredients</h3>
            <p>{{ product.ingredients }}</p>
          }
          @if (product.tags.length) {
            <div class="tags">
              @for (tag of product.tags; track tag) {
                <mat-chip>{{ tag }}</mat-chip>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .detail-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    @media (max-width: 768px) { .detail-layout { grid-template-columns: 1fr; } }
    .main-image { width: 100%; border-radius: 8px; }
    .placeholder-image { height: 300px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
    h1 { font-size: 2rem; margin-bottom: 8px; }
    .category { color: #666; margin-bottom: 16px; }
    .price-block { margin: 16px 0; display: flex; align-items: center; gap: 12px; }
    .price { font-size: 1.8rem; font-weight: bold; color: #2e7d32; }
    .original { font-size: 1.2rem; text-decoration: line-through; color: #999; }
    .discount { background: #e8f5e9; color: #2e7d32; padding: 4px 8px; border-radius: 4px; font-size: 0.9rem; }
    .stock { margin: 8px 0; color: #4caf50; }
    .stock.out { color: #f44336; }
    .qty-actions { margin: 20px 0; }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    mat-divider { margin: 20px 0; }
  `],
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productsService = inject(ProductsService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  product: Product | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.productsService.getOne(id).subscribe((p) => (this.product = p));
  }

  getDiscount(product: Product): number {
    if (!product.discountPrice) return 0;
    return Math.round(((product.price - product.discountPrice) / product.price) * 100);
  }

  addToCart() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.cartService.addItem(this.product!._id, 1).subscribe(() => {
      this.snackBar.open('Added to cart!', 'View Cart', { duration: 3000 }).onAction().subscribe(() => this.router.navigate(['/cart']));
    });
  }
}
