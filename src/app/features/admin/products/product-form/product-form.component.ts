import { Component, OnInit, input, output, signal, effect, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Product, Category } from '../../../../core/models/product.model';
import { CategoriesService } from '../../../../core/services/categories.service';

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

  submitted = output<Partial<Product>>();
  cancelled = output<void>();

  private fb = new FormBuilder();
  private categoriesService = inject(CategoriesService);

  categories = signal<Category[]>([]);

  form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    discountPrice: [null as number | null],
    category: ['', Validators.required],
    stock: [null as number | null, [Validators.required, Validators.min(0)]],
    weight: [''],
    ingredients: [''],
    tags: [''],
    isActive: [true],
  });

  constructor() {
    effect(() => {
      const p = this.product();
      this.form.patchValue({
        name: p?.name ?? '',
        description: p?.description ?? '',
        price: p?.price ?? null,
        discountPrice: p?.discountPrice ?? null,
        category: p?.category?._id ?? '',
        stock: p?.stock ?? null,
        weight: p?.weight ?? '',
        ingredients: p?.ingredients ?? '',
        tags: p?.tags?.join(', ') ?? '',
        isActive: p?.isActive ?? true,
      });
    });
  }

  ngOnInit(): void {
    this.categoriesService.getAll().subscribe((cats) => this.categories.set(cats));
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const data: Partial<Product> = {
      name: v.name!,
      description: v.description!,
      price: v.price!,
      category: v.category as unknown as Category,
      stock: v.stock!,
      isActive: v.isActive ?? true,
    };
    if (v.discountPrice != null) data.discountPrice = v.discountPrice;
    if (v.weight) data.weight = v.weight;
    if (v.ingredients) data.ingredients = v.ingredients;
    data.tags = v.tags ? v.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    this.submitted.emit(data);
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
