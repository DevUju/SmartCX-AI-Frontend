import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { DashboardService } from '../../core/services/dashboard.service';
import { TicketService } from '../../core/services/ticket.service';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';

type Metric = {
  label: string;
  value: string;
  extra?: string;
};

type TrendPoint = {
  time: string;
  value: number;
  opened: number;
  resolved: number;
};

type ActiveTicket = {
  id: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT';
};

type AgentAvailability = {
  name: string;
  openTickets: number;
  status: string;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly aiInsight = signal('Loading insight...');
  protected readonly applyingRecommendation = signal(false);
  protected readonly team = signal<AgentAvailability[]>([]);

  protected readonly metrics = signal<Metric[]>([
    { label: 'Open Tickets', value: '0' },
    { label: 'Resolved 24h', value: '0', extra: '0%' },
    { label: 'Avg Response', value: '0h' },
  ]);

  protected readonly trends = signal<TrendPoint[]>([]);

  protected readonly tickets = signal<ActiveTicket[]>([]);

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly ticketService: TicketService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.dashboardService.getAiInsight().subscribe({
      next: (response) => this.aiInsight.set(response.summary),
      error: () => this.aiInsight.set('Insight unavailable right now.'),
    });

    this.dashboardService.getTeamLoad().subscribe({
      next: (response) => this.team.set(response.agents),
      error: () => {},
    });
    this.loadDashboard();
  }

  protected applyRecommendation(): void {
    if (this.applyingRecommendation()) return;

    this.applyingRecommendation.set(true);
    this.dashboardService
      .applyRecommendation()
      .pipe(finalize(() => this.applyingRecommendation.set(false)))
      .subscribe({
        next: (result) => {
          this.toastService.success(result.message);
          if (result.assigned > 0) {
            this.loadDashboard(); // refresh metrics
          }
        },
        error: (error: Error) => {
          this.toastService.error(error.message);
        },
      });
  }

  // protected readonly aiInsightClean = computed(() => {
  //   const raw = this.aiInsight();
  //   return raw
  //     .replace(/\*\*(.*?)\*\*/g, '$1')
  //     .replace(/\*(.*?)\*/g, '$1')
  //     .replace(/^\*\s+/gm, '• ')
  //     .trim();
  // });

  protected readonly aiInsightLines = computed(() => {
    const raw = this.aiInsight();
    return raw
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
  });

  protected retry(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.dashboardService
      .getMetrics()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (metrics) => {
          this.metrics.set([
            { label: 'Open Tickets', value: String(metrics.openTickets) },
            {
              label: 'Resolved (7 days)',
              value: String(metrics.resolvedLast24h),
              extra: `${metrics.resolvedLast24hChangePercent >= 0 ? '+' : ''}${metrics.resolvedLast24hChangePercent}% vs prev week`,
            },
            { label: 'Avg Response', value: `${metrics.avgResponseHours}h` },
          ]);
        },
        error: (error: Error) => this.errorMessage.set(error.message),
      });

    this.dashboardService.getTrends().subscribe({
      next: (trends) => {
        const hasData = trends.points.some(
          (p) => p.ticketsOpened > 0 || p.ticketsResolved > 0,
        );

        if (!hasData) {
          this.trends.set([]);
          return;
        }

        const max = Math.max(
          ...trends.points.map((p) =>
            Math.max(p.ticketsOpened, p.ticketsResolved),
          ),
          1,
        );

        this.trends.set(
          trends.points.map((p) => ({
            time: new Date(p.time).toLocaleDateString('en-NG', {
              weekday: 'short',
              day: 'numeric',
            }),
            value: Math.round((p.ticketsOpened / max) * 100),
            opened: p.ticketsOpened,
            resolved: p.ticketsResolved,
          })),
        );
      },
      error: (error: Error) => this.errorMessage.set(error.message),
    });

    this.ticketService.listTickets({ page: 1, limit: 5 }).subscribe({
      next: (response) => {
        this.tickets.set(
          response.items.map((ticket) => ({
            id: ticket.ticketNumber,
            description: ticket.title,
            priority: ticket.priority.toUpperCase() as ActiveTicket['priority'],
          })),
        );
      },
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
