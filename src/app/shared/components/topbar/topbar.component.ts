import { Component, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
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
  ) {}

  protected logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}