import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  protected readonly navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Issue Queue', path: '/issues' },
    { label: 'Tickets', path: '/tickets' },
    { label: 'Team Members', path: '/team-members' },
    { label: 'Live Message', path: '/live-message' },
    { label: 'Settings', path: '/settings' },
  ];
}
