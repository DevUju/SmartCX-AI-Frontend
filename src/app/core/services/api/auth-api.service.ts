import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  SignUpRequest,
  User,
} from '../../models';

const API_URL = 'http://localhost:3000/auth';

@Injectable({
  providedIn: 'root',
})
export class ApiAuthService {
  constructor(private http: HttpClient) {}

  signup(signupRequest: SignUpRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/signup`, signupRequest);
  }

  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/login`, loginRequest);
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${API_URL}/me`);
  }
}
