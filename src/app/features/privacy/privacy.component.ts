import { Component } from '@angular/core';
import { BUSINESS } from '@app/core/constants/business.constants';

@Component({
  selector: 'app-privacy',
  standalone: true,
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
})
export class PrivacyComponent {
  readonly biz = BUSINESS;
}
