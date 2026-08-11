import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductsService } from '@app/core/services/products.service';
import { CategoriesService } from '@app/core/services/categories.service';
import { SeoService } from '@app/core/services/seo.service';
import { Product, Category } from '@app/core/models/product.model';
import { SkeletonCardComponent } from '@app/shared/skeletons/skeleton-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, SkeletonCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private seo = inject(SeoService);

  categories = signal<Category[]>([]);
  featuredProducts = signal<Product[]>([]);
  loadingCategories = signal(true);
  loadingProducts = signal(true);

  ngOnInit(): void {
    this.seo.update({
      title: 'Home',
      description:
        'Bhavani Pickles — authentic handmade Telugu pickles from Hyderabad. Order avakaya, gongura, mango, and more online with pan-India delivery.',
      canonicalUrl: 'https://www.bhavanipickles.com/home',
    });

    this.categoriesService.getAll().subscribe(cats => {
      this.categories.set(cats);
      this.loadingCategories.set(false);
    });
    this.productsService.getAll({ limit: 8 }).subscribe(res => {
      this.featuredProducts.set(res.items);
      this.loadingProducts.set(false);
    });
  }
}
