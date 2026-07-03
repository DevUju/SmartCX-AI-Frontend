import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { REALTIME_BASE_URL } from '../config/api.config';

export type TicketUpdatedEvent = {
  businessId: string;
  ticketId: string;
  status?: string;
  priority?: string;
  updatedAt: string;
};

export type NotificationEvent = {
  id: string;
  message: string;
  type: string;
  link: string | null;
  createdAt: string;
};

export type IssueNewEvent = {
  businessId: string;
  issueId: string;
  priority: string;
  category: string;
  createdAt: string;
};

export type TicketAssignedEvent = {
  businessId: string;
  ticketId: string;
  assignedAgentId: string;
  assignedAt: string;
};

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket: Socket | null = null;
  private activeBusinessId: string | null = null;

  private readonly notificationSubject = new Subject<NotificationEvent>();
  readonly notification$: Observable<NotificationEvent> =
    this.notificationSubject.asObservable();

  private readonly ticketUpdatedSubject = new Subject<TicketUpdatedEvent>();
  private readonly issueNewSubject = new Subject<IssueNewEvent>();
  private readonly ticketAssignedSubject = new Subject<TicketAssignedEvent>();

  readonly ticketUpdated$: Observable<TicketUpdatedEvent> =
    this.ticketUpdatedSubject.asObservable();
  readonly issueNew$: Observable<IssueNewEvent> =
    this.issueNewSubject.asObservable();
  readonly ticketAssigned$: Observable<TicketAssignedEvent> =
    this.ticketAssignedSubject.asObservable();

  connect(businessId: string, userId: string): void {
    if (this.socket && this.activeBusinessId === businessId) {
      return;
    }

    this.disconnect();
    this.activeBusinessId = businessId;
    this.socket = io(REALTIME_BASE_URL, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.socket?.emit('business:join', { businessId });
      this.socket?.emit('user:join', { userId }); // join personal room
    });

    this.socket.on('ticket:updated', (payload: TicketUpdatedEvent) => {
      this.ticketUpdatedSubject.next(payload);
    });
    this.socket.on('issue:new', (payload: IssueNewEvent) => {
      this.issueNewSubject.next(payload);
    });
    this.socket.on('ticket:assigned', (payload: TicketAssignedEvent) => {
      this.ticketAssignedSubject.next(payload);
    });
    this.socket.on('notification:new', (payload: NotificationEvent) => {
      this.notificationSubject.next(payload);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.activeBusinessId = null;
  }
}
