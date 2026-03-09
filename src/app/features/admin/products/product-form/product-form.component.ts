import { Component, OnInit, input, output, signal, effect, inject } from '@angular/core';
import { FormBuilder, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { switchMap, of } from 'rxjs';
import { Product, Category } from '../../../../core/models/product.model';
import { CategoriesService } from '../../../../core/services/categories.service';
import { UploadService } from '../../../../core/services/upload.service';

export interface ProductSubmitPayload {
  name: string;
  description: string;
  category: string;
  variants: { weight: string; quantity: number; price: number; discountedPrice?: number; stock: number }[];
  images: string[];
  isActive: boolean;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
})
export class ProductFormComponent implements OnInit {
  product = input<Product | null>(null);
  saving = input(false);

  submitted = output<ProductSubmitPayload>();
  cancelled = output<void>();

  private fb = inject(FormBuilder);
  private categoriesService = inject(CategoriesService);
  private uploadService = inject(UploadService);

  categories = signal<Category[]>([]);
  uploading = signal(false);

  // Images
  existingImages = signal<string[]>([]);
  selectedFiles = signal<File[]>([]);
  previewUrls = signal<string[]>([]);

  form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    category: ['', Validators.required],
    isActive: [true],
    variants: this.fb.array([this.newVariantGroup()]),
  });

  constructor() {
    effect(() => {
      const p = this.product();
      this.form.patchValue({
        name: p?.name ?? '',
        description: p?.description ?? '',
        category: p?.category?._id ?? '',
        isActive: p?.isActive ?? true,
      });

      // Rebuild variants array from product
      this.variantsArray.clear();
      const variants = p?.variants?.length ? p.variants : [null];
      variants.forEach(v => {
        this.variantsArray.push(this.fb.group({
          weight: [v?.weight ?? '', Validators.required],
          quantity: [v?.quantity ?? null as number | null, [Validators.required, Validators.min(1)]],
          price: [v?.price ?? null as number | null, [Validators.required, Validators.min(0)]],
          discountedPrice: [v?.discountedPrice ?? null as number | null],
          stock: [v?.stock ?? null as number | null, [Validators.required, Validators.min(0)]],
        }));
      });

      // Set existing images
      this.existingImages.set(p?.images ?? []);
      this.selectedFiles.set([]);
      this.previewUrls.set([]);
    });
  }

  ngOnInit(): void {
    this.categoriesService.getAll().subscribe(cats => this.categories.set(cats));
  }

  get variantsArray(): FormArray {
    return this.form.get('variants') as FormArray;
  }

  newVariantGroup() {
    return this.fb.group({
      weight: ['', Validators.required],
      quantity: [null as number | null, [Validators.required, Validators.min(1)]],
      price: [null as number | null, [Validators.required, Validators.min(0)]],
      discountedPrice: [null as number | null],
      stock: [null as number | null, [Validators.required, Validators.min(0)]],
    });
  }

  addVariant(): void {
    this.variantsArray.push(this.newVariantGroup());
  }

  removeVariant(i: number): void {
    if (this.variantsArray.length > 1) this.variantsArray.removeAt(i);
  }

  onFilesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    this.selectedFiles.update(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => this.previewUrls.update(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removeNewImage(i: number): void {
    this.selectedFiles.update(files => files.filter((_, idx) => idx !== i));
    this.previewUrls.update(urls => urls.filter((_, idx) => idx !== i));
  }

  removeExistingImage(i: number): void {
    this.existingImages.update(imgs => imgs.filter((_, idx) => idx !== i));
  }

  submit(): void {
    if (this.form.invalid) return;
    this.uploading.set(true);

    const uploadOrSkip$ = this.selectedFiles().length
      ? this.uploadService.uploadImages(this.selectedFiles(), 'products')
      : of({ urls: [] as string[] });

    uploadOrSkip$.pipe(
      switchMap(({ urls }) => {
        const v = this.form.value;
        const payload: ProductSubmitPayload = {
          name: v.name!,
          description: v.description!,
          category: v.category!,
          isActive: v.isActive ?? true,
          variants: (v.variants ?? []).map(vr => ({
            weight: (vr as any).weight,
            quantity: (vr as any).quantity,
            price: (vr as any).price,
            discountedPrice: (vr as any).discountedPrice ?? undefined,
            stock: (vr as any).stock,
          })),
          images: [...this.existingImages(), ...urls],
        };
        this.submitted.emit(payload);
        return of(null);
      }),
    ).subscribe({
      error: () => this.uploading.set(false),
      complete: () => this.uploading.set(false),
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
