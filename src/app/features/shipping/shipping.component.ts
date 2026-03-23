import { Component } from '@angular/core';
import { BUSINESS } from '../../core/constants/business.constants';

@Component({
  selector: 'app-shipping',
  standalone: true,
  templateUrl: './shipping.component.html',
  styleUrl: './shipping.component.scss',
})
export class ShippingComponent {
  readonly biz = BUSINESS;
}
