import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { SeoService } from '../../core/services/seo.service';
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
  private seo = inject(SeoService);

  categories = signal<Category[]>([]);
  featuredProducts = signal<Product[]>([]);

  ngOnInit(): void {
    this.seo.update({
      title: 'Home',
      description:
        'Bhavani Pickles — authentic handmade Telugu pickles from Hyderabad. Order avakaya, gongura, mango, and more online with pan-India delivery.',
      canonicalUrl: 'https://www.bhavanipickles.com/home',
    });

    this.categoriesService.getAll().subscribe(cats => this.categories.set(cats));
    this.productsService.getAll({ limit: 8 }).subscribe(res => this.featuredProducts.set(res.items));
  }
}
