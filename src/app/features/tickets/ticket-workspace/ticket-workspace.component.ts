import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { CustomerService } from '../../../core/services/customer.service';
import {
  Ticket,
  TicketStatus,
  TicketService,
  AuditLogEntry,
} from '../../../core/services/ticket.service';
import { ToastService } from '../../../core/services/toast.service';
import { TeamUser, UserService } from '../../../core/services/user.service';
import { CustomerBadgeComponent } from '../../../shared/components/customer-badge/customer-badge.component';
import { Priority } from '../../../core/services/ticket.service';

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
  protected readonly customerChannel = signal<
    'whatsapp' | 'instagram' | 'email' | null
  >(null);
  protected readonly customerStatus = signal<string | null>(null);
  protected readonly customerTotalSpent = signal<number | null>(null);
  protected readonly messages = signal<Message[]>([]);
  protected readonly availableAgents = signal<TeamUser[]>([]);
  protected readonly selectedAgentId = signal<string | null>(null);
  protected readonly selectedAgentName = computed(() => {
    const agentId = this.selectedAgentId();
    if (!agentId) {
      return 'Unassigned';
    }

    const agent = this.availableAgents().find((user) => user.id === agentId);
    return agent ? `${agent.firstName} ${agent.lastName}` : agentId;
  });
  protected readonly isAssigning = signal(false);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly draftMessage = signal('');
  protected readonly saving = signal(false);

  protected readonly activeTab = signal<'reply' | 'note'>('reply');

  protected readonly showHistory = signal(false);
  protected readonly history = signal<AuditLogEntry[]>([]);
  protected readonly loadingHistory = signal(false);

  protected readonly smartReplies = signal<string[]>([]);
  protected readonly loadingReplies = signal(false);
  protected readonly resolvedBy = signal<string | null>(null);
  constructor(
    private readonly route: ActivatedRoute,
    private readonly ticketService: TicketService,
    private readonly toastService: ToastService,
    private readonly customerService: CustomerService,
    private readonly userService: UserService,
  ) {}

  protected loadSmartReplies(): void {
    const activeTicket = this.ticket();
    if (!activeTicket) return;

    this.loadingReplies.set(true);
    this.ticketService
      .getSmartReplies(activeTicket.id)
      .pipe(finalize(() => this.loadingReplies.set(false)))
      .subscribe({
        next: (response) => this.smartReplies.set(response.replies),
        error: () => this.smartReplies.set([]),
      });
  }

  protected useSuggestedReply(reply: string): void {
    this.draftMessage.set(reply);
    this.smartReplies.set([]);
  }

  ngOnInit(): void {
    this.loadTicket();
    this.loadAgents();
  }

  protected readonly aiInsightClean = computed(() => {
    const raw = this.ticket()?.aiInsightSummary ?? '';
    return raw
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^\*\s+/gm, '• ')
      .trim();
  });

  protected readonly resolutionLines = computed(() => {
    const raw = this.ticket()?.resolutionSummary ?? '';
    return raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  });

  protected readonly resolutionSummaryClean = computed(() => {
    const raw = this.ticket()?.resolutionSummary ?? '';
    return raw
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^\*\s+/gm, '• ')
      .trim();
  });

  protected retry(): void {
    this.loadTicket();
  }

  protected setTab(tab: 'reply' | 'note'): void {
    this.activeTab.set(tab);
  }

  protected assignAgent(agentId: string | null): void {
    const activeTicket = this.ticket();
    if (!activeTicket || this.isAssigning()) {
      return;
    }

    this.isAssigning.set(true);
    this.ticketService
      .assignTicket(activeTicket.id, { assignedAgentId: agentId ?? '' })
      .pipe(finalize(() => this.isAssigning.set(false)))
      .subscribe({
        next: (ticket) => {
          this.ticket.set(ticket);
          this.selectedAgentId.set(ticket.assignedAgentId ?? null);
          this.toastService.success('Ticket assigned successfully.');
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.toastService.error(error.message);
        },
      });
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
        isInternalNote: this.activeTab() === 'note',
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (message) => {
          const isNote = this.activeTab() === 'note';
          this.messages.update((items) => [
            ...items,
            { sender: isNote ? 'note' : 'agent', text: message.content },
          ]);
          this.draftMessage.set('');
          this.toastService.success(isNote ? 'Note added.' : 'Message sent.');
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.toastService.error(error.message);
        },
      });
  }

  protected setPriority(event: Event): void {
    const activeTicket = this.ticket();
    if (!activeTicket) return;

    const priority = (event.target as HTMLSelectElement).value as Priority;

    this.ticketService
      .updateTicketPriority(activeTicket.id, priority)
      .subscribe({
        next: (ticket) => {
          this.ticket.set(ticket);
          this.toastService.success(`Priority set to ${priority}.`);
        },
        error: (error: Error) => {
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
          this.ticket.set(ticket);

          // Auto-load history if resolved to get resolver name
          if (ticket.status === 'resolved') {
            this.ticketService.getTicketHistory(ticket.id).subscribe({
              next: (entries) => {
                this.history.set(entries);
                const resolvedEntry = entries.find(
                  (e) => e.action === 'TICKET_RESOLVED',
                );
                if (resolvedEntry) this.resolvedBy.set(resolvedEntry.actorName);
              },
              error: () => {},
            });
          }

          this.customerService.getCustomerById(ticket.customerId).subscribe({
            next: (customer) => {
              console.log('Ticket received:', ticket);
              console.log('Messages in ticket:', ticket.messages);
              this.customerName.set(customer.name);
              this.customerEmail.set(
                customer.email ?? 'customer@smartcx.local',
              );
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
          this.selectedAgentId.set(ticket.assignedAgentId ?? null);
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

  private loadAgents(): void {
    this.userService.listUsers().subscribe({
      next: (users) => {
        this.availableAgents.set(users.filter((user) => user.role === 'agent'));
      },
      error: (error: Error) => {
        this.toastService.error(error.message);
      },
    });
  }

  protected toggleHistory(): void {
    if (this.showHistory()) {
      this.showHistory.set(false);
      return;
    }

    const activeTicket = this.ticket();
    if (!activeTicket) return;

    this.loadingHistory.set(true);
    this.showHistory.set(true);

    this.ticketService
      .getTicketHistory(activeTicket.id)
      .pipe(finalize(() => this.loadingHistory.set(false)))
      .subscribe({
        next: (entries) => this.history.set(entries),
        error: () => this.history.set([]),
      });
  }

  protected formatAction(action: string): string {
    const labels: Record<string, string> = {
      TICKET_CREATED: 'Ticket created',
      STATUS_CHANGED: 'Status changed',
      AGENT_ASSIGNED: 'Agent assigned',
      MESSAGE_SENT: 'Message sent',
      NOTE_ADDED: 'Internal note added',
      TICKET_RESOLVED: 'Ticket resolved',
      PRIORITY_CHANGED: 'Priority changed',
    };
    return labels[action] ?? action;
  }
}
