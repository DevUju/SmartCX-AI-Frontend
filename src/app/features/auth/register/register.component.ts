import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly categories = ['Retail', 'Logistics', 'Healthcare', 'E-commerce', 'Fintech'];

  protected readonly form = this.formBuilder.nonNullable.group({
    businessName: ['', [Validators.required]],
    ownerName: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    category: ['Retail', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
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

  protected submit(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) {
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    this.authService
      .registerBusiness({
        businessName: this.form.controls.businessName.value,
        ownerName: this.form.controls.ownerName.value,
        phone: `+234${this.form.controls.phone.value}`,
        category: this.form.controls.category.value,
        email: this.form.controls.email.value,
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