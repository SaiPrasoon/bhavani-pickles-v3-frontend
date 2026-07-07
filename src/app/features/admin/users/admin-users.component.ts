import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UserService } from '@app/core/services/user.service';
import { ToastService } from '@app/core/services/toast.service';
import { User } from '@app/core/models/user.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private userService = inject(UserService);
  private toast = inject(ToastService);

  users = signal<User[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load users');
        this.loading.set(false);
      },
    });
  }

  deactivateUser(user: User): void {
    if (!confirm(`Deactivate "${user.name}"? They will no longer be able to log in.`)) return;
    this.userService.deleteUser(user._id).subscribe({
      next: () => {
        this.toast.success('User deactivated');
        this.users.update(list => list.filter(u => u._id !== user._id));
      },
      error: () => this.toast.error('Failed to deactivate user'),
    });
  }

  goBack(): void {
    window.history.back();
  }
}
