import { Component, ElementRef, HostListener, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '@app/core/services/cart.service';
import { WishlistService } from '@app/core/services/wishlist.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, SidebarComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);
  private elRef = inject(ElementRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  sidebarOpen = signal(false);
  userMenuOpen = signal(false);
  scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.isBrowser) this.scrolled.set(window.scrollY > 10);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const userMenu = this.elRef.nativeElement.querySelector('.user-menu');
    if (userMenu && !userMenu.contains(event.target)) {
      this.userMenuOpen.set(false);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
  toggleUserMenu(): void {
    this.userMenuOpen.update((v) => !v);
  }
  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }
}
