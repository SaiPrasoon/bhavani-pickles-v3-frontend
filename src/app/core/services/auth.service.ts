import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { User, AuthResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private readonly _user = signal<User | null>(this.loadUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  register(data: { name: string; email: string; password: string; phone?: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data).pipe(
      tap((res) => this.storeSession(res))
    );
  }

  login(credentials: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap((res) => this.storeSession(res))
    );
  }

  logout(returnUrl?: string) {
    if (this.isBrowser) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    this._user.set(null);
    this.router.navigate(['/auth/login'], {
      queryParams: returnUrl ? { returnUrl } : {},
    });
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('accessToken') : null;
  }

  getRefreshToken(): string | null {
    return this.isBrowser ? localStorage.getItem('refreshToken') : null;
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  verifyEmail(token: string): Observable<{ message: string; email: string }> {
    return this.http.get<{ message: string; email: string }>(`${environment.apiUrl}/auth/verify-email`, { params: { token } });
  }

  resendVerification(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/resend-verification`, {});
  }

  updateUser(user: User): void {
    this._user.set(user);
    if (this.isBrowser) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  refreshAccessToken(): Observable<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<{ accessToken: string; refreshToken: string }>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(tap(res => {
        if (this.isBrowser) {
          localStorage.setItem('accessToken', res.accessToken);
          if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
        }
      }));
  }

  private storeSession(res: AuthResponse) {
    if (this.isBrowser) {
      localStorage.setItem('accessToken', res.accessToken);
      localStorage.setItem('refreshToken', res.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    this._user.set(res.user);
  }

  private loadUser(): User | null {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return null;
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }
}
