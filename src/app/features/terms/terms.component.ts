import { Component } from '@angular/core';
import { BUSINESS } from '@app/core/constants/business.constants';

@Component({
  selector: 'app-terms',
  standalone: true,
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.scss',
})
export class TermsComponent {
  readonly biz = BUSINESS;
}
