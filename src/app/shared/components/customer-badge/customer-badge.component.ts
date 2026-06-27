import { CommonModule } from '@angular/common';
import { Component, Input, computed, input } from '@angular/core';

@Component({
  selector: 'app-customer-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-badge.component.html',
  styleUrl: './customer-badge.component.css',
})
export class CustomerBadgeComponent {
  /** Full customer name — used to derive initials */
  readonly name = input<string>('');

  /** channel: whatsapp | instagram | email */
  readonly channel = input<string | null | undefined>(undefined);

  /** status: new | active | vip | churned */
  readonly status = input<string | null | undefined>(undefined);

  /** Set true to suppress the channel chip */
  readonly hideChannel = input<boolean>(false);

  /** Set true to suppress the status chip */
  readonly hideStatus = input<boolean>(false);

  protected readonly initials = computed(() => {
    const parts = (this.name() ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  });

  protected readonly avatarColor = computed(() => {
    const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
    const code = (this.name() ?? '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[code % colors.length];
  });

  protected readonly channelLabel = computed(() => {
    const map: Record<string, string> = { whatsapp: 'WhatsApp', instagram: 'Instagram', email: 'Email' };
    return map[this.channel() ?? ''] ?? this.channel() ?? '';
  });

  protected readonly statusLabel = computed(() => {
    const s = (this.status() ?? '').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  });
}
