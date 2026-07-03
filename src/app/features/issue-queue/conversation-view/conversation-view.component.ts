import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { CustomerService } from '../../../core/services/customer.service';
import { IssueService } from '../../../core/services/issue.service';
import { FormsModule } from '@angular/forms';

type ChatMessage = {
  sender: 'customer' | 'agent' | 'bot';
  text: string;
  time: string;
};

@Component({
  selector: 'app-conversation-view',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './conversation-view.component.html',
  styleUrl: './conversation-view.component.css',
})
export class ConversationViewComponent implements OnInit {
  protected readonly issueId = signal('');
  protected readonly customerId = signal('');
  protected readonly customerName = signal('Customer');
  protected readonly customerPhone = signal('+234 --- --- ----');
  protected readonly customerLocation = signal('N/A');
  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly issuePriority = signal<string>('medium');
  protected draftMessage = '';
  protected readonly sending = signal(false);

  protected readonly smartReplies = signal<string[]>([]);
  protected readonly loadingReplies = signal(false);
  protected readonly issueStatus = signal<string>('new');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly issueService: IssueService,
    private readonly customerService: CustomerService,
  ) {}

  protected loadSmartReplies(): void {
    this.loadingReplies.set(true);
    this.issueService
      .getSmartReplies(this.issueId())
      .pipe(finalize(() => this.loadingReplies.set(false)))
      .subscribe({
        next: (response) => this.smartReplies.set(response.replies),
        error: () => this.smartReplies.set([]),
      });
  }

  protected useSuggestedReply(reply: string): void {
    this.draftMessage = reply;
    this.smartReplies.set([]);
  }

  ngOnInit(): void {
    const issueId = this.route.snapshot.paramMap.get('id');
    if (!issueId) {
      this.errorMessage.set('Issue ID not found.');
      this.loading.set(false);
      return;
    }

    this.issueId.set(issueId);
    this.issueService
      .getIssue(issueId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (issue) => {
          this.customerService.getCustomerById(issue.customerId).subscribe({
            next: (customer) => {
              this.customerName.set(customer.name);
              this.customerPhone.set(customer.phone ?? '+234 --- --- ----');
              this.customerLocation.set(customer.location ?? 'N/A');
            },
            error: () => {
              // Keep fallback labels if customer lookup fails.
            },
          });

          this.customerId.set(issue.customerId);
          this.issuePriority.set(issue.priority);
          this.issueStatus.set(issue.status);
          const parsedMessages = issue.rawMessages
            .map((entry) => {
              const text =
                typeof entry['content'] === 'string'
                  ? entry['content']
                  : typeof entry['message'] === 'string'
                    ? entry['message']
                    : issue.messagePreview;
              const senderType =
                entry['senderType'] === 'agent' ||
                entry['senderType'] === 'ai_bot' ||
                entry['senderType'] === 'customer'
                  ? entry['senderType']
                  : 'customer';
              const createdAt =
                typeof entry['createdAt'] === 'string'
                  ? new Date(entry['createdAt'])
                  : new Date(issue.createdAt);

              return {
                sender: senderType === 'ai_bot' ? 'bot' : senderType,
                text,
                time: createdAt.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              } as ChatMessage;
            })
            .slice(0, 12);

          this.messages.set(
            parsedMessages.length
              ? parsedMessages
              : [
                  {
                    sender: 'customer',
                    text: issue.messagePreview,
                    time: new Date(issue.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  },
                ],
          );
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        },
      });
  }

  sendMessage(): void {
    const content = this.draftMessage.trim();
    if (!content || this.sending()) {
      return;
    }

    this.sending.set(true);
    this.issueService
      .addMessage(this.issueId(), content)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: () => {
          this.messages.update((current) => [
            ...current,
            {
              sender: 'agent',
              text: content,
              time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
          ]);
          this.draftMessage = '';
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        },
      });
  }
}
