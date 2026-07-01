import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-ticket-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-badge.component.html',
  styleUrl: './ticket-badge.component.css',
})
export class TicketBadgeComponent {
  readonly priority = input<'low' | 'medium' | 'high' | 'urgent' | null>(null);
  readonly status = input<'open' | 'pending' | 'escalated' | 'resolved' | null>(null);
}
