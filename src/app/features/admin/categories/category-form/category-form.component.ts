import { Component, input, output, signal, effect } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../../../core/models/product.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.scss',
})
export class CategoryFormComponent {
  category = input<Category | null>(null);
  saving = input(false);

  submitted = output<FormData>();
  cancelled = output<void>();

  private fb = new FormBuilder();

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  constructor() {
    effect(() => {
      const cat = this.category();
      this.form.patchValue({ name: cat?.name ?? '', description: cat?.description ?? '' });
      this.selectedFile.set(null);
      this.previewUrl.set(cat?.image ?? null);
    });
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile.set(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.previewUrl.set(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      this.previewUrl.set(this.category()?.image ?? null);
    }
  }

  clearFile(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(this.category()?.image ?? null);
  }

  submit(): void {
    if (this.form.invalid) return;
    const fd = new FormData();
    fd.append('name', this.form.value.name!);
    if (this.form.value.description) fd.append('description', this.form.value.description);
    if (this.selectedFile()) fd.append('image', this.selectedFile()!);
    this.submitted.emit(fd);
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
