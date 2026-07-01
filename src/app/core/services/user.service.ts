import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { ErrorService } from './error.service';

export type UserRole = 'super_admin' | 'admin' | 'agent';

export type TeamUser = {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isOnline: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InviteUserRequest = {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  temporaryPassword: string;
};

export type UpdateUserRequest = {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isOnline?: boolean;
};

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(
    private readonly http: HttpClient,
    private readonly errorService: ErrorService,
  ) {}

  listUsers(): Observable<TeamUser[]> {
    return this.http
      .get<TeamUser[]>(`${API_BASE_URL}/users`)
      .pipe(this.errorService.handleHttpError<TeamUser[]>('List users'));
  }

  inviteUser(payload: InviteUserRequest): Observable<TeamUser> {
    return this.http
      .post<TeamUser>(`${API_BASE_URL}/users/invite`, payload)
      .pipe(this.errorService.handleHttpError<TeamUser>('Invite user'));
  }

  updateUser(userId: string, payload: UpdateUserRequest): Observable<TeamUser> {
    return this.http
      .patch<TeamUser>(`${API_BASE_URL}/users/${userId}`, payload)
      .pipe(this.errorService.handleHttpError<TeamUser>('Update user'));
  }
}
