import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  hide = true;
  loading = false;
  error: string | null = null;
  private fb: FormBuilder = new FormBuilder();
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {}

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (!this.loginForm.valid) {
      return;
    }

    this.loading = true;
    this.error = null;
    const formData = this.loginForm.value;

    this.authService.login({
      email: formData.email || '',
      password: formData.password || ''
    }).pipe(
      timeout(15000),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: () => {
        this.router.navigate(['/daily']);
      },
      error: (err) => {
        this.error = this.extractErrorMessage(err);
        console.error('Login error:', err);
      }
    });
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

    return 'Login failed. Please try again.';
  }
}
