import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, SignUpRequest, LoginRequest, AuthResponse } from '../../models';
import { ApiAuthService } from '../api/auth-api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private apiAuthService: ApiAuthService
  ) {}

  signup(signupRequest: SignUpRequest): Observable<AuthResponse> {
    return this.apiAuthService.signup(signupRequest).pipe(
      tap((response: AuthResponse) => {
        this.setUser(response);
      })
    );
  }

  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    return this.apiAuthService.login(loginRequest).pipe(
      tap((response: AuthResponse) => {
        this.setUser(response);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.userSubject.next(null);
  }

  setUser(data: AuthResponse): void {
    const user: User = {
      id: data.id,
      fullName: data.fullName,
      email: data.email,
      persona: data.persona,
      token: data.token,
    };
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(user));
    this.userSubject.next(user);
  }

  getUser(): User | null {
    return this.userSubject.getValue();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }
}
