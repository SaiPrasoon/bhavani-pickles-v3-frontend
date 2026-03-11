import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductsService } from '../../../core/services/products.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../core/models/product.model';
import { CartItem } from '../../../core/models/cart.model';

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
  readonly cartService = inject(CartService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  product = signal<Product | null>(null);
  selectedVariantIdx = signal(0);

  selectedVariant = computed(() => {
    const p = this.product();
    return p?.variants?.[this.selectedVariantIdx()] ?? null;
  });

  // Cart item matching the currently selected variant
  cartItem = computed<CartItem | null>(() => {
    const cart = this.cartService.cart();
    const product = this.product();
    const variant = this.selectedVariant();
    if (!cart || !product || !variant) return null;
    return cart.items.find(
      i => (i.product as any)._id?.toString() === product._id && i.weight === variant.weight
    ) ?? null;
  });

  // qty in cart per weight — used to show badge on each variant button
  cartQtyForWeight = computed(() => {
    const cart = this.cartService.cart();
    const product = this.product();
    if (!cart || !product) return (_weight: string) => 0;
    const map = new Map<string, number>();
    cart.items
      .filter(i => (i.product as any)._id?.toString() === product._id)
      .forEach(i => map.set(i.weight, i.quantity));
    return (weight: string) => map.get(weight) ?? 0;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.productsService.getOne(id).subscribe(p => this.product.set(p));
    if (this.authService.isLoggedIn() && !this.cartService.cart()) {
      this.cartService.loadCart().subscribe();
    }
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

  incrementCart(): void {
    const item = this.cartItem();
    const variant = this.selectedVariant();
    if (!item || !variant) return;
    if (item.quantity >= variant.leftoverStock) return;
    this.cartService.updateItem((item.product as any)._id, item.weight, item.quantity + 1).subscribe();
  }

  decrementCart(): void {
    const item = this.cartItem();
    if (!item) return;
    if (item.quantity <= 1) {
      this.cartService.removeItem((item.product as any)._id, item.weight).subscribe(() => {
        this.toast.success('Removed from cart');
      });
    } else {
      this.cartService.updateItem((item.product as any)._id, item.weight, item.quantity - 1).subscribe();
    }
  }

  goBack(): void { window.history.back(); }
}
