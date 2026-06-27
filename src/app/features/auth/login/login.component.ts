import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  protected readonly isSubmitting = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    identity: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected get canSubmit(): boolean {
    return this.form.valid && !this.isSubmitting();
  }

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  protected togglePasswordVisibility(): void {
    this.showPassword.update((state) => !state);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) {
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    this.authService
      .login({
        email: this.form.controls.identity.value.trim(),
        password: this.form.controls.password.value,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/dashboard');
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        },
      });
  }
}