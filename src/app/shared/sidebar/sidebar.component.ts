import { Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);

  isOpen = input(false);
  closed = output<void>();

  close(): void {
    this.closed.emit();
  }

  logout(): void {
    this.closed.emit();
    this.authService.logout();
  }
}
