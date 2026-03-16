import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cancel-reason-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cancel-reason-modal.component.html',
  styleUrl: './cancel-reason-modal.component.scss',
})
export class CancelReasonModalComponent {
  @Input() loading = false;
  @Output() confirmed = new EventEmitter<string | undefined>();
  @Output() dismissed = new EventEmitter<void>();

  reason = signal('');

  confirm(): void {
    this.confirmed.emit(this.reason() || undefined);
  }
}
