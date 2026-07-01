import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { ChannelService, ChannelType } from '../../core/services/channel.service';

type ChannelView = {
  type: ChannelType;
  isConnected: boolean;
  connectedAt: string | null;
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly channels = signal<ChannelView[]>([]);
  protected readonly connecting = signal(false);
  protected readonly disconnectingType = signal<ChannelType | null>(null);
  protected readonly isModalOpen = signal(false);
  protected readonly selectedChannel = signal<ChannelType>('whatsapp');
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly profileForm = this.formBuilder.nonNullable.group({
    businessName: ['', [Validators.required]],
    ownerEmail: ['', [Validators.required, Validators.email]],
    location: ['Lagos Hub', [Validators.required]],
  });

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
    private readonly authService: AuthService,
    private readonly channelService: ChannelService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.profileForm.patchValue({
      businessName: 'SmartCX Demo Retail',
      ownerEmail: user?.email ?? '',
      location: 'Lagos Hub',
    });

    this.refreshData();
  }

  protected refreshData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.channelService.listChannels().subscribe({
      next: (items) => {
        this.channels.set(
          items.map((item) => ({
            type: item.type,
            isConnected: item.isConnected,
            connectedAt: item.connectedAt,
          })),
        );
      },
      complete: () => {
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.loading.set(false);
      },
    });
  }

  protected openChannelModal(type: ChannelType): void {
    this.selectedChannel.set(type);
    this.errorMessage.set(null);
    this.isModalOpen.set(true);
  }

  protected closeChannelModal(): void {
    this.isModalOpen.set(false);
    this.connecting.set(false);
  }

  protected connectSelectedChannel(): void {
    if (this.connecting()) {
      return;
    }

    const type = this.selectedChannel();
    const credentials = this.getCredentialsForSelectedChannel(type);
    if (!credentials) {
      return;
    }

    this.connecting.set(true);
    this.channelService
      .connectChannel({ type, credentials })
      .pipe(finalize(() => this.connecting.set(false)))
      .subscribe({
        next: () => {
          this.closeChannelModal();
          this.refreshData();
          this.resetChannelForm(type);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        },
      });
  }

  protected isSelectedChannelFormInvalid(): boolean {
    const type = this.selectedChannel();
    if (type === 'whatsapp') {
      return this.whatsappForm.invalid;
    }
    if (type === 'instagram') {
      return this.instagramForm.invalid;
    }
    return this.emailForm.invalid;
  }

  protected resetConnection(type: ChannelType): void {
    if (this.disconnectingType()) {
      return;
    }

    this.disconnectingType.set(type);
    this.channelService
      .disconnectChannel(type)
      .pipe(finalize(() => this.disconnectingType.set(null)))
      .subscribe({
        next: () => {
          this.refreshData();
          if (this.selectedChannel() === type) {
            this.isModalOpen.set(false);
          }
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        },
      });
  }

  private getCredentialsForSelectedChannel(type: ChannelType): Record<string, string> | null {
    if (type === 'whatsapp') {
      this.whatsappForm.markAllAsTouched();
      if (this.whatsappForm.invalid) {
        this.errorMessage.set('Enter valid WhatsApp credentials.');
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
        this.errorMessage.set('Enter valid Instagram credentials.');
        return null;
      }
      const values = this.instagramForm.getRawValue();
      return {
        appId: values.appId,
        appSecret: values.appSecret,
        pageAccessToken: values.pageAccessToken,
      };
    }

    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid) {
      this.errorMessage.set('Enter valid Email channel credentials.');
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

  private resetChannelForm(type: ChannelType): void {
    if (type === 'whatsapp') {
      this.whatsappForm.reset({
        phoneNumberId: '',
        accessToken: '',
        webhookVerifyToken: '',
      });
      return;
    }

    if (type === 'instagram') {
      this.instagramForm.reset({
        appId: '',
        appSecret: '',
        pageAccessToken: '',
      });
      return;
    }

    this.emailForm.reset({
      smtpHost: '',
      smtpPort: '587',
      smtpUser: '',
      smtpPassword: '',
      senderEmail: '',
    });
  }
}
