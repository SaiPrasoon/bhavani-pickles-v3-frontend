import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User, Address } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  activeTab = signal<'info' | 'addresses' | 'security'>('info');
  user = signal<User | null>(null);
  showAddressForm = signal(false);
  savingInfo = signal(false);
  savingPassword = signal(false);
  savingAddress = signal(false);

  infoForm = this.fb.group({
    name: ['', Validators.required],
    phone: [''],
  });

  addressForm = this.fb.group({
    label: ['Home', Validators.required],
    line1: ['', Validators.required],
    line2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    phone: [''],
    isDefault: [false],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.passwordMatchValidator });

  ngOnInit(): void {
    this.userService.getProfile().subscribe(u => {
      this.user.set(u);
      this.infoForm.patchValue({ name: u.name, phone: u.phone ?? '' });
    });
  }

  setTab(tab: 'info' | 'addresses' | 'security'): void {
    this.activeTab.set(tab);
  }

  saveInfo(): void {
    if (this.infoForm.invalid) return;
    this.savingInfo.set(true);
    const { name, phone } = this.infoForm.value;
    this.userService.updateProfile({ name: name!, phone: phone ?? undefined }).subscribe({
      next: (u) => {
        this.user.set(u);
        this.toast.success('Profile updated');
        this.savingInfo.set(false);
      },
      error: () => this.savingInfo.set(false),
    });
  }

  submitAddress(): void {
    if (this.addressForm.invalid) return;
    this.savingAddress.set(true);
    const val = this.addressForm.value;
    const payload: Omit<Address, '_id'> = {
      label: val.label!,
      line1: val.line1!,
      line2: val.line2 ?? undefined,
      city: val.city!,
      state: val.state!,
      pincode: val.pincode!,
      phone: val.phone ?? undefined,
      isDefault: val.isDefault ?? false,
    };
    this.userService.addAddress(payload).subscribe({
      next: (u) => {
        this.user.set(u);
        this.addressForm.reset({ label: 'Home', isDefault: false });
        this.showAddressForm.set(false);
        this.toast.success('Address added');
        this.savingAddress.set(false);
      },
      error: () => this.savingAddress.set(false),
    });
  }

  deleteAddress(addressId: string): void {
    this.userService.deleteAddress(addressId).subscribe(u => {
      this.user.set(u);
      this.toast.success('Address removed');
    });
  }

  setDefault(addressId: string): void {
    this.userService.setDefaultAddress(addressId).subscribe(u => {
      this.user.set(u);
      this.toast.success('Default address updated');
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.savingPassword.set(true);
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.userService.changePassword(currentPassword!, newPassword!).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.toast.success('Password changed successfully');
        this.savingPassword.set(false);
      },
      error: () => this.savingPassword.set(false),
    });
  }

  private passwordMatchValidator(g: AbstractControl) {
    const pw = g.get('newPassword')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return pw === confirm ? null : { mismatch: true };
  }

  goBack(): void { window.history.back(); }
}
