import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  text: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly current = signal<ToastMessage | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;

  show(text: string, type: ToastType = 'info', duration = 3000): void {
    if (this.timer) clearTimeout(this.timer);
    this.current.set({ text, type });
    this.timer = setTimeout(() => this.current.set(null), duration);
  }

  success(text: string): void { this.show(text, 'success'); }
  error(text: string): void { this.show(text, 'error'); }
  info(text: string): void { this.show(text, 'info'); }
}
