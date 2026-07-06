import { Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-about',
  standalone: true,
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.update({
      title: 'About Us',
      description:
        'Learn about Bhavani Pickles — our story, tradition, and commitment to authentic handmade Telugu pickles from Hyderabad.',
      canonicalUrl: 'https://www.bhavanipickles.com/about',
    });
  }
}
