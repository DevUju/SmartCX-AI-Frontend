import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { CustomerService } from '../../../core/services/customer.service';
import { Ticket, TicketStatus, TicketService } from '../../../core/services/ticket.service';
import { ToastService } from '../../../core/services/toast.service';
import { CustomerBadgeComponent } from '../../../shared/components/customer-badge/customer-badge.component';

type Message = {
  sender: 'customer' | 'agent' | 'note';
  text: string;
};

@Component({
  selector: 'app-ticket-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CustomerBadgeComponent],
  templateUrl: './ticket-workspace.component.html',
  styleUrl: './ticket-workspace.component.css',
})
export class TicketWorkspaceComponent implements OnInit {
  protected readonly ticket = signal<Ticket | null>(null);
  protected readonly customerName = signal('Customer');
  protected readonly customerEmail = signal('customer@smartcx.local');
  protected readonly customerPhone = signal('+234 --- --- ----');
  protected readonly customerLocation = signal('N/A');
  protected readonly customerChannel = signal<'whatsapp' | 'instagram' | 'email' | null>(null);
  protected readonly customerStatus = signal<string | null>(null);
  protected readonly customerTotalSpent = signal<number | null>(null);
  protected readonly messages = signal<Message[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly draftMessage = signal('');
  protected readonly saving = signal(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly ticketService: TicketService,
    private readonly toastService: ToastService,
    private readonly customerService: CustomerService,
  ) {}

  ngOnInit(): void {
    this.loadTicket();
  }

  protected retry(): void {
    this.loadTicket();
  }

  protected setStatus(status: TicketStatus): void {
    const activeTicket = this.ticket();
    if (!activeTicket) {
      return;
    }

    this.ticketService.updateTicketStatus(activeTicket.id, status).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.toastService.success(`Ticket marked ${status}.`);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.toastService.error(error.message);
      },
    });
  }

  protected sendMessage(): void {
    const activeTicket = this.ticket();
    const content = this.draftMessage().trim();
    if (!activeTicket || !content) {
      return;
    }

    this.saving.set(true);
    this.ticketService
      .addTicketMessage(activeTicket.id, {
        content,
        senderType: 'agent',
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (message) => {
          this.messages.update((items) => [...items, { sender: 'agent', text: message.content }]);
          this.draftMessage.set('');
          this.toastService.success('Message sent.');
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.toastService.error(error.message);
        },
      });
  }

  private loadTicket(): void {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (!ticketId) {
      this.errorMessage.set('Ticket ID not found.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.ticketService
      .getTicket(ticketId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (ticket) => {
          this.customerService.getCustomerById(ticket.customerId).subscribe({
            next: (customer) => {
              this.customerName.set(customer.name);
              this.customerEmail.set(customer.email ?? 'customer@smartcx.local');
              this.customerPhone.set(customer.phone ?? '+234 --- --- ----');
              this.customerLocation.set(customer.location ?? 'N/A');
              this.customerChannel.set(customer.channel ?? null);
              this.customerStatus.set(customer.status ?? null);
              this.customerTotalSpent.set(customer.totalSpent ?? null);
            },
            error: () => {
              // Keep fallback customer labels if lookup fails.
            },
          });

          this.ticket.set(ticket);
          this.messages.set(
            ticket.messages.map((message) => ({
              sender:
                message.senderType === 'customer'
                  ? 'customer'
                  : message.isInternalNote
                    ? 'note'
                    : 'agent',
              text: message.content,
            })),
          );
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.toastService.error(error.message);
        },
      });
  }
}