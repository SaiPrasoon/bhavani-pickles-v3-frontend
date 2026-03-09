import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

function extractMessage(err: HttpErrorResponse): string {
  const body = err.error;

  // NestJS validation errors return message as string array
  if (Array.isArray(body?.message)) return body.message[0];
  if (typeof body?.message === 'string') return body.message;
  if (typeof body?.error === 'string' && body.error !== 'Unauthorized') return body.error;

  switch (err.status) {
    case 0:   return 'Network error — please check your connection.';
    case 401: return 'Session expired — please log in again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'Requested resource not found.';
    case 409: return 'Conflict — this record already exists.';
    case 422: return 'Invalid data sent to the server.';
    case 429: return 'Too many requests — please slow down.';
  }

  if (err.status >= 500) return 'Server error — please try again later.';
  return err.statusText || 'Something went wrong.';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      toast.error(extractMessage(err));
      return throwError(() => err);
    }),
  );
};
