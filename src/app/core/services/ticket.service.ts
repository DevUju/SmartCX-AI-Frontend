import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { ErrorService } from './error.service';

export type TicketStatus = 'open' | 'pending' | 'escalated' | 'resolved';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketMessage = {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'customer' | 'agent' | 'ai_bot';
  content: string;
  attachmentUrl: string | null;
  isInternalNote: boolean;
  createdAt: string;
};

export type Ticket = {
  id: string;
  businessId: string;
  issueId: string;
  customerId: string;
  ticketNumber: string;
  title: string;
  category: string;
  priority: Priority;
  status: TicketStatus;
  assignedAgentId: string | null;
  aiDraftSummary: string;
  aiInsightSummary: string;
  internalNotes: string[];
  resolvedAt: string | null;
  resolutionSummary: string | null;
  sentimentShiftStart: string | null;
  sentimentShiftEnd: string | null;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
};

export type TicketListResponse = {
  items: Ticket[];
  page: number;
  limit: number;
  total: number;
};

export type ListTicketsQuery = {
  status?: TicketStatus;
  priority?: Priority;
  mine?: boolean;
  unassigned?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

export type CreateTicketRequest = {
  issueId: string;
  customerId: string;
  title: string;
  category: string;
  priority: Priority;
  aiDraftSummary?: string;
  aiInsightSummary?: string;
  internalNotes?: string[];
  assignedAgentId?: string;
};

export type AssignTicketRequest = {
  assignedAgentId: string;
};

export type AddTicketMessageRequest = {
  content: string;
  attachmentUrl?: string;
  senderType?: 'customer' | 'agent' | 'ai_bot';
  isInternalNote?: boolean;
};

export type ResolveTicketRequest = {
  resolutionSummary: string;
  sentimentShiftStart?: string;
  sentimentShiftEnd?: string;
};

@Injectable({ providedIn: 'root' })
export class TicketService {
  constructor(
    private readonly http: HttpClient,
    private readonly errorService: ErrorService,
  ) {}

  listTickets(query: ListTicketsQuery = {}): Observable<TicketListResponse> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<TicketListResponse>(`${API_BASE_URL}/tickets`, { params })
      .pipe(this.errorService.handleHttpError<TicketListResponse>('List tickets'));
  }

  createTicket(payload: CreateTicketRequest): Observable<Ticket> {
    return this.http
      .post<Ticket>(`${API_BASE_URL}/tickets`, payload)
      .pipe(this.errorService.handleHttpError<Ticket>('Create ticket'));
  }

  getTicket(ticketId: string): Observable<Ticket> {
    return this.http
      .get<Ticket>(`${API_BASE_URL}/tickets/${ticketId}`)
      .pipe(this.errorService.handleHttpError<Ticket>('Get ticket'));
  }

  updateTicketStatus(ticketId: string, status: TicketStatus): Observable<Ticket> {
    return this.http
      .patch<Ticket>(`${API_BASE_URL}/tickets/${ticketId}/status`, { status })
      .pipe(this.errorService.handleHttpError<Ticket>('Update ticket status'));
  }

  assignTicket(ticketId: string, payload: AssignTicketRequest): Observable<Ticket> {
    return this.http
      .post<Ticket>(`${API_BASE_URL}/tickets/${ticketId}/assign`, payload)
      .pipe(this.errorService.handleHttpError<Ticket>('Assign ticket'));
  }

  addTicketMessage(ticketId: string, payload: AddTicketMessageRequest): Observable<TicketMessage> {
    return this.http
      .post<TicketMessage>(`${API_BASE_URL}/tickets/${ticketId}/messages`, payload)
      .pipe(this.errorService.handleHttpError<TicketMessage>('Add ticket message'));
  }

  resolveTicket(ticketId: string, payload: ResolveTicketRequest): Observable<Ticket> {
    return this.http
      .post<Ticket>(`${API_BASE_URL}/tickets/${ticketId}/resolve`, payload)
      .pipe(this.errorService.handleHttpError<Ticket>('Resolve ticket'));
  }
}