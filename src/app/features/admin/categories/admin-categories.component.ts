import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CategoriesService } from '../../../core/services/categories.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category } from '../../../core/models/product.model';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
})
export class AdminCategoriesComponent implements OnInit {
  private categoriesService = inject(CategoriesService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  categories: Category[] = [];
  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.categoriesService.getAll().subscribe(cats => this.categories = cats);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.categoriesService.create(this.form.value as any).subscribe(() => {
      this.toast.success('Category added!');
      this.form.reset();
      this.load();
    });
  }

  delete(cat: Category): void {
    if (!confirm(`Delete "${cat.name}"?`)) return;
    this.categoriesService.delete(cat._id).subscribe(() => {
      this.toast.success('Category deleted');
      this.load();
    });
  }
}
