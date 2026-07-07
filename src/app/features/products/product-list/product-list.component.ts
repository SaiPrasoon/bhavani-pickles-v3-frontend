import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductsService } from '@app/core/services/products.service';
import { CategoriesService } from '@app/core/services/categories.service';
import { CartService } from '@app/core/services/cart.service';
import { ToastService } from '@app/core/services/toast.service';
import { WishlistService } from '@app/core/services/wishlist.service';
import { Product, Category, ProductVariant } from '@app/core/models/product.model';
import { SeoService } from '@app/core/services/seo.service';
import { SkeletonCardComponent } from '@app/shared/skeletons/skeleton-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [RouterLink, FormsModule, SkeletonCardComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit, OnDestroy {
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private cartService = inject(CartService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  readonly wishlistService = inject(WishlistService);
  private seo = inject(SeoService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(12);
  search = signal('');
  selectedCategory = signal('');
  sortBy = signal('');
  loading = signal(true);

  private search$ = new Subject<string>();
  private searchSub!: Subscription;

  // Variant picker popup
  pickerProduct = signal<Product | null>(null);
  pickerWeight = signal('');
  pickerQty = signal(1);

  pickerVariant = computed<ProductVariant | null>(() => {
    const p = this.pickerProduct();
    if (!p) return null;
    return p.variants.find(v => v.weight === this.pickerWeight()) ?? null;
  });

  get totalPages(): number { return Math.ceil(this.total() / this.limit()); }

  ngOnInit(): void {
    this.searchSub = this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
    ).subscribe(() => { this.page.set(1); this.load(); });

    this.seo.update({
      title: 'Products',
      description:
        'Browse our collection of authentic handmade Telugu pickles — avakaya, gongura, mango, and more. Free shipping on orders above a minimum.',
      canonicalUrl: 'https://www.bhavanipickles.com/products',
      keywords: 'buy pickles online, Telugu pickles, avakaya, gongura pickle, mango pickle',
    });

    this.wishlistService.load();
    this.categoriesService.getAll().subscribe(cats => this.categories.set(cats));
    this.route.queryParams.subscribe(params => {
      if (params['category']) this.selectedCategory.set(params['category']);
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.productsService.getAll({
      search: this.search(),
      category: this.selectedCategory(),
      sort: this.sortBy() || undefined,
      page: this.page(),
      limit: this.limit(),
    }).subscribe(res => {
      this.products.set(res.items);
      this.total.set(res.total);
      this.loading.set(false);
    });
  }

  onSearchInput(value: string): void {
    this.search.set(value);
    this.search$.next(value);
  }

  onCategoryChange(value: string): void {
    this.selectedCategory.set(value);
    this.page.set(1);
    this.load();
  }
  onSortChange(value: string): void {
    this.sortBy.set(value);
    this.page.set(1);
    this.load();
  }

  prevPage(): void { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() < this.totalPages) { this.page.update(p => p + 1); this.load(); } }

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
    const max = this.pickerVariant()?.leftoverStock ?? 1;
    this.pickerQty.update(q => Math.min(q + 1, max));
  }

  decrementQty(): void {
    this.pickerQty.update(q => Math.max(q - 1, 1));
  }

  confirmAddToCart(): void {
    const product = this.pickerProduct();
    const variant = this.pickerVariant();
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

  goBack(): void { window.history.back(); }
}
