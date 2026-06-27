import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    RouterModule
  ],
  standalone: true,
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  user: any;
  private router = inject(Router);

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.user = this.authService.getUser();
    
    // Redirect to login if not authenticated
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
