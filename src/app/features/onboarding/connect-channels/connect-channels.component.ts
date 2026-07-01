import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ChannelService, ChannelType } from '../../../core/services/channel.service';

type ChannelCard = {
  type: ChannelType;
  title: string;
  description: string;
  icon: string;
};

@Component({
  selector: 'app-connect-channels',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './connect-channels.component.html',
  styleUrl: './connect-channels.component.css',
})
export class ConnectChannelsComponent {
  protected readonly isSubmitting = signal(false);
  protected readonly connected = signal<Record<ChannelType, boolean>>({
    whatsapp: false,
    instagram: false,
    email: false,
  });
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly channels: ChannelCard[] = [
    {
      type: 'whatsapp',
      title: 'WhatsApp Business',
      description: 'Sync customer chats and delivery complaint updates in real time.',
      icon: 'WA',
    },
    {
      type: 'instagram',
      title: 'Instagram',
      description: 'Capture DMs and comments that require fast support follow-up.',
      icon: 'IG',
    },
    {
      type: 'email',
      title: 'Email Support',
      description: 'Route customer emails directly into the issue queue.',
      icon: '📧',
    },
  ];

  protected readonly whatsappForm = this.formBuilder.nonNullable.group({
    phoneNumberId: ['', [Validators.required]],
    accessToken: ['', [Validators.required, Validators.minLength(20)]],
    webhookVerifyToken: ['', [Validators.required]],
  });

  protected readonly instagramForm = this.formBuilder.nonNullable.group({
    appId: ['', [Validators.required]],
    appSecret: ['', [Validators.required]],
    pageAccessToken: ['', [Validators.required, Validators.minLength(20)]],
  });

  protected readonly emailForm = this.formBuilder.nonNullable.group({
    smtpHost: ['', [Validators.required]],
    smtpPort: ['587', [Validators.required]],
    smtpUser: ['', [Validators.required, Validators.email]],
    smtpPassword: ['', [Validators.required, Validators.minLength(8)]],
    senderEmail: ['', [Validators.required, Validators.email]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly channelService: ChannelService,
    private readonly router: Router,
  ) {
    this.loadChannels();
  }

  protected connectChannel(type: ChannelType): void {
    if (this.connected()[type] || this.isSubmitting()) {
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const credentials = this.getCredentialsForChannel(type);
    if (!credentials) {
      this.isSubmitting.set(false);
      return;
    }

    this.channelService
      .connectChannel({
        type,
        credentials,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.connected.update((current) => ({ ...current, [type]: true }));
          if (type === 'whatsapp') {
            this.whatsappForm.reset({ phoneNumberId: '', accessToken: '', webhookVerifyToken: '' });
          }
          if (type === 'instagram') {
            this.instagramForm.reset({ appId: '', appSecret: '', pageAccessToken: '' });
          }
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        },
      });
  }

  protected isChannelFormInvalid(type: ChannelType): boolean {
    if (type === 'whatsapp') {
      return this.whatsappForm.invalid;
    }
    if (type === 'instagram') {
      return this.instagramForm.invalid;
    }
    return true;
  }

  protected finishSetup(): void {
    void this.router.navigateByUrl('/dashboard');
  }

  private loadChannels(): void {
    this.channelService.listChannels().subscribe({
      next: (items) => {
        const state: Record<ChannelType, boolean> = {
          whatsapp: false,
          instagram: false,
          email: false,
        };

        items.forEach((channel) => {
          state[channel.type] = channel.isConnected;
        });

        this.connected.set(state);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
      },
    });
  }

  private getCredentialsForChannel(type: ChannelType): Record<string, string> | null {
    if (type === 'whatsapp') {
      this.whatsappForm.markAllAsTouched();
      if (this.whatsappForm.invalid) {
        this.errorMessage.set('Enter valid WhatsApp credentials before connecting.');
        return null;
      }

      const values = this.whatsappForm.getRawValue();
      return {
        phoneNumberId: values.phoneNumberId,
        accessToken: values.accessToken,
        webhookVerifyToken: values.webhookVerifyToken,
      };
    }

    if (type === 'instagram') {
      this.instagramForm.markAllAsTouched();
      if (this.instagramForm.invalid) {
        this.errorMessage.set('Enter valid Instagram credentials before connecting.');
        return null;
      }

      const values = this.instagramForm.getRawValue();
      return {
        appId: values.appId,
        appSecret: values.appSecret,
        pageAccessToken: values.pageAccessToken,
      };
    }

    if (type === 'email') {
      this.emailForm.markAllAsTouched();
      if (this.emailForm.invalid) {
        this.errorMessage.set('Enter valid Email credentials before connecting.');
        return null;
      }

      const values = this.emailForm.getRawValue();
      return {
        smtpHost: values.smtpHost,
        smtpPort: values.smtpPort,
        smtpUser: values.smtpUser,
        smtpPassword: values.smtpPassword,
        senderEmail: values.senderEmail,
      };
    }

    this.errorMessage.set('Unsupported channel type for onboarding connection.');
    return null;
  }
}
