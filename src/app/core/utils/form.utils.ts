import { AbstractControl, FormGroup } from '@angular/forms';

/**
 * Returns true if a form field has been touched and has the given error (or is invalid if no error specified).
 */
export function hasError(form: FormGroup, field: string, error?: string): boolean {
  const control: AbstractControl | null = form.get(field);
  if (!control || !control.touched) return false;
  return error ? control.hasError(error) : control.invalid;
}
