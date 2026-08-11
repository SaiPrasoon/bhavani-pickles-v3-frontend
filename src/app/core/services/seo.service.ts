import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { BUSINESS } from '../constants/business.constants';
import { SeoConfig } from '../models/seo.model';

const DEFAULT_DESCRIPTION =
  'Bhavani Pickles — authentic handmade Telugu pickles from Hyderabad. Order avakaya, gongura, mango, and more online with pan-India delivery.';
const SITE_URL = 'https://www.bhavanipickles.com';
const DEFAULT_IMAGE = `${SITE_URL}/bhavani-pickles-logo.svg`;

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  update(config: SeoConfig): void {
    const pageTitle = config.title
      ? `${config.title} | ${BUSINESS.name}`
      : BUSINESS.name;
    const description = config.description ?? DEFAULT_DESCRIPTION;

    this.title.setTitle(pageTitle);

    this.meta.updateTag({ name: 'description', content: description });
    if (config.keywords) {
      this.meta.updateTag({ name: 'keywords', content: config.keywords });
    }

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({
      property: 'og:image',
      content: config.ogImage ?? DEFAULT_IMAGE,
    });
    this.meta.updateTag({
      property: 'og:type',
      content: config.ogType ?? 'website',
    });
    if (config.canonicalUrl) {
      this.meta.updateTag({ property: 'og:url', content: config.canonicalUrl });
    }

    // Twitter Card
    this.meta.updateTag({
      name: 'twitter:card',
      content: config.ogImage ? 'summary_large_image' : 'summary',
    });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({
      name: 'twitter:description',
      content: description,
    });
    this.meta.updateTag({
      name: 'twitter:image',
      content: config.ogImage ?? DEFAULT_IMAGE,
    });

    // Canonical URL
    this.setCanonical(config.canonicalUrl);

    // HTML lang attribute
    if (config.lang) {
      this.doc.documentElement.setAttribute('lang', config.lang);
    }

    // JSON-LD structured data
    this.setJsonLd(config.jsonLd);
  }

  private setCanonical(url?: string): void {
    let link = this.doc.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (url) {
      if (!link) {
        link = this.doc.createElement('link');
        link.setAttribute('rel', 'canonical');
        this.doc.head.appendChild(link);
      }
      link.setAttribute('href', url);
    } else {
      link?.remove();
    }
  }

  private setJsonLd(data?: Record<string, unknown>): void {
    const existing = this.doc.querySelector('script[type="application/ld+json"]#seo-jsonld');
    existing?.remove();

    if (!data) return;

    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'seo-jsonld';
    script.textContent = JSON.stringify(data);
    this.doc.head.appendChild(script);
  }
}
