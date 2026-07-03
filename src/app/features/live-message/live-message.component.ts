import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { ToastService } from '../../core/services/toast.service';
import { API_BASE_URL } from '../../core/config/api.config';

type Channel = 'whatsapp' | 'instagram' | 'email';

@Component({
  selector: 'app-live-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './live-message.component.html',
  styleUrl: './live-message.component.css',
})
export class LiveMessageComponent {
  protected readonly activeChannel = signal<Channel>('whatsapp');
  protected readonly sending = signal(false);

  protected customerName = '';
  protected phone = '';
  protected email = '';
  protected message = '';

  private readonly businessId = '92d7b76c-305f-40f4-ba75-28cf7b876e41';

  constructor(
    private readonly http: HttpClient,
    private readonly toastService: ToastService,
  ) {}

  protected setChannel(channel: Channel): void {
    this.activeChannel.set(channel);
    // Reset contact fields when switching channel
    this.phone = '';
    this.email = '';
  }

  protected send(): void {
    if (!this.customerName.trim() || !this.message.trim()) {
      this.toastService.error('Customer name and message are required.');
      return;
    }

    const channel = this.activeChannel();

    if (
      (channel === 'whatsapp' || channel === 'instagram') &&
      !this.phone.trim()
    ) {
      this.toastService.error(
        'Phone number is required for WhatsApp and Instagram.',
      );
      return;
    }

    if (channel === 'email' && !this.email.trim()) {
      this.toastService.error('Email is required for email channel.');
      return;
    }

    const endpoint =
      channel === 'email'
        ? `${API_BASE_URL}/webhooks/email`
        : `${API_BASE_URL}/webhooks/${channel}`;

    const payload = {
      businessId: this.businessId,
      customerName: this.customerName.trim(),
      phone: this.phone.trim() || undefined,
      email: this.email.trim() || undefined,
      message: this.message.trim(),
    };

    this.sending.set(true);
    this.http
      .post(endpoint, payload)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: () => {
          this.toastService.success('Message sent! Check the Issue Queue.');
          this.message = '';
        },
        error: () => {
          this.toastService.error('Failed to send message.');
        },
      });
  }
}
