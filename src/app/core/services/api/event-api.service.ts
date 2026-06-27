import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
} from '../../models';

const API_URL = 'http://localhost:3000/events';

@Injectable({
  providedIn: 'root',
})
export class ApiEventService {
  constructor(private http: HttpClient) {}

  create(event: CreateEventRequest): Observable<Event> {
    return this.http.post<Event>(API_URL, event);
  }

  getAll(): Observable<Event[]> {
    return this.http.get<Event[]>(API_URL);
  }

  getOne(id: string): Observable<Event> {
    return this.http.get<Event>(`${API_URL}/${id}`);
  }

  getByDateRange(startDate: Date, endDate: Date): Observable<Event[]> {
    let params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());
    return this.http.get<Event[]>(`${API_URL}/range`, { params });
  }

  update(id: string, event: UpdateEventRequest): Observable<Event> {
    return this.http.put<Event>(`${API_URL}/${id}`, event);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
