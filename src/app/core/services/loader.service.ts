import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private _count = 0;

  readonly isLoading = signal(false);
  readonly message = signal('Loading…');

  show(msg = 'Loading…'): void {
    this._count++;
    this.message.set(msg);
    this.isLoading.set(true);
  }

  hide(): void {
    this._count = Math.max(0, this._count - 1);
    if (this._count === 0) {
      this.isLoading.set(false);
    }
  }
}
