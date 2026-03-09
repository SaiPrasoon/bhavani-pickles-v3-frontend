import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductsService } from '../../../core/services/products.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  product = signal<Product | null>(null);
  selectedVariantIdx = signal(0);

  selectedVariant = computed(() => {
    const p = this.product();
    return p?.variants?.[this.selectedVariantIdx()] ?? null;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.productsService.getOne(id).subscribe(p => this.product.set(p));
  }

  selectVariant(idx: number): void {
    this.selectedVariantIdx.set(idx);
  }

  getDiscount(price: number, discountedPrice: number): number {
    return Math.round(((price - discountedPrice) / price) * 100);
  }

  addToCart(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    const variant = this.selectedVariant();
    if (!variant?.weight) return;
    this.cartService.addItem(this.product()!._id, variant.weight, 1).subscribe(() => {
      this.toast.success('Added to cart!');
    });
  }
}
