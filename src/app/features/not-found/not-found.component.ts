import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found">
      <span class="not-found__code">404</span>
      <h1 class="not-found__title">Page not found</h1>
      <p class="not-found__text">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a routerLink="/home" class="btn btn--primary not-found__btn">
        <span class="material-symbols-rounded">home</span>
        Back to Home
      </a>
    </div>
  `,
  styles: `
    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      padding: 40px 20px;

      &__code {
        font-size: 8rem;
        font-weight: 800;
        line-height: 1;
        color: var(--c-primary, #950220);
        opacity: 0.15;
      }

      &__title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-top: -12px;
        color: var(--c-text);
      }

      &__text {
        color: var(--c-text-muted);
        margin-top: 8px;
        font-size: 0.95rem;
      }

      &__btn {
        margin-top: 24px;
        display: inline-flex;
        align-items: center;
        gap: 6px;

        .material-symbols-rounded { font-size: 1.1rem; }
      }
    }
  `,
})
export class NotFoundComponent {}
