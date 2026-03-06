import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatBadgeModule, MatMenuModule],
  template: `
    <mat-toolbar color="primary">
      <a routerLink="/home" class="brand">🥒 Bhavani Pickles</a>
      <span class="spacer"></span>
      <a mat-button routerLink="/products" routerLinkActive="active">Products</a>
      @if (authService.isLoggedIn()) {
        <a mat-icon-button routerLink="/cart" [matBadge]="cartService.itemCount()" matBadgeColor="accent" [matBadgeHidden]="cartService.itemCount() === 0">
          <mat-icon>shopping_cart</mat-icon>
        </a>
        <button mat-button [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon> {{ authService.user()?.name }}
        </button>
        <mat-menu #userMenu="matMenu">
          <a mat-menu-item routerLink="/orders"><mat-icon>receipt</mat-icon> My Orders</a>
          @if (authService.isAdmin()) {
            <a mat-menu-item routerLink="/admin"><mat-icon>admin_panel_settings</mat-icon> Admin</a>
          }
          <button mat-menu-item (click)="authService.logout()"><mat-icon>logout</mat-icon> Logout</button>
        </mat-menu>
      } @else {
        <a mat-button routerLink="/auth/login">Login</a>
        <a mat-raised-button color="accent" routerLink="/auth/register">Register</a>
      }
    </mat-toolbar>
  `,
  styles: [`
    .brand { font-size: 1.2rem; font-weight: bold; text-decoration: none; color: white; margin-right: 1rem; }
    .spacer { flex: 1; }
    .active { background: rgba(255,255,255,0.15); border-radius: 4px; }
  `],
})
export class NavbarComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
}
