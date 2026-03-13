import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { tap, switchMap, map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Cart, CartItem } from '../models/cart.model';
import { AuthService } from './auth.service';
import { Product } from '../models/product.model';

const GUEST_CART_KEY = 'bhavani_guest_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly base = `${environment.apiUrl}/cart`;
  readonly cart = signal<Cart | null>(null);
  readonly itemCount = signal<number>(0);

  // ─── Guest helpers ───────────────────────────────────────────────────────────

  private readLocalItems(): CartItem[] {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeLocalItems(items: CartItem[]): Cart {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    const cart = this.buildLocalCart(items);
    this.cart.set(cart);
    this.itemCount.set(items.length);
    return cart;
  }

  private buildLocalCart(items: CartItem[]): Cart {
    return {
      _id: 'guest',
      user: 'guest',
      items,
      totalAmount: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    };
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  loadCart(): Observable<Cart> {
    if (!this.authService.isLoggedIn()) {
      const cart = this.buildLocalCart(this.readLocalItems());
      this.cart.set(cart);
      this.itemCount.set(cart.items.length);
      return of(cart);
    }
    return this.http.get<Cart>(this.base).pipe(
      tap((cart) => {
        this.cart.set(cart);
        this.itemCount.set(cart.items.length);
      }),
    );
  }

  addItem(
    productId: string,
    weight: string,
    quantity: number,
    guestData?: { product: Product; price: number },
  ): Observable<Cart> {
    if (!this.authService.isLoggedIn()) {
      const items = this.readLocalItems();
      const existing = items.find(i => i.product._id === productId && i.weight === weight);
      if (existing) {
        existing.quantity += quantity;
      } else if (guestData) {
        items.push({ product: guestData.product, weight, quantity, price: guestData.price });
      }
      return of(this.writeLocalItems(items));
    }
    return this.http.post<Cart>(`${this.base}/items`, { productId, weight, quantity }).pipe(
      tap((cart) => {
        this.cart.set(cart);
        this.itemCount.set(cart.items.length);
      }),
    );
  }

  updateItem(productId: string, weight: string, quantity: number): Observable<Cart> {
    if (!this.authService.isLoggedIn()) {
      const items = this.readLocalItems();
      const item = items.find(i => i.product._id === productId && i.weight === weight);
      if (item) item.quantity = quantity;
      return of(this.writeLocalItems(items));
    }
    return this.http
      .patch<Cart>(`${this.base}/items/${productId}/${encodeURIComponent(weight)}`, { quantity })
      .pipe(
        tap((cart) => {
          this.cart.set(cart);
          this.itemCount.set(cart.items.length);
        }),
      );
  }

  removeItem(productId: string, weight: string): Observable<Cart> {
    if (!this.authService.isLoggedIn()) {
      const items = this.readLocalItems().filter(
        i => !(i.product._id === productId && i.weight === weight),
      );
      return of(this.writeLocalItems(items));
    }
    return this.http
      .delete<Cart>(`${this.base}/items/${productId}/${encodeURIComponent(weight)}`)
      .pipe(
        tap((cart) => {
          this.cart.set(cart);
          this.itemCount.set(cart.items.length);
        }),
      );
  }

  clearCart(): Observable<unknown> {
    if (!this.authService.isLoggedIn()) {
      localStorage.removeItem(GUEST_CART_KEY);
      this.cart.set(null);
      this.itemCount.set(0);
      return of(null);
    }
    return this.http.delete(this.base).pipe(
      tap(() => {
        this.cart.set(null);
        this.itemCount.set(0);
      }),
    );
  }

  clearLocal(): void {
    localStorage.removeItem(GUEST_CART_KEY);
    this.cart.set(null);
    this.itemCount.set(0);
  }

  /** Merge guest localStorage cart into server cart after login. */
  mergeGuestCart(): Observable<void> {
    const items = this.readLocalItems();
    if (!items.length) {
      localStorage.removeItem(GUEST_CART_KEY);
      return this.loadCart().pipe(map(() => undefined));
    }
    const requests = items.map(item =>
      this.http
        .post<Cart>(`${this.base}/items`, {
          productId: item.product._id,
          weight: item.weight,
          quantity: item.quantity,
        })
        .pipe(catchError(() => of(null))),
    );
    return forkJoin(requests).pipe(
      switchMap(() => this.loadCart()),
      tap(() => localStorage.removeItem(GUEST_CART_KEY)),
      map(() => undefined),
    );
  }
}
