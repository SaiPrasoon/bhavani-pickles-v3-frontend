import { Component, OnInit, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductsService } from '@app/core/services/products.service';
import { SeoService } from '@app/core/services/seo.service';
import { WishlistService } from '@app/core/services/wishlist.service';
import { CartService } from '@app/core/services/cart.service';
import { ToastService } from '@app/core/services/toast.service';
import { Product, ProductVariant } from '@app/core/models/product.model';
import { SkeletonCardComponent } from '@app/shared/skeletons/skeleton-card.component';

@Component({
  selector: 'app-best-sellers',
  standalone: true,
  imports: [RouterLink, SkeletonCardComponent],
  templateUrl: './best-sellers.component.html',
  styleUrl: './best-sellers.component.scss',
})
export class BestSellersComponent implements OnInit {
  private productsService = inject(ProductsService);
  private seo = inject(SeoService);
  private cartService = inject(CartService);
  private toast = inject(ToastService);
  readonly wishlistService = inject(WishlistService);
  private location = inject(Location);

  products = signal<Product[]>([]);
  loading = signal(true);

  // Variant picker
  pickerProduct = signal<Product | null>(null);
  pickerWeight = signal('');
  pickerQty = signal(1);

  get pickerVariant(): ProductVariant | null {
    const p = this.pickerProduct();
    if (!p) return null;
    return p.variants.find(v => v.weight === this.pickerWeight()) ?? null;
  }

  ngOnInit(): void {
    this.seo.update({
      title: 'Best Sellers',
      description: 'Shop our best-selling pickles, snacks, and sweets — handmade with authentic Telugu recipes.',
      canonicalUrl: 'https://www.bhavanipickles.com/best-sellers',
    });

    this.wishlistService.load();
    this.productsService.getBestSellers().subscribe(items => {
      this.products.set(items);
      this.loading.set(false);
    });
  }

  openPicker(product: Product): void {
    const firstAvailable = product.variants.find(v => v.leftoverStock > 0) ?? product.variants[0];
    this.pickerProduct.set(product);
    this.pickerWeight.set(firstAvailable?.weight ?? '');
    this.pickerQty.set(1);
  }

  closePicker(): void {
    this.pickerProduct.set(null);
  }

  incrementQty(): void {
    const max = this.pickerVariant?.leftoverStock ?? 1;
    this.pickerQty.update(q => Math.min(q + 1, max));
  }

  decrementQty(): void {
    this.pickerQty.update(q => Math.max(q - 1, 1));
  }

  confirmAddToCart(): void {
    const product = this.pickerProduct();
    const variant = this.pickerVariant;
    if (!product || !variant) return;
    this.cartService
      .addItem(product._id, variant.weight, this.pickerQty(), {
        product,
        price: variant.discountedPrice ?? variant.price,
      })
      .subscribe(() => {
        this.toast.success(`${product.name} (${variant.weight}) added to cart!`);
        this.closePicker();
      });
  }

  goBack(): void { this.location.back(); }
}
