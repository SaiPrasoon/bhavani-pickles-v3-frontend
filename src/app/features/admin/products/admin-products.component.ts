import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductsService } from '../../../core/services/products.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { Product, ProductVariant } from '../../../core/models/product.model';
import { ProductFormComponent, ProductSubmitPayload } from './product-form/product-form.component';

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

  goBack(): void {
    window.history.back();
  }
}
