import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth.service';

// Custom validator for password matching
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-auth-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    RouterModule
  ],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class SignupComponent {
  hide = true;
  loading = false;
  error: string | null = null;
  fb = new FormBuilder();
  private authService = inject(AuthService);
  private router = inject(Router);

  signupForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
    persona: ['manager', Validators.required]
  }, { validators: passwordMatchValidator });

  onSubmit(): void {
    if (!this.signupForm.valid) {
      return;
    }

    this.loading = true;
    this.error = null;

    const formData = this.signupForm.value;
    const persona = this.normalizePersona(formData.persona);

    if (!persona) {
      this.loading = false;
      this.error = 'Please select a valid role.';
      return;
    }

    this.authService.signup({
      fullName: formData.fullName || '',
      email: formData.email || '',
      password: formData.password || '',
      persona
    }).pipe(
      timeout(15000),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: () => {
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.error = this.extractErrorMessage(err);
        console.error('Signup error:', err);
      }
    });
  }

  getPersonaLabel(value: string | null | undefined): string {
    const labels: { [key: string]: string } = {
      manager: 'Manager',
      freelancer: 'Freelancer'
    };

    if (!value) {
      return 'Select Role';
    }

    return labels[value] || 'Select Role';
  }

  private normalizePersona(value: string | null | undefined): string | null {
    const map: { [key: string]: string } = {
      manager: 'Manager',
      freelancer: 'Freelancer'
    };

    if (!value) {
      return null;
    }

    const key = value.toLowerCase();
    return map[key] || null;
  }

  private extractErrorMessage(err: any): string {
    if (err?.name === 'TimeoutError') {
      return 'Request timed out. Please check your connection and try again.';
    }

    if (err?.status === 0) {
      return 'Cannot reach server. Ensure backend is running on localhost:3000.';
    }

    const apiMessage = err?.error?.message;

    if (Array.isArray(apiMessage)) {
      return apiMessage.join(', ');
    }

    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      return apiMessage;
    }

    return 'Signup failed. Please try again.';
  }
}