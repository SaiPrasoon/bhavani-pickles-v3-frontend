import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Cart } from '../models/cart.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly base = `${environment.apiUrl}/cart`;
  readonly cart = signal<Cart | null>(null);
  readonly itemCount = signal<number>(0);

  constructor(private http: HttpClient) {}

  loadCart() {
    return this.http.get<Cart>(this.base).pipe(
      tap((cart) => {
        this.cart.set(cart);
        this.itemCount.set(cart.items.length);
      }),
    );
  }

  addItem(productId: string, weight: string, quantity: number) {
    return this.http.post<Cart>(`${this.base}/items`, { productId, weight, quantity }).pipe(
      tap((cart) => {
        this.cart.set(cart);
        this.itemCount.set(cart.items.length);
      }),
    );
  }

  updateItem(productId: string, quantity: number) {
    return this.http.patch<Cart>(`${this.base}/items/${productId}`, { quantity }).pipe(
      tap((cart) => {
        this.cart.set(cart);
        this.itemCount.set(cart.items.length);
      }),
    );
  }

  removeItem(productId: string) {
    return this.http.delete<Cart>(`${this.base}/items/${productId}`).pipe(
      tap((cart) => {
        this.cart.set(cart);
        this.itemCount.set(cart.items.length);
      }),
    );
  }

  clearCart() {
    return this.http.delete(this.base).pipe(
      tap(() => {
        this.cart.set(null);
        this.itemCount.set(0);
      }),
    );
  }
}
