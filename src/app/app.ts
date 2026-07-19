import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { ToastComponent } from './shared/toast/toast.component';
import { FooterComponent } from './shared/footer/footer.component';
import { LoaderComponent } from './shared/loader/loader.component';
import { ConfirmModalComponent } from './shared/confirm-modal/confirm-modal.component';
import { AuthService } from './core/services/auth.service';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    ToastComponent,
    FooterComponent,
    LoaderComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent {
  readonly authService = inject(AuthService);
  private toast = inject(ToastService);
  resending = signal(false);

  get showVerifyBanner(): boolean {
    const user = this.authService.user();
    return !!user && !user.isEmailVerified;
  }

  resendVerification(): void {
    this.resending.set(true);
    this.authService.resendVerification().subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.resending.set(false);
      },
      error: () => {
        this.toast.error('Failed to resend verification email');
        this.resending.set(false);
      },
    });
  }
}
