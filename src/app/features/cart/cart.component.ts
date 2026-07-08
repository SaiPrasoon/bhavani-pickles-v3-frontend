import { Component, OnInit, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '@app/core/services/cart.service';
import { CartItem } from '@app/core/models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {
  cartService = inject(CartService);
  private location = inject(Location);

  ngOnInit(): void {
    this.cartService.loadCart().subscribe();
  }

  increment(item: CartItem): void {
    this.cartService.updateItem(item.product._id, item.weight, item.quantity + 1).subscribe();
  }

  decrement(item: CartItem): void {
    if (item.quantity > 1) {
      this.cartService.updateItem(item.product._id, item.weight, item.quantity - 1).subscribe();
    } else {
      this.remove(item);
    }
  }

  remove(item: CartItem): void {
    this.cartService.removeItem(item.product._id, item.weight).subscribe();
  }

  goBack(): void { this.location.back(); }
}
