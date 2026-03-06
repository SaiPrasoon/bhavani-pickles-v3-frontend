import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { Product, Category } from '../../core/models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);

  categories = signal<Category[]>([]);
  featuredProducts = signal<Product[]>([]);

  ngOnInit(): void {
    this.categoriesService.getAll().subscribe(cats => this.categories.set(cats));
    this.productsService.getAll({ limit: 8 }).subscribe(res => this.featuredProducts.set(res.items));
  }
}
