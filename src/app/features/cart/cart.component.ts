import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { CartItem } from '../../core/models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, FormsModule],
  template: `
    <h1>Shopping Cart</h1>
    @if (cartService.cart()?.items?.length) {
      <table mat-table [dataSource]="cartService.cart()!.items" class="cart-table">
        <ng-container matColumnDef="product">
          <th mat-header-cell *matHeaderCellDef>Product</th>
          <td mat-cell *matCellDef="let item">{{ item.product.name }}</td>
        </ng-container>
        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef>Price</th>
          <td mat-cell *matCellDef="let item">₹{{ item.price }}</td>
        </ng-container>
        <ng-container matColumnDef="quantity">
          <th mat-header-cell *matHeaderCellDef>Qty</th>
          <td mat-cell *matCellDef="let item">
            <button mat-icon-button (click)="decrement(item)"><mat-icon>remove</mat-icon></button>
            {{ item.quantity }}
            <button mat-icon-button (click)="increment(item)"><mat-icon>add</mat-icon></button>
          </td>
        </ng-container>
        <ng-container matColumnDef="subtotal">
          <th mat-header-cell *matHeaderCellDef>Subtotal</th>
          <td mat-cell *matCellDef="let item">₹{{ item.price * item.quantity }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let item">
            <button mat-icon-button color="warn" (click)="remove(item)"><mat-icon>delete</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
      <div class="cart-summary">
        <h2>Total: ₹{{ cartService.cart()!.totalAmount }}</h2>
        <a mat-raised-button color="primary" routerLink="/checkout">Proceed to Checkout</a>
      </div>
    } @else {
      <div class="empty-cart">
        <mat-icon>shopping_cart</mat-icon>
        <p>Your cart is empty</p>
        <a mat-raised-button color="primary" routerLink="/products">Shop Now</a>
      </div>
    }
  `,
  styles: [`
    .cart-table { width: 100%; margin-bottom: 24px; }
    .cart-summary { text-align: right; padding: 16px 0; }
    .empty-cart { text-align: center; padding: 60px; }
    .empty-cart mat-icon { font-size: 64px; width: 64px; height: 64px; color: #ccc; }
  `],
})
export class CartComponent implements OnInit {
  cartService = inject(CartService);
  columns = ['product', 'price', 'quantity', 'subtotal', 'actions'];

  ngOnInit() {
    this.cartService.loadCart().subscribe();
  }

  increment(item: CartItem) {
    this.cartService.updateItem(item.product._id, item.quantity + 1).subscribe();
  }

  decrement(item: CartItem) {
    if (item.quantity > 1) {
      this.cartService.updateItem(item.product._id, item.quantity - 1).subscribe();
    } else {
      this.remove(item);
    }
  }

  remove(item: CartItem) {
    this.cartService.removeItem(item.product._id).subscribe();
  }
}
