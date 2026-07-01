import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Ticket, TicketService } from '../../../core/services/ticket.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-resolution-summary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './resolution-summary.component.html',
  styleUrl: './resolution-summary.component.css',
})
export class ResolutionSummaryComponent implements OnInit {
  protected readonly ticket = signal<Ticket | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly timeline = [
    'Created',
    'AI Analyzed',
    'Assigned',
    'Customer Contacted',
    'Resolved',
  ];

  protected readonly form = this.fb.nonNullable.group({
    resolutionSummary: ['', [Validators.required, Validators.minLength(10)]],
    sentimentShiftStart: ['frustrated', [Validators.required]],
    sentimentShiftEnd: ['happy', [Validators.required]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly ticketService: TicketService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadTicket();
  }

  protected markResolved(): void {
    this.form.markAllAsTouched();
    const activeTicket = this.ticket();
    if (!activeTicket) {
      return;
    }

    if (!this.form.valid) {
      this.errorMessage.set('Please provide a valid resolution summary with at least 10 characters.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.ticketService
      .resolveTicket(activeTicket.id, this.form.getRawValue())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (ticket) => {
          this.ticket.set(ticket);
          this.toastService.success('Ticket resolved successfully.');
          void this.router.navigate(['/tickets', ticket.id]);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.toastService.error(error.message);
        },
      });
  }

  protected reopen(): void {
    const activeTicket = this.ticket();
    if (!activeTicket) {
      return;
    }

    this.ticketService.updateTicketStatus(activeTicket.id, 'open').subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.toastService.info('Ticket reopened.');
        void this.router.navigate(['/tickets', ticket.id]);
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
          this.ticket.set(ticket);
          this.form.patchValue({
            resolutionSummary:
              ticket.resolutionSummary ??
              ticket.aiInsightSummary ??
              'Ticket resolved after agent response and successful follow-up.',
          });
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.toastService.error(error.message);
        },
      });
  }
}