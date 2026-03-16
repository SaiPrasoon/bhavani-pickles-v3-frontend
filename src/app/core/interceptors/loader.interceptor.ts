import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from '../services/loader.service';

function getMessage(req: HttpRequest<unknown>): string {
  const url = req.url;
  const m = req.method;

  if (url.includes('/auth/login'))    return 'Signing in…';
  if (url.includes('/auth/register')) return 'Creating account…';

  if (url.includes('/upload')) return 'Uploading image…';

  if (url.includes('/orders/initiate'))  return 'Placing order…';
  if (url.includes('/verify-payment'))   return 'Verifying payment…';
  if (url.includes('/cancel'))           return 'Cancelling order…';
  if (url.includes('/status'))           return 'Updating status…';
  if (url.includes('/orders') && m === 'GET') {
    return /\/orders\/[^/]+$/.test(url) ? 'Loading order details…' : 'Loading orders…';
  }

  if (url.includes('/products') && m === 'GET')    return 'Loading products…';
  if (url.includes('/products') && m === 'DELETE') return 'Deleting product…';
  if (url.includes('/products'))                   return 'Saving product…';

  if (url.includes('/categories') && m === 'GET')    return 'Loading categories…';
  if (url.includes('/categories') && m === 'DELETE') return 'Deleting category…';
  if (url.includes('/categories'))                   return 'Saving category…';

  if (url.includes('/cart') && m === 'GET') return 'Loading cart…';
  if (url.includes('/cart'))                return 'Updating cart…';

  if (url.includes('/users') && m === 'GET') return 'Loading profile…';
  if (url.includes('/users'))                return 'Saving profile…';

  return 'Loading…';
}

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(LoaderService);
  loader.show(getMessage(req));
  return next(req).pipe(finalize(() => loader.hide()));
};
