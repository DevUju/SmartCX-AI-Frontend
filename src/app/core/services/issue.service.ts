import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { ErrorService } from './error.service';

export type Issue = {
  id: string;
  businessId: string;
  customerId: string;
  channelType: 'whatsapp' | 'instagram' | 'email';
  messagePreview: string;
  rawMessages: Array<Record<string, unknown>>;
  sentimentScore: number;
  sentimentLabel: 'positive' | 'neutral' | 'frustrated' | 'angry';
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'pending' | 'converted' | 'closed';
  aiAnalysisSummary: string;
  createdAt: string;
  updatedAt: string;
};

export type IssueListResponse = {
  items: Issue[];
  page: number;
  limit: number;
  total: number;
};

export type ListIssuesQuery = {
  status?: Issue['status'];
  priority?: Issue['priority'];
  search?: string;
  page?: number;
  limit?: number;
};

export type UpdateIssueRequest = Partial<
  Pick<Issue, 'status' | 'priority' | 'category' | 'aiAnalysisSummary'>
>;

@Injectable({ providedIn: 'root' })
export class IssueService {
  constructor(
    private readonly http: HttpClient,
    private readonly errorService: ErrorService,
  ) {}

  listIssues(query: ListIssuesQuery = {}): Observable<IssueListResponse> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<IssueListResponse>(`${API_BASE_URL}/issues`, { params })
      .pipe(
        this.errorService.handleHttpError<IssueListResponse>('List issues'),
      );
  }

  getIssue(issueId: string): Observable<Issue> {
    return this.http
      .get<Issue>(`${API_BASE_URL}/issues/${issueId}`)
      .pipe(this.errorService.handleHttpError<Issue>('Get issue'));
  }

  getQueueInsight(): Observable<{ summary: string }> {
    return this.http
      .get<{ summary: string }>(`${API_BASE_URL}/issues/insights/queue`)
      .pipe(
        this.errorService.handleHttpError<{ summary: string }>(
          'Get queue insight',
        ),
      );
  }

  getSmartReplies(issueId: string): Observable<{ replies: string[] }> {
    return this.http
      .get<{
        replies: string[];
      }>(`${API_BASE_URL}/issues/${issueId}/smart-replies`)
      .pipe(
        this.errorService.handleHttpError<{ replies: string[] }>(
          'Get smart replies',
        ),
      );
  }

  getTicketDraft(issueId: string): Observable<{ draft: string }> {
    return this.http
      .get<{ draft: string }>(`${API_BASE_URL}/issues/${issueId}/ticket-draft`)
      .pipe(
        this.errorService.handleHttpError<{ draft: string }>(
          'Get ticket draft',
        ),
      );
  }

  updateIssue(issueId: string, payload: UpdateIssueRequest): Observable<Issue> {
    return this.http
      .patch<Issue>(`${API_BASE_URL}/issues/${issueId}`, payload)
      .pipe(this.errorService.handleHttpError<Issue>('Update issue'));
  }

  addMessage(issueId: string, content: string): Observable<Issue> {
    return this.http
      .post<Issue>(`${API_BASE_URL}/issues/${issueId}/messages`, { content })
      .pipe(this.errorService.handleHttpError<Issue>('Send message'));
  }
}
