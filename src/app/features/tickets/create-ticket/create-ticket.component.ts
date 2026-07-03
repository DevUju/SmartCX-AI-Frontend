import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { CustomerService } from '../../../core/services/customer.service';
import { Issue, IssueService } from '../../../core/services/issue.service';
import { Priority, TicketService } from '../../../core/services/ticket.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-create-ticket',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-ticket.component.html',
  styleUrl: './create-ticket.component.css',
})
export class CreateTicketComponent implements OnInit {
  protected readonly priorities = ['Low', 'Medium', 'High', 'Urgent'];
  protected readonly issues = signal<Issue[]>([]);
  protected readonly customerNamesByIssueId = signal<Record<string, string>>(
    {},
  );
  protected readonly loading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly generatingDraft = signal(false);
  protected readonly selectedIssue = signal<Issue | null>(null);

  get canSubmit(): boolean {
    return this.form.valid && !this.isSubmitting();
  }

  protected readonly form = this.fb.nonNullable.group({
    issueId: ['', [Validators.required]],
    customerId: ['', [Validators.required]],
    title: ['', [Validators.required]],
    category: ['', [Validators.required]],
    priority: ['High', [Validators.required]],
    draft: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly issueService: IssueService,
    private readonly ticketService: TicketService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toastService: ToastService,
    private readonly customerService: CustomerService,
  ) {}

  protected regenerateDraft(): void {
    const issueId = this.form.controls.issueId.value;
    if (!issueId) {
      return;
    }

    this.generatingDraft.set(true);
    this.issueService
      .getTicketDraft(issueId)
      .pipe(finalize(() => this.generatingDraft.set(false)))
      .subscribe({
        next: (response) => this.form.patchValue({ draft: response.draft }),
        error: () => this.toastService.error('Could not generate AI draft.'),
      });
  }

  ngOnInit(): void {
    this.loadIssues();
  }

  protected onIssueChange(issueId: string): void {
    const selectedIssue = this.issues().find((issue) => issue.id === issueId);
    if (!selectedIssue) return;

    this.selectedIssue.set(selectedIssue);

    this.form.patchValue({
      issueId: selectedIssue.id,
      customerId: selectedIssue.customerId,
      title: selectedIssue.messagePreview,
      category: selectedIssue.category,
      priority: this.toDisplayPriority(selectedIssue.priority),
      draft: selectedIssue.aiAnalysisSummary || selectedIssue.messagePreview,
    });

    this.regenerateDraft();
  }

  protected selectPriority(priority: string): void {
    this.form.patchValue({ priority });
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) {
      return;
    }

    const selectedIssue = this.issues().find(
      (issue) => issue.id === this.form.controls.issueId.value,
    );

    // Map the old raw messages to send into the new ticket

    // const initialMessages =
    //   selectedIssue?.rawMessages.map((entry) => {
    //     const content =
    //       typeof entry['content'] === 'string'
    //         ? entry['content']
    //         : typeof entry['message'] === 'string'
    //           ? entry['message']
    //           : typeof entry['text'] === 'string'
    //             ? entry['text']
    //             : selectedIssue.messagePreview;

    //     const st = entry['senderType'];

    //     // Explicitly cast to the strict literal type
    //     const senderType = (
    //       st === 'agent' || st === 'ai_bot' || st === 'customer'
    //         ? st
    //         : 'customer'
    //     ) as 'customer' | 'agent' | 'ai_bot';

    //     return { content, senderType };
    //   }) || [];

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    this.ticketService
      .createTicket({
        issueId: this.form.controls.issueId.value,
        customerId: this.form.controls.customerId.value,
        title: this.form.controls.title.value,
        category: this.form.controls.category.value,
        priority: this.form.controls.priority.value.toLowerCase() as Priority,
        aiDraftSummary: this.form.controls.draft.value,
        aiInsightSummary: selectedIssue?.aiAnalysisSummary ?? '',
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (ticket) => {
          this.toastService.success('Ticket created successfully.');
          void this.router.navigate(['/tickets', ticket.id]);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.toastService.error(error.message);
        },
      });
  }

  private loadIssues(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const preselectedIssueId = this.route.snapshot.queryParamMap.get('issueId');
    const preselectedCustomerId =
      this.route.snapshot.queryParamMap.get('customerId');

    this.issueService
      .listIssues({ status: 'new', page: 1, limit: 100 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.issues.set(response.items);
          const customerIds = response.items.map((issue) => issue.customerId);
          this.customerService.ensureCustomers(customerIds).subscribe({
            next: (customerMap) => {
              const byIssue: Record<string, string> = {};
              response.items.forEach((issue) => {
                byIssue[issue.id] =
                  customerMap.get(issue.customerId)?.name ?? issue.customerId;
              });
              this.customerNamesByIssueId.set(byIssue);

              // Re-patch after names are ready so the selected issue shows correct customer
              if (activeIssue) {
                this.onIssueChange(activeIssue.id);
              }
            },
            error: () => {},
          });

          const fallbackIssue = response.items[0];
          const selectedIssue = response.items.find(
            (issue) => issue.id === preselectedIssueId,
          );
          const activeIssue = selectedIssue ?? fallbackIssue;

          if (!activeIssue) {
            return;
          }

          this.form.patchValue({
            issueId: activeIssue.id,
            customerId: preselectedCustomerId ?? activeIssue.customerId,
          });
          this.onIssueChange(activeIssue.id);
        },
        error: (error: Error) => this.errorMessage.set(error.message),
      });
  }

  private toDisplayPriority(priority: string): string {
    const normalized = priority.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}
