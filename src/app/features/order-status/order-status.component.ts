import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-order-status',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './order-status.component.html',
  styleUrl: './order-status.component.scss',
})
export class OrderStatusComponent implements OnInit {
  private route = inject(ActivatedRoute);

  type: 'success' | 'failure' = 'success';
  orderId: string | null = null;

  ngOnInit(): void {
    this.type = (this.route.snapshot.queryParamMap.get('type') as any) ?? 'success';
    this.orderId = this.route.snapshot.queryParamMap.get('orderId');
  }
}
