import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ErrorService } from './error.service';
import { WebsocketService, NotificationEvent } from './websocket.service';

export type AppNotification = {
  id: string;
  message: string;
  type: string;
  link: string | null;
  createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly loading = signal(false);

  constructor(
    private readonly http: HttpClient,
    private readonly errorService: ErrorService,
    private readonly wsService: WebsocketService,
  ) {
    this.loadUnread();
    this.listenForLive();
  }

  private loadUnread(): void {
    this.loading.set(true);
    this.http
      .get<AppNotification[]>(`${API_BASE_URL}/notifications`)
      .pipe(
        this.errorService.handleHttpError<AppNotification[]>(
          'Load notifications',
        ),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (items) => {
          this.notifications.set(items);
          this.unreadCount.set(items.length);
        },
        error: () => {
          // silently fail — bell just shows 0
        },
      });
  }

  private listenForLive(): void {
    this.wsService.notification$.subscribe((event) => {
      this.notifications.update((items) => [event, ...items]);
      this.unreadCount.update((count) => count + 1);
    });
  }

  markAllRead(): void {
    this.http
      .patch(`${API_BASE_URL}/notifications/read-all`, {})
      .subscribe({ error: () => {} });
    // Optimistically clear the badge immediately
    this.unreadCount.set(0);
  }
}
