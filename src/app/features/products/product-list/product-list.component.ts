import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../../core/services/products.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product, Category } from '../../../core/models/product.model';

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

  products: Product[] = [];
  categories: Category[] = [];
  total = 0;
  page = 1;
  limit = 12;
  search = '';
  selectedCategory = '';

  get totalPages(): number { return Math.ceil(this.total / this.limit); }

  ngOnInit(): void {
    this.categoriesService.getAll().subscribe(cats => this.categories = cats);
    this.route.queryParams.subscribe(params => {
      if (params['category']) this.selectedCategory = params['category'];
      this.load();
    });
  }

  load(): void {
    this.productsService.getAll({
      search: this.search,
      category: this.selectedCategory,
      page: this.page,
      limit: this.limit,
    }).subscribe(res => {
      this.products = res.items;
      this.total = res.total;
    });
  }

  onFilter(): void { this.page = 1; this.load(); }
  prevPage(): void { if (this.page > 1) { this.page--; this.load(); } }
  nextPage(): void { if (this.page < this.totalPages) { this.page++; this.load(); } }

  addToCart(product: Product): void {
    if (!this.authService.isLoggedIn()) {
      this.toast.info('Please login to add items to cart');
      return;
    }
    this.cartService.addItem(product._id, 1).subscribe(() => {
      this.toast.success(`${product.name} added to cart!`);
    });
  }
}
