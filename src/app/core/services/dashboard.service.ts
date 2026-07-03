import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { ErrorService } from './error.service';

export type DashboardMetrics = {
  openTickets: number;
  resolvedLast24h: number;
  resolvedLast24hChangePercent: number;
  avgResponseHours: number;
};

export type DashboardTrendPoint = {
  time: string;
  ticketsOpened: number;
  ticketsResolved: number;
};

export type DashboardTrends = {
  points: DashboardTrendPoint[];
};

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(
    private readonly http: HttpClient,
    private readonly errorService: ErrorService,
  ) {}

  applyRecommendation(): Observable<{ message: string; assigned: number }> {
    return this.http
      .post<{
        message: string;
        assigned: number;
      }>(`${API_BASE_URL}/dashboard/apply-recommendation`, {})
      .pipe(
        this.errorService.handleHttpError<{
          message: string;
          assigned: number;
        }>('Apply recommendation'),
      );
  }

  getTeamLoad(): Observable<{
    agents: Array<{ name: string; openTickets: number; status: string }>;
  }> {
    return this.http
      .get<{
        agents: Array<{ name: string; openTickets: number; status: string }>;
      }>(`${API_BASE_URL}/dashboard/team-load`)
      .pipe(this.errorService.handleHttpError('Fetch team load'));
  }

  getMetrics(): Observable<DashboardMetrics> {
    return this.http
      .get<DashboardMetrics>(`${API_BASE_URL}/dashboard/metrics`)
      .pipe(
        this.errorService.handleHttpError<DashboardMetrics>(
          'Fetch dashboard metrics',
        ),
      );
  }

  getTrends(): Observable<DashboardTrends> {
    return this.http
      .get<DashboardTrends>(`${API_BASE_URL}/dashboard/trends`)
      .pipe(
        this.errorService.handleHttpError<DashboardTrends>(
          'Fetch dashboard trends',
        ),
      );
  }

  getAiInsight(): Observable<{ summary: string }> {
    return this.http
      .get<{ summary: string }>(`${API_BASE_URL}/dashboard/ai-insight`)
      .pipe(
        this.errorService.handleHttpError<{ summary: string }>(
          'Get AI insight',
        ),
      );
  }
}
