import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  NotificationService,
  AppNotification,
} from '../../../core/services/notification.service';

import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  protected readonly showNotifications = signal(false);

  protected readonly userInitials = computed(() => {
    const user = this.authService.getCurrentUser();
    if (!user) return 'AO';
    const parts = (user.email ?? '').split('@')[0].split(/[._-]/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  });

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    protected readonly notificationService: NotificationService,
  ) {}

  protected toggleNotifications(): void {
    const isOpening = !this.showNotifications();
    this.showNotifications.set(isOpening);
    if (isOpening && this.notificationService.unreadCount() > 0) {
      this.notificationService.markAllRead();
    }
  }

  protected navigateTo(notification: AppNotification): void {
    this.showNotifications.set(false);
    if (notification.link) {
      void this.router.navigateByUrl(notification.link);
    }
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
