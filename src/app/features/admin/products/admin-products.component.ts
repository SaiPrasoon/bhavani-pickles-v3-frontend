import { Component, OnInit, inject, signal } from '@angular/core';
import { ProductsService } from '../../../core/services/products.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
})
export class AdminProductsComponent implements OnInit {
  private productsService = inject(ProductsService);
  private toast = inject(ToastService);
  products = signal<Product[]>([]);

  ngOnInit(): void {
    this.productsService.getAll({ limit: 100 }).subscribe(res => this.products.set(res.items));
  }

  delete(product: Product): void {
    if (!confirm(`Delete "${product.name}"?`)) return;
    this.productsService.delete(product._id).subscribe(() => {
      this.products.update(ps => ps.filter(p => p._id !== product._id));
      this.toast.success('Product deleted');
    });
  }
}
