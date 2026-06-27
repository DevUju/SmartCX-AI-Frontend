import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProductivityMetrics,
  TaskSummary,
} from '../../models';

const API_URL = 'http://localhost:3000/analytics';

@Injectable({
  providedIn: 'root',
})
export class ApiAnalyticsService {
  constructor(private http: HttpClient) {}

  getProductivityMetrics(): Observable<ProductivityMetrics> {
    return this.http.get<ProductivityMetrics>(`${API_URL}/productivity`);
  }

  getSummary(): Observable<TaskSummary> {
    return this.http.get<TaskSummary>(`${API_URL}/summary`);
  }
}
