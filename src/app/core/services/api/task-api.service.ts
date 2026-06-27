import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../../models';

const API_URL = 'http://localhost:3000/tasks';

@Injectable({
  providedIn: 'root',
})
export class ApiTaskService {
  constructor(private http: HttpClient) {}

  create(task: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(API_URL, task);
  }

  getAll(status?: string): Observable<Task[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Task[]>(API_URL, { params });
  }

  getOne(id: string): Observable<Task> {
    return this.http.get<Task>(`${API_URL}/${id}`);
  }

  update(id: string, task: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${API_URL}/${id}`, task);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }

  complete(id: string): Observable<Task> {
    return this.http.patch<Task>(`${API_URL}/${id}/complete`, {});
  }

  getByProject(projectId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${API_URL}/project/${projectId}`);
  }
}
