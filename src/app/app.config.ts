import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter, withInMemoryScrolling, withNavigationErrorHandler } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loaderInterceptor } from './core/interceptors/loader.interceptor';
import { environment } from '@env/environment';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

// Guard: warn if API URL doesn't match environment
if (!environment.production && environment.apiUrl.includes('api.bhavanipickles.com')) {
  console.warn(
    `[ENV MISMATCH] Non-production build (${environment.envName}) is pointing to PRODUCTION API: ${environment.apiUrl}`,
  );
}
if (environment.production && environment.apiUrl.includes('localhost')) {
  console.warn(
    `[ENV MISMATCH] Production build is pointing to localhost API: ${environment.apiUrl}`,
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      withNavigationErrorHandler(() => {
        if (typeof window !== 'undefined') window.location.reload();
      }),
    ),
    provideHttpClient(
      withInterceptors([loaderInterceptor, authInterceptor, errorInterceptor]),
      withFetch(),
    ),
    provideClientHydration(withEventReplay()),
  ],
};
