import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  template: `
    <div class="skeleton-card" [class.skeleton-card--no-img]="!showImage">
      @if (showImage) {
        <div class="skeleton-card__img"></div>
      }
      <div class="skeleton-card__body">
        <div class="skeleton-card__line"></div>
        <div class="skeleton-card__line skeleton-card__line--short"></div>
        @if (showImage) {
          <div class="skeleton-card__line skeleton-card__line--xs"></div>
        }
      </div>
    </div>
  `,
  styleUrl: './skeleton-card.component.scss',
})
export class SkeletonCardComponent {
  @Input() showImage = true;
}
