import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../../core/services/products.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product, Category, ProductVariant } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(12);
  search = signal('');
  selectedCategory = signal('');

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
    this.categoriesService.getAll().subscribe(cats => this.categories.set(cats));
    this.route.queryParams.subscribe(params => {
      if (params['category']) this.selectedCategory.set(params['category']);
      this.load();
    });
  }

  load(): void {
    this.productsService.getAll({
      search: this.search(),
      category: this.selectedCategory(),
      page: this.page(),
      limit: this.limit(),
    }).subscribe(res => {
      this.products.set(res.items);
      this.total.set(res.total);
    });
  }

  onFilter(): void { this.page.set(1); this.load(); }
  prevPage(): void { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() < this.totalPages) { this.page.update(p => p + 1); this.load(); } }

  openPicker(product: Product): void {
    if (!this.authService.isLoggedIn()) {
      this.toast.info('Please login to add items to cart');
      return;
    }
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
    this.cartService.addItem(product._id, variant.weight, this.pickerQty()).subscribe(() => {
      this.toast.success(`${product.name} (${variant.weight}) added to cart!`);
      this.closePicker();
    });
  }

  goBack(): void { window.history.back(); }
}
