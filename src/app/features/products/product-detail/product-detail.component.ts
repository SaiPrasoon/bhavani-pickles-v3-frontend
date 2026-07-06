import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductsService } from '../../../core/services/products.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { SeoService } from '../../../core/services/seo.service';
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
  private productsService = inject(ProductsService);
  readonly cartService = inject(CartService);
  private toast = inject(ToastService);
  readonly wishlistService = inject(WishlistService);
  private seo = inject(SeoService);

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
    this.productsService.getOne(id).subscribe(p => {
      this.product.set(p);
      this.updateSeo(p);
    });
    if (!this.cartService.cart()) {
      this.cartService.loadCart().subscribe();
    }
    this.wishlistService.load();
  }

  selectVariant(idx: number): void {
    this.selectedVariantIdx.set(idx);
  }

  getDiscount(price: number, discountedPrice: number): number {
    return Math.round(((price - discountedPrice) / price) * 100);
  }

  addToCart(): void {
    const product = this.product();
    const variant = this.selectedVariant();
    if (!product || !variant?.weight) return;
    this.cartService
      .addItem(product._id, variant.weight, 1, {
        product,
        price: variant.discountedPrice ?? variant.price,
      })
      .subscribe(() => {
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

  private updateSeo(p: Product): void {
    const lowestVariant = p.variants.reduce(
      (min, v) => ((v.discountedPrice ?? v.price) < (min.discountedPrice ?? min.price) ? v : min),
      p.variants[0],
    );
    const price = lowestVariant?.discountedPrice ?? lowestVariant?.price ?? 0;
    const url = `https://www.bhavanipickles.com/products/${p._id}`;

    this.seo.update({
      title: p.name,
      description: p.description?.slice(0, 160) ?? `Buy ${p.name} online from Bhavani Pickles`,
      ogImage: p.images?.[0],
      ogType: 'product',
      canonicalUrl: url,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        description: p.description,
        image: p.images,
        url,
        brand: { '@type': 'Brand', name: 'Bhavani Pickles' },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'INR',
          lowPrice: price,
          highPrice: p.variants.reduce((max, v) => Math.max(max, v.price), 0),
          availability: p.isOutOfStock
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
          offerCount: p.variants.length,
        },
        ...(p.rating > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: p.rating,
                reviewCount: p.reviewCount,
              },
            }
          : {}),
      },
    });
  }
}
