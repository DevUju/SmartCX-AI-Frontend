import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { CustomerService } from '../../../core/services/customer.service';
import { Issue, IssueService } from '../../../core/services/issue.service';
import { ToastService } from '../../../core/services/toast.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { CustomerBadgeComponent } from '../../../shared/components/customer-badge/customer-badge.component';

type QueueItem = {
  id: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  customer: string;
  customerChannel: 'whatsapp' | 'instagram' | 'email';
  customerStatus: string;
  channel: 'whatsapp' | 'instagram' | 'email';
  preview: string;
  tag: string;
  status: 'NEW' | 'PENDING' | 'CONVERTED' | 'CLOSED';
};

@Component({
  selector: 'app-issue-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CustomerBadgeComponent],
  templateUrl: './issue-queue.component.html',
  styleUrl: './issue-queue.component.css',
})
export class IssueQueueComponent implements OnInit, OnDestroy {
  protected readonly statuses: Array<'all' | 'new' | 'pending' | 'converted' | 'closed'> = [
    'all',
    'new',
    'pending',
    'converted',
    'closed',
  ];
  protected readonly priorities: Array<'all' | 'low' | 'medium' | 'high' | 'urgent'> = [
    'all',
    'low',
    'medium',
    'high',
    'urgent',
  ];

  protected readonly issues = signal<QueueItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = signal(20);

  protected readonly selectedStatus = signal<'all' | 'new' | 'pending' | 'converted' | 'closed'>('all');
  protected readonly selectedPriority = signal<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  protected readonly searchTerm = signal('');
  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  protected readonly tabs = computed(() => {
    const entries = this.issues();
    return [
      { label: 'ALL ISSUES', count: this.total() },
      { label: 'UNASSIGNED', count: entries.filter((issue) => issue.status === 'NEW').length },
      { label: 'URGENT', count: entries.filter((issue) => issue.priority === 'URGENT').length },
    ];
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.limit())),
  );

  constructor(
    private readonly issueService: IssueService,
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

    this.loadIssues();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected retry(): void {
    this.loadIssues();
  }

  protected onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  protected applyFilters(): void {
    this.page.set(1);
    this.syncQueryParams();
    this.loadIssues();
  }

  protected goToPage(nextPage: number): void {
    if (nextPage < 1 || nextPage > this.totalPages()) {
      return;
    }

    this.page.set(nextPage);
    this.syncQueryParams();
    this.loadIssues();
  }

  private loadIssues(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const statusFilter: Issue['status'] | undefined =
      this.selectedStatus() === 'all'
        ? undefined
        : (this.selectedStatus() as Issue['status']);
    const priorityFilter: Issue['priority'] | undefined =
      this.selectedPriority() === 'all'
        ? undefined
        : (this.selectedPriority() as Issue['priority']);

    this.issueService
      .listIssues({
        page: this.page(),
        limit: this.limit(),
        status: statusFilter,
        priority: priorityFilter,
        search: this.searchTerm().trim() || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.total.set(response.total);

          const issueRows = response.items.map((issue) => ({
            id: issue.id,
            priority: issue.priority.toUpperCase() as QueueItem['priority'],
            customer: issue.customerId,
            customerChannel: issue.channelType as QueueItem['customerChannel'],
            customerStatus: 'new',
            channel: issue.channelType,
            preview: issue.messagePreview,
            tag: issue.category,
            status: issue.status.toUpperCase() as QueueItem['status'],
          }));
          this.issues.set(issueRows);

          const customerIds = response.items.map((issue) => issue.customerId);
          this.customerService.ensureCustomers(customerIds).subscribe({
            next: (customerMap) => {
              this.issues.update((items) =>
                items.map((item) => ({
                  ...item,
                  customer: customerMap.get(item.customer)?.name ?? item.customer,
                  customerChannel: (customerMap.get(item.customer)?.channel ?? item.customerChannel) as QueueItem['customerChannel'],
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
      status === 'new' ||
      status === 'pending' ||
      status === 'converted' ||
      status === 'closed'
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
    this.websocketService.issueNew$
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        if (payload.businessId === user.businessId) {
          this.loadIssues();
        }
      });

    this.websocketService.ticketUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        if (payload.businessId === user.businessId) {
          this.loadIssues();
        }
      });
  }
}