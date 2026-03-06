import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CategoriesService } from '../../../core/services/categories.service';
import { Category } from '../../../core/models/product.model';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [ReactiveFormsModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatCardModule, MatSnackBarModule],
  template: `
    <div class="layout">
      <div>
        <h1>Categories</h1>
        <table mat-table [dataSource]="categories" class="full-width">
          <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let c">{{ c.name }}</td></ng-container>
          <ng-container matColumnDef="description"><th mat-header-cell *matHeaderCellDef>Description</th><td mat-cell *matCellDef="let c">{{ c.description }}</td></ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let c">
              <button mat-icon-button color="warn" (click)="delete(c)"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
      </div>
      <mat-card class="add-card">
        <mat-card-header><mat-card-title>Add Category</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3"></textarea>
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Add</button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    @media (max-width: 768px) { .layout { grid-template-columns: 1fr; } }
    .full-width { width: 100%; margin-bottom: 12px; }
    .add-card { padding: 8px; }
  `],
})
export class AdminCategoriesComponent implements OnInit {
  private categoriesService = inject(CategoriesService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  categories: Category[] = [];
  columns = ['name', 'description', 'actions'];
  form = this.fb.group({ name: ['', Validators.required], description: [''] });

  ngOnInit() {
    this.load();
  }

  load() {
    this.categoriesService.getAll().subscribe((cats) => (this.categories = cats));
  }

  submit() {
    if (this.form.invalid) return;
    this.categoriesService.create(this.form.value as any).subscribe(() => {
      this.snackBar.open('Category added!', 'Close', { duration: 2000 });
      this.form.reset();
      this.load();
    });
  }

  delete(cat: Category) {
    if (!confirm(`Delete "${cat.name}"?`)) return;
    this.categoriesService.delete(cat._id).subscribe(() => {
      this.snackBar.open('Deleted', 'Close', { duration: 2000 });
      this.load();
    });
  }
}
