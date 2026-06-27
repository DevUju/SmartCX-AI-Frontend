import { Component, signal, OnInit, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ApiProjectService } from '../../../core/services/api/project-api.service';
import { Project } from '../../../core/models';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [MatProgressBarModule, MatButtonModule, MatCardModule, CommonModule, MatIconModule, RouterModule],
  templateUrl: './projects.html',
  styleUrls: ['./projects.css']
})
export class ProjectsComponent implements OnInit {
  projects = signal<Project[]>([]);
  archive = signal<Project[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  private projectApiService = inject(ApiProjectService);

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loading.set(true);
    this.error.set(null);
    this.projectApiService.getAll().subscribe({
      next: (allProjects: Project[]) => {
        this.loading.set(false);
        const activeProjects = allProjects.filter(p => p.status === 'active');
        const archivedProjects = allProjects.filter(p => p.status === 'archived' || p.status === 'completed');
        this.projects.set(activeProjects);
        this.archive.set(archivedProjects);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to load projects');
        console.error('Error loading projects:', err);
        this.projects.set([]);
        this.archive.set([]);
      }
    });
  }

  deleteProject(projectId: string) {
    this.projectApiService.delete(projectId).subscribe({
      next: () => {
        this.loadProjects();
      },
      error: (err) => {
        console.error('Error deleting project:', err);
      }
    });
  }

  addProject() {
    this.projectApiService.create({
      name: `New Project ${new Date().toLocaleTimeString()}`,
      description: 'Created from Projects page',
      progress: 0
    }).subscribe({
      next: () => {
        this.loadProjects();
      },
      error: (err) => {
        this.error.set('Failed to create project');
        console.error('Error creating project:', err);
      }
    });
  }

  getGlobalProgress(): number {
    const active = this.projects();
    if (!active.length) {
      return 0;
    }
    const total = active.reduce((sum, p) => sum + (p.progress || 0), 0);
    return Math.round(total / active.length);
  }
}
