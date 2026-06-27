import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ErrorService } from './error.service';

export type UserRole = 'super_admin' | 'admin' | 'agent';

export type AuthUser = {
  id: string;
  businessId: string;
  email: string;
  role: UserRole;
};

export type AuthResponse = {
  accessToken: string;
  expiresIn: string;
  user: AuthUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterBusinessRequest = {
  businessName: string;
  ownerName: string;
  phone: string;
  category: string;
  email: string;
  password: string;
};

const ACCESS_TOKEN_KEY = 'smartcx_access_token';
const AUTH_USER_KEY = 'smartcx_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private readonly http: HttpClient,
    private readonly errorService: ErrorService,
  ) {}

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, payload).pipe(
      tap((response) => this.storeSession(response)),
      this.errorService.handleHttpError<AuthResponse>('Login'),
    );
  }

  registerBusiness(payload: RegisterBusinessRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/business/register`, payload).pipe(
      tap((response) => this.storeSession(response)),
      this.errorService.handleHttpError<AuthResponse>('Business registration'),
    );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return Boolean(this.getAccessToken());
  }

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private storeSession(response: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
  }
}