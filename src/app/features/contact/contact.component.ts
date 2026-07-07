import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SeoService } from '@app/core/services/seo.service';
import { BUSINESS } from '@app/core/constants/business.constants';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private seo = inject(SeoService);
  readonly biz = BUSINESS;

  name = '';
  email = '';
  message = '';
  submitted = signal(false);

  ngOnInit(): void {
    this.seo.update({
      title: 'Contact Us',
      description:
        'Get in touch with Bhavani Pickles. Reach us via phone, email, or WhatsApp for orders, queries, and support.',
      canonicalUrl: 'https://www.bhavanipickles.com/contact',
    });
  }

  onSubmit(): void {
    const subject = encodeURIComponent(`Message from ${this.name}`);
    const body = encodeURIComponent(
      `Name: ${this.name}\nEmail: ${this.email}\n\n${this.message}`,
    );
    window.open(`mailto:${this.biz.emailSupport}?subject=${subject}&body=${body}`);
    this.submitted.set(true);
  }
}
