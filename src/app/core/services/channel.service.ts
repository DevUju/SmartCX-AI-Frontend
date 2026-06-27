import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { ErrorService } from './error.service';

export type ChannelType = 'whatsapp' | 'instagram' | 'email';

export type Channel = {
  id: string;
  businessId: string;
  type: ChannelType;
  credentials: Record<string, string>;
  isConnected: boolean;
  connectedAt: string | null;
  createdAt: string;
};

export type ConnectChannelRequest = {
  type: ChannelType;
  credentials: Record<string, string>;
};

@Injectable({ providedIn: 'root' })
export class ChannelService {
  constructor(
    private readonly http: HttpClient,
    private readonly errorService: ErrorService,
  ) {}

  listChannels(): Observable<Channel[]> {
    return this.http
      .get<Channel[]>(`${API_BASE_URL}/channels`)
      .pipe(this.errorService.handleHttpError<Channel[]>('List channels'));
  }

  connectChannel(payload: ConnectChannelRequest): Observable<Channel> {
    return this.http
      .post<Channel>(`${API_BASE_URL}/channels/connect`, payload)
      .pipe(this.errorService.handleHttpError<Channel>('Connect channel'));
  }
}