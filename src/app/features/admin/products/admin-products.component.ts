import { Component, OnInit, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ProductsService } from '../../../core/services/products.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatDialogModule],
  template: `
    <div class="header">
      <h1>Products</h1>
    </div>
    <table mat-table [dataSource]="products" class="full-width">
      <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let p">{{ p.name }}</td></ng-container>
      <ng-container matColumnDef="category"><th mat-header-cell *matHeaderCellDef>Category</th><td mat-cell *matCellDef="let p">{{ p.category?.name }}</td></ng-container>
      <ng-container matColumnDef="price"><th mat-header-cell *matHeaderCellDef>Price</th><td mat-cell *matCellDef="let p">₹{{ p.price }}</td></ng-container>
      <ng-container matColumnDef="stock"><th mat-header-cell *matHeaderCellDef>Stock</th><td mat-cell *matCellDef="let p">{{ p.stock }}</td></ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let p">
          <button mat-icon-button color="warn" (click)="delete(p)"><mat-icon>delete</mat-icon></button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns;"></tr>
    </table>
  `,
  styles: [`.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; } .full-width { width: 100%; }`],
})
export class AdminProductsComponent implements OnInit {
  private productsService = inject(ProductsService);
  private snackBar = inject(MatSnackBar);
  products: Product[] = [];
  columns = ['name', 'category', 'price', 'stock', 'actions'];

  ngOnInit() {
    this.productsService.getAll({ limit: 100 }).subscribe((res) => (this.products = res.items));
  }

  delete(product: Product) {
    if (!confirm(`Delete "${product.name}"?`)) return;
    this.productsService.delete(product._id).subscribe(() => {
      this.products = this.products.filter((p) => p._id !== product._id);
      this.snackBar.open('Product deleted', 'Close', { duration: 2000 });
    });
  }
}
