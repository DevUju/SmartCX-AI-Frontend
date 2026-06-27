import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '../../models';

const API_URL = 'http://localhost:3000/projects';

@Injectable({
  providedIn: 'root',
})
export class ApiProjectService {
  constructor(private http: HttpClient) {}

  create(project: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(API_URL, project);
  }

  getAll(status?: string): Observable<Project[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Project[]>(API_URL, { params });
  }

  getOne(id: string): Observable<Project> {
    return this.http.get<Project>(`${API_URL}/${id}`);
  }

  update(id: string, project: UpdateProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${API_URL}/${id}`, project);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
