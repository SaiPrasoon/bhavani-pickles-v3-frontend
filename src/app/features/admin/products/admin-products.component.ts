import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductsService } from '@app/core/services/products.service';
import { ToastService } from '@app/core/services/toast.service';
import { ConfirmService } from '@app/core/services/confirm.service';
import { Product, ProductVariant } from '@app/core/models/product.model';
import { ProductFormComponent } from './product-form/product-form.component';
import { ProductSubmitPayload } from '@app/core/models/product.model';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [ProductFormComponent, ReactiveFormsModule],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
})
export class AdminProductsComponent implements OnInit, OnDestroy {
  private productsService = inject(ProductsService);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmService);
  private fb = inject(FormBuilder);

  products = signal<Product[]>([]);
  saving = signal(false);
  showModal = signal(false);
  editingProduct = signal<Product | null>(null);

  searchQuery = signal('');
  private search$ = new Subject<string>();
  private searchSub!: Subscription;

  // Bulk selection
  selectedIds = signal<Set<string>>(new Set());
  allSelected = computed(() => {
    const prods = this.products();
    return prods.length > 0 && this.selectedIds().size === prods.length;
  });
  someSelected = computed(() => {
    const size = this.selectedIds().size;
    return size > 0 && size < this.products().length;
  });

  // Dropdown menu
  openMenuId = signal<string | null>(null);

  // Stock drawer
  stockProduct = signal<Product | null>(null);
  savingStock = signal(false);

  readonly weightOptions = ['100gms', '200gms', '250gms', '500gms', '1Kg'];

  variantsForm = this.fb.group({
    variants: this.fb.array([]),
  });

  get variantsArray(): FormArray {
    return this.variantsForm.get('variants') as FormArray;
  }

  ngOnInit(): void {
    this.searchSub = this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
    ).subscribe(q => this.load(q));
    this.load();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.search$.next(value.trim());
  }

  clearSearch(): void {
    this.onSearch('');
  }

  load(search = ''): void {
    this.productsService.getAll({ limit: 100, search: search || undefined })
      .subscribe((res) => this.products.set(res.items));
  }

  openAddModal(): void {
    this.editingProduct.set(null);
    this.showModal.set(true);
  }

  openEditModal(product: Product): void {
    this.editingProduct.set(product);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingProduct.set(null);
  }

  onFormSubmitted(data: ProductSubmitPayload): void {
    this.saving.set(true);
    const product = this.editingProduct();
    const request$ = product
      ? this.productsService.update(product._id, data)
      : this.productsService.create(data);

    request$.subscribe({
      next: () => {
        this.toast.success(product ? 'Product updated!' : 'Product added!');
        this.closeModal();
        this.load();
      },
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false),
    });
  }

  toggleBestSeller(product: Product): void {
    this.productsService.toggleBestSeller(product._id).subscribe(() => {
      this.toast.success(product.isBestSeller ? 'Removed from best sellers' : 'Marked as best seller');
      this.load();
    });
  }

  toggleOutOfStock(product: Product): void {
    this.productsService.update(product._id, { isOutOfStock: !product.isOutOfStock } as any).subscribe(() => {
      this.toast.success(product.isOutOfStock ? 'Marked as in stock' : 'Marked as out of stock');
      this.load();
    });
  }

  delete(product: Product): void {
    this.confirmService.open({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.name}"?`,
      confirmLabel: 'Delete',
      danger: true,
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.productsService.delete(product._id).subscribe(() => {
        this.toast.success('Product deleted');
        this.load();
      });
    });
  }

  // ── Stock drawer ────────────────────────────────────────────────────────────

  openStockDrawer(product: Product): void {
    this.stockProduct.set(product);
    // Reset FormArray and populate from product variants
    while (this.variantsArray.length) this.variantsArray.removeAt(0);
    product.variants.forEach(v => this.variantsArray.push(this.buildVariantRow(v)));
  }

  closeStockDrawer(): void {
    this.stockProduct.set(null);
    this.savingStock.set(false);
  }

  private buildVariantRow(v?: Partial<ProductVariant>) {
    return this.fb.group({
      weight:         [v?.weight ?? '', Validators.required],
      price:          [v?.price ?? 0, [Validators.required, Validators.min(0)]],
      discountedPrice:[v?.discountedPrice ?? null],
      stock:          [v?.stock ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  addVariantRow(): void {
    this.variantsArray.push(this.buildVariantRow());
  }

  removeVariantRow(index: number): void {
    if (this.variantsArray.length > 1) this.variantsArray.removeAt(index);
  }

  saveStock(): void {
    if (this.variantsForm.invalid) return;
    const product = this.stockProduct();
    if (!product) return;

    this.savingStock.set(true);
    const variants = this.variantsArray.value.map((v: any) => ({
      weight: v.weight,
      price: Number(v.price),
      ...(v.discountedPrice != null && v.discountedPrice !== '' ? { discountedPrice: Number(v.discountedPrice) } : {}),
      stock: Number(v.stock),
    }));

    this.productsService.update(product._id, { variants }).subscribe({
      next: () => {
        this.toast.success('Stock updated!');
        this.load();
        this.closeStockDrawer();
      },
      error: () => this.savingStock.set(false),
    });
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  toggleSelect(id: string): void {
    const next = new Set(this.selectedIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selectedIds.set(next);
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.products().map(p => p._id)));
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  // ── Dropdown menu ─────────────────────────────────────────────────────────

  toggleMenu(id: string): void {
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  closeMenu(): void {
    this.openMenuId.set(null);
  }

  @HostListener('document:click')
  onDocClick(): void {
    if (this.openMenuId()) this.closeMenu();
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────

  bulkMarkInStock(): void {
    const ids = [...this.selectedIds()];
    forkJoin(ids.map(id => this.productsService.update(id, { isOutOfStock: false } as any)))
      .subscribe(() => {
        this.toast.success(`${ids.length} product(s) marked in stock`);
        this.clearSelection();
        this.load();
      });
  }

  bulkMarkOutOfStock(): void {
    const ids = [...this.selectedIds()];
    forkJoin(ids.map(id => this.productsService.update(id, { isOutOfStock: true } as any)))
      .subscribe(() => {
        this.toast.success(`${ids.length} product(s) marked out of stock`);
        this.clearSelection();
        this.load();
      });
  }

  bulkSetBestSeller(value: boolean): void {
    const ids = [...this.selectedIds()];
    const prods = this.products().filter(p => ids.includes(p._id));
    const toToggle = prods.filter(p => p.isBestSeller !== value);
    if (toToggle.length === 0) {
      this.toast.info('No changes needed');
      return;
    }
    forkJoin(toToggle.map(p => this.productsService.toggleBestSeller(p._id)))
      .subscribe(() => {
        this.toast.success(`${toToggle.length} product(s) updated`);
        this.clearSelection();
        this.load();
      });
  }

  bulkDelete(): void {
    const ids = [...this.selectedIds()];
    this.confirmService.open({
      title: 'Delete Products',
      message: `Are you sure you want to delete ${ids.length} product(s)?`,
      confirmLabel: 'Delete All',
      danger: true,
    }).subscribe(confirmed => {
      if (!confirmed) return;
      forkJoin(ids.map(id => this.productsService.delete(id)))
        .subscribe(() => {
          this.toast.success(`${ids.length} product(s) deleted`);
          this.clearSelection();
          this.load();
        });
    });
  }

  goBack(): void {
    window.history.back();
  }
}
