import { Component, OnInit, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '@app/core/services/wishlist.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss',
})
export class WishlistComponent implements OnInit {
  readonly wishlistService = inject(WishlistService);
  private location = inject(Location);

  ngOnInit(): void {
    this.wishlistService.load();
  }

  goBack(): void { this.location.back(); }
}
