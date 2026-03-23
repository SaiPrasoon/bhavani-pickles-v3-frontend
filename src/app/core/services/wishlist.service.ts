import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { tap, switchMap, map } from 'rxjs/operators';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { ProductsService } from './products.service';
import { ToastService } from './toast.service';
import { Product } from '../models/product.model';

const STORAGE_KEY = 'bp_wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private userService = inject(UserService);
  private productsService = inject(ProductsService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  private _ids = signal<Set<string>>(new Set());
  private _products = signal<Product[]>([]);

  readonly products = this._products.asReadonly();

  isWishlisted(productId: string): boolean {
    return this._ids().has(productId);
  }

  /** Load wishlist — call on any page that shows heart icons or the wishlist page */
  load(): void {
    if (this.auth.isLoggedIn()) {
      this.userService.getWishlist().subscribe(items => {
        this._products.set(items);
        this._ids.set(new Set(items.map(p => p._id)));
      });
    } else {
      const ids = this._getLocalIds();
      this._ids.set(new Set(ids));
      if (ids.length) {
        forkJoin(ids.map(id => this.productsService.getOne(id))).subscribe({
          next: products => this._products.set(products),
          error: () => this._products.set([]),
        });
      } else {
        this._products.set([]);
      }
    }
  }

  toggle(productId: string): void {
    const wasWishlisted = this.isWishlisted(productId);

    // Optimistic update
    this._ids.update(set => {
      const next = new Set(set);
      wasWishlisted ? next.delete(productId) : next.add(productId);
      return next;
    });

    if (this.auth.isLoggedIn()) {
      this.userService.toggleWishlist(productId).subscribe({
        next: ({ wishlisted }) => {
          this._ids.update(set => {
            const next = new Set(set);
            wishlisted ? next.add(productId) : next.delete(productId);
            return next;
          });
          if (wishlisted) {
            this.toast.success('Added to wishlist');
          } else {
            this.toast.success('Removed from wishlist');
            this._products.update(list => list.filter(p => p._id !== productId));
          }
        },
        error: () => {
          // Revert
          this._ids.update(set => {
            const next = new Set(set);
            wasWishlisted ? next.add(productId) : next.delete(productId);
            return next;
          });
          this.toast.error('Failed to update wishlist');
        },
      });
    } else {
      // Guest — persist to localStorage
      const ids = this._getLocalIds();
      if (wasWishlisted) {
        this._setLocalIds(ids.filter(id => id !== productId));
        this._products.update(list => list.filter(p => p._id !== productId));
        this.toast.success('Removed from wishlist');
      } else {
        this._setLocalIds([...ids, productId]);
        // Fetch product details to add to the products list
        this.productsService.getOne(productId).subscribe(product => {
          this._products.update(list => [...list, product]);
        });
        this.toast.success('Added to wishlist');
      }
    }
  }

  /**
   * Called after login — syncs guest localStorage wishlist to the server,
   * then clears localStorage.
   */
  syncOnLogin(): Observable<void> {
    const localIds = this._getLocalIds();
    this._clearLocal();

    if (!localIds.length) {
      return this.userService.getWishlist().pipe(
        tap(items => {
          this._products.set(items);
          this._ids.set(new Set(items.map(p => p._id)));
        }),
        map(() => void 0),
      );
    }

    // Fetch server wishlist, then add any local IDs not already there
    return this.userService.getWishlist().pipe(
      switchMap(serverItems => {
        const serverIds = new Set(serverItems.map(p => p._id));
        const toAdd = localIds.filter(id => !serverIds.has(id));
        if (!toAdd.length) return of(serverItems);
        return forkJoin(toAdd.map(id => this.userService.toggleWishlist(id))).pipe(
          switchMap(() => this.userService.getWishlist()),
        );
      }),
      tap(items => {
        this._products.set(items);
        this._ids.set(new Set(items.map(p => p._id)));
      }),
      map(() => void 0),
    );
  }

  private _getLocalIds(): string[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
  }

  private _setLocalIds(ids: string[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }

  private _clearLocal(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
