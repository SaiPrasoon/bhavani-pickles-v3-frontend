import { Component, OnInit, inject, signal } from '@angular/core';
import { CategoriesService } from '../../../core/services/categories.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { Category } from '../../../core/models/product.model';
import { CategoryFormComponent } from './category-form/category-form.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CategoryFormComponent],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
})
export class AdminCategoriesComponent implements OnInit {
  private categoriesService = inject(CategoriesService);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmService);

  categories = signal<Category[]>([]);
  saving = signal(false);
  showModal = signal(false);
  editingCategory = signal<Category | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.categoriesService.getAll().subscribe((cats) => this.categories.set(cats));
  }

  openAddModal(): void {
    this.editingCategory.set(null);
    this.showModal.set(true);
  }

  openEditModal(cat: Category): void {
    this.editingCategory.set(cat);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingCategory.set(null);
  }

  onFormSubmitted(fd: FormData): void {
    this.saving.set(true);
    const cat = this.editingCategory();
    const request$ = cat
      ? this.categoriesService.update(cat._id, fd)
      : this.categoriesService.create(fd);

    request$.subscribe({
      next: () => {
        this.toast.success(cat ? 'Category updated!' : 'Category added!');
        this.closeModal();
        this.load();
      },
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false),
    });
  }

  delete(cat: Category): void {
    this.confirmService.open({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${cat.name}"?`,
      confirmLabel: 'Delete',
      danger: true,
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.categoriesService.delete(cat._id).subscribe(() => {
        this.toast.success('Category deleted');
        this.load();
      });
    });
  }

  goBack(): void {
    window.history.back();
  }
}
