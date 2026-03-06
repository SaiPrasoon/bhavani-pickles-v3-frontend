import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductsService } from '../../../core/services/products.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  product = signal<Product | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.productsService.getOne(id).subscribe(p => this.product.set(p));
  }

  getDiscount(product: Product): number {
    if (!product.discountPrice) return 0;
    return Math.round(((product.price - product.discountPrice) / product.price) * 100);
  }

  addToCart(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.cartService.addItem(this.product()!._id, 1).subscribe(() => {
      this.toast.success('Added to cart!');
    });
  }
}
