import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { CustomerService } from '../../../core/services/customer.service';
import { Priority, TicketService, TicketStatus } from '../../../core/services/ticket.service';
import { ToastService } from '../../../core/services/toast.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { CustomerBadgeComponent } from '../../../shared/components/customer-badge/customer-badge.component';

type TicketRow = {
  ticketId: string;
  id: string;
  customer: string;
  customerChannel: 'whatsapp' | 'instagram' | 'email';
  customerStatus: string;
  issueType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  agentInitials: string;
  status: 'open' | 'pending' | 'escalated' | 'resolved';
  lastActivity: string;
};

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CustomerBadgeComponent],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css',
})
export class TicketListComponent implements OnInit, OnDestroy {
  protected readonly statusOptions: Array<'all' | 'open' | 'pending' | 'escalated' | 'resolved'> = [
    'all',
    'open',
    'pending',
    'escalated',
    'resolved',
  ];
  protected readonly priorityOptions: Array<'all' | 'low' | 'medium' | 'high' | 'urgent'> = [
    'all',
    'low',
    'medium',
    'high',
    'urgent',
  ];

  protected readonly tickets = signal<TicketRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = signal(20);

  protected readonly selectedStatus = signal<'all' | 'open' | 'pending' | 'escalated' | 'resolved'>('all');
  protected readonly selectedPriority = signal<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  protected readonly searchTerm = signal('');
  protected readonly selectedTab = signal<'all' | 'mine' | 'unassigned'>('all');
  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  protected readonly tabs = computed(() => {
    return [
      { key: 'all' as const, label: 'All Tickets', count: this.total() },
      {
        key: 'mine' as const,
        label: 'My Tickets',
        count: this.selectedTab() === 'mine' ? this.total() : 0,
      },
      {
        key: 'unassigned' as const,
        label: 'Unassigned',
        count: this.selectedTab() === 'unassigned' ? this.total() : 0,
      },
    ];
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.limit())),
  );

  constructor(
    private readonly ticketService: TicketService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toastService: ToastService,
    private readonly authService: AuthService,
    private readonly websocketService: WebsocketService,
    private readonly customerService: CustomerService,
  ) {}

  ngOnInit(): void {
    this.hydrateFromQueryParams();
    this.setupRealtimeRefresh();
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.searchTerm.set(value);
        this.applyFilters();
      });

    this.loadTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected retry(): void {
    this.loadTickets();
  }

  protected onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  protected applyFilters(): void {
    this.page.set(1);
    this.syncQueryParams();
    this.loadTickets();
  }

  protected selectTab(tab: 'all' | 'mine' | 'unassigned'): void {
    this.selectedTab.set(tab);
    this.page.set(1);
    this.syncQueryParams();
    this.loadTickets();
  }

  protected goToPage(nextPage: number): void {
    if (nextPage < 1 || nextPage > this.totalPages()) {
      return;
    }

    this.page.set(nextPage);
    this.syncQueryParams();
    this.loadTickets();
  }

  private loadTickets(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const statusFilter: TicketStatus | undefined =
      this.selectedStatus() === 'all'
        ? undefined
        : (this.selectedStatus() as TicketStatus);
    const priorityFilter: Priority | undefined =
      this.selectedPriority() === 'all'
        ? undefined
        : (this.selectedPriority() as Priority);

    this.ticketService
      .listTickets({
        page: this.page(),
        limit: this.limit(),
        status: statusFilter,
        priority: priorityFilter,
        search: this.searchTerm().trim() || undefined,
        mine: this.selectedTab() === 'mine' ? true : undefined,
        unassigned: this.selectedTab() === 'unassigned' ? true : undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.total.set(response.total);

          const rows = response.items.map((ticket) => ({
            ticketId: ticket.id,
            id: ticket.ticketNumber,
            customer: ticket.customerId,
            customerChannel: 'whatsapp' as TicketRow['customerChannel'],
            customerStatus: 'new',
            issueType: ticket.category,
            priority: ticket.priority,
            agentInitials: ticket.assignedAgentId ? ticket.assignedAgentId.slice(0, 2).toUpperCase() : '--',
            status: ticket.status,
            lastActivity: this.toRelativeTime(ticket.updatedAt),
          }));
          this.tickets.set(rows);

          const customerIds = response.items.map((ticket) => ticket.customerId);
          this.customerService.ensureCustomers(customerIds).subscribe({
            next: (customerMap) => {
              this.tickets.update((items) =>
                items.map((item) => ({
                  ...item,
                  customer: customerMap.get(item.customer)?.name ?? item.customer,
                  customerChannel: (customerMap.get(item.customer)?.channel ?? item.customerChannel) as TicketRow['customerChannel'],
                  customerStatus: customerMap.get(item.customer)?.status ?? item.customerStatus,
                })),
              );
            },
            error: () => {
              // Keep fallback customer IDs if lookup fails.
            },
          });
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.toastService.error(error.message);
        },
      });
  }

  private hydrateFromQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;

    const page = Number(params.get('page') ?? '1');
    if (!Number.isNaN(page) && page > 0) {
      this.page.set(page);
    }

    const status = params.get('status');
    if (
      status === 'all' ||
      status === 'open' ||
      status === 'pending' ||
      status === 'escalated' ||
      status === 'resolved'
    ) {
      this.selectedStatus.set(status);
    }

    const priority = params.get('priority');
    if (
      priority === 'all' ||
      priority === 'low' ||
      priority === 'medium' ||
      priority === 'high' ||
      priority === 'urgent'
    ) {
      this.selectedPriority.set(priority);
    }

    const tab = params.get('tab');
    if (tab === 'all' || tab === 'mine' || tab === 'unassigned') {
      this.selectedTab.set(tab);
    }

    const search = params.get('search');
    if (search) {
      this.searchTerm.set(search);
    }
  }

  private syncQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: this.page(),
        status: this.selectedStatus(),
        priority: this.selectedPriority(),
        tab: this.selectedTab(),
        search: this.searchTerm() || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private setupRealtimeRefresh(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.businessId) {
      return;
    }

    this.websocketService.connect(user.businessId);
    this.websocketService.ticketUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        if (payload.businessId === user.businessId) {
          this.loadTickets();
        }
      });

    this.websocketService.ticketAssigned$
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        if (payload.businessId === user.businessId) {
          this.loadTickets();
        }
      });

    this.websocketService.issueNew$
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        if (payload.businessId === user.businessId) {
          this.loadTickets();
        }
      });
  }

  private toRelativeTime(iso: string): string {
    const deltaMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.max(1, Math.round(deltaMs / 60000));
    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.round(hours / 24);
    return `${days}d ago`;
  }
}