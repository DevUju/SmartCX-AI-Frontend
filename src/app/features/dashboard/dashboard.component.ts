import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { DashboardService } from '../../core/services/dashboard.service';
import { TicketService } from '../../core/services/ticket.service';
import { RouterModule } from '@angular/router';
type Metric = {
  label: string;
  value: string;
  extra?: string;
};

type TrendPoint = {
  time: string;
  value: number;
};

type ActiveTicket = {
  id: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT';
};

type AgentAvailability = {
  name: string;
  status: 'Active' | 'On Call' | 'Optimizing';
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

  protected readonly metrics = signal<Metric[]>([
    { label: 'Open Tickets', value: '0' },
    { label: 'Resolved 24h', value: '0', extra: '0%' },
    { label: 'Avg Response', value: '0h' },
  ]);

  protected readonly trends = signal<TrendPoint[]>([]);

  protected readonly tickets = signal<ActiveTicket[]>([]);

  protected readonly team: AgentAvailability[] = [
    { name: 'Aisha Bello', status: 'Active' },
    { name: 'Ikenna Obi', status: 'On Call' },
    { name: 'Tomiwa Ade', status: 'Optimizing' },
  ];

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly ticketService: TicketService,
  ) {}

  ngOnInit(): void {
    this.dashboardService.getAiInsight().subscribe({
      next: (response) => this.aiInsight.set(response.summary),
      error: () => this.aiInsight.set('Insight unavailable right now.'),
    });
    this.loadDashboard();
  }

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
              label: 'Resolved 24h',
              value: String(metrics.resolvedLast24h),
              extra: `${metrics.resolvedLast24hChangePercent >= 0 ? '+' : ''}${metrics.resolvedLast24hChangePercent}%`,
            },
            { label: 'Avg Response', value: `${metrics.avgResponseHours}h` },
          ]);
        },
        error: (error: Error) => this.errorMessage.set(error.message),
      });

    this.dashboardService.getTrends().subscribe({
      next: (trends) => {
        const max = Math.max(
          ...trends.points.map((point) =>
            Math.max(point.ticketsOpened, point.ticketsResolved),
          ),
          1,
        );
        this.trends.set(
          trends.points.map((point) => ({
            time: point.time,
            value: Math.round((point.ticketsOpened / max) * 100),
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
