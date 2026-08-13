import { HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, EMPTY } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

const addToken = (req: HttpRequest<unknown>, token: string) =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

/** Prevent infinite refresh loops by skipping retry for auth endpoints */
const isAuthUrl = (url: string) => url.includes('/auth/refresh') || url.includes('/auth/login');

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toast = inject(ToastService);
  const token = authService.getToken();

  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthUrl(req.url)) {
        if (!authService.getRefreshToken()) {
          if (authService.isLoggedIn()) {
            toast.warn('Session expired. Please login again.');
            authService.logout();
            return EMPTY;
          }
          return throwError(() => err);
        }

        return authService.refreshAccessToken().pipe(
          switchMap(({ accessToken }) => next(addToken(req, accessToken))),
          catchError(() => {
            toast.warn('Session expired. Please login again.');
            authService.logout();
            return EMPTY;
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
