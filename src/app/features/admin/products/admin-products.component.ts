import { Component, OnInit, inject, signal } from '@angular/core';
import { ProductsService } from '../../../core/services/products.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../core/models/product.model';
import { ProductFormComponent, ProductSubmitPayload } from './product-form/product-form.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [ProductFormComponent],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
})
export class AdminProductsComponent implements OnInit {
  private productsService = inject(ProductsService);
  private toast = inject(ToastService);

  products = signal<Product[]>([]);
  saving = signal(false);
  showModal = signal(false);
  editingProduct = signal<Product | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.productsService.getAll({ limit: 100 }).subscribe((res) => this.products.set(res.items));
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

  delete(product: Product): void {
    if (!confirm(`Delete "${product.name}"?`)) return;
    this.productsService.delete(product._id).subscribe(() => {
      this.toast.success('Product deleted');
      this.load();
    });
  }

  goBack(): void {
    window.history.back();
  }
}
