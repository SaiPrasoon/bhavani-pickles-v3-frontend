import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!value) return null;
  const errors: Record<string, boolean> = {};
  if (value.length < 6)              errors['minLength'] = true;
  if (!/[A-Z]/.test(value))          errors['uppercase'] = true;
  if (!/\d/.test(value))             errors['number'] = true;
  if (!/[^A-Za-z0-9]/.test(value))   errors['special'] = true;
  return Object.keys(errors).length ? errors : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  done = signal(false);
  token = signal('');
  invalidToken = signal(false);

  showPassword = signal(false);
  showConfirm = signal(false);
  private passwordValue = signal('');

  form = this.fb.group(
    {
      password: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordsMatch },
  );

  get pw() { return this.form.get('password')!; }
  get confirmPw() { return this.form.get('confirmPassword')!; }

  /** Live rule checks — driven by a signal updated via valueChanges */
  rules = computed(() => {
    const v = this.passwordValue();
    return {
      minLength:  v.length >= 6,
      uppercase:  /[A-Z]/.test(v),
      number:     /\d/.test(v),
      special:    /[^A-Za-z0-9]/.test(v),
    };
  });

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (!t) { this.invalidToken.set(true); return; }
    this.token.set(t);
    this.pw.valueChanges.subscribe(v => this.passwordValue.set(v ?? ''));
  }

  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pw && confirm && pw !== confirm ? { mismatch: true } : null;
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.authService.resetPassword(this.token(), this.pw.value!).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message ?? 'Reset link is invalid or has expired.';
        this.toast.error(msg);
        if (err?.status === 400) this.invalidToken.set(true);
      },
    });
  }
}
