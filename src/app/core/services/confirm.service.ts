import { Injectable, signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { ConfirmConfig } from '../models/confirm.model';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private _subject: Subject<boolean> | null = null;

  readonly config = signal<ConfirmConfig | null>(null);

  open(cfg: ConfirmConfig): Observable<boolean> {
    this.config.set({ confirmLabel: 'Confirm', cancelLabel: 'Cancel', danger: false, ...cfg });
    this._subject = new Subject<boolean>();
    return this._subject.asObservable();
  }

  resolve(result: boolean): void {
    this.config.set(null);
    this._subject?.next(result);
    this._subject?.complete();
    this._subject = null;
  }
}
