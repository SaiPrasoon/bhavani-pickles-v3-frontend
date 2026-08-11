import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-order-status',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './order-status.component.html',
  styleUrl: './order-status.component.scss',
})
export class OrderStatusComponent implements OnInit {
  private route = inject(ActivatedRoute);
  readonly authService = inject(AuthService);

  type: 'success' | 'failure' = 'success';
  orderId: string | null = null;

  ngOnInit(): void {
    this.type = (this.route.snapshot.queryParamMap.get('type') as any) ?? 'success';
    this.orderId = this.route.snapshot.queryParamMap.get('orderId');
  }
}
