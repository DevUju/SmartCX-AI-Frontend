import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiTaskService } from '../../../core/services/api/task-api.service';
import { Task } from '../../../core/models';

@Component({
  selector: 'app-daily-tasks',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './daily-tasks.html',
  styleUrls: ['./daily-tasks.css']
})
export class DailyTasksComponent implements OnInit {
  progress = signal(0);
  overdue = signal<Task[]>([]);
  today = signal<Task[]>([]);
  completed = signal<Task[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  quickTaskTitle = '';

  private taskApiService = inject(ApiTaskService);

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.loading.set(true);
    this.error.set(null);
    this.taskApiService.getAll().subscribe({
      next: (tasks: Task[]) => {
        this.loading.set(false);
        this.organizeTasks(tasks);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to load tasks');
        console.error('Error loading tasks:', err);
        this.overdue.set([]);
        this.today.set([]);
        this.completed.set([]);
        this.progress.set(0);
      }
    });
  }

  private organizeTasks(tasks: Task[]) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress');

    // Separate by date
    const overdueTasks = pendingTasks.filter(t => new Date(t.dueDate || today) < today);
    const todayTasks = pendingTasks.filter(t => {
      const taskDate = new Date(t.dueDate || tomorrow);
      return taskDate >= today && taskDate < tomorrow;
    });

    this.overdue.set(overdueTasks);
    this.today.set(todayTasks.concat(inProgressTasks));
    this.completed.set(completedTasks);

    // Calculate progress
    const total = tasks.length;
    this.progress.set(total > 0 ? Math.round((completedTasks.length / total) * 100) : 0);
  }

  completeTask(taskId: string) {
    this.taskApiService.complete(taskId).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (err) => {
        console.error('Error completing task:', err);
      }
    });
  }

  createQuickTask() {
    const title = this.quickTaskTitle.trim();
    if (!title) {
      return;
    }

    this.loading.set(true);
    this.taskApiService.create({ title, priority: 'medium' }).subscribe({
      next: () => {
        this.quickTaskTitle = '';
        this.loadTasks();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to create task');
        console.error('Error creating task:', err);
      }
    });
  }

  getTaskTag(task: Task): string {
    return (task.priority || task.status || 'task').toUpperCase();
  }

  formatTaskDate(task: Task): string {
    if (!task.dueDate) {
      return '--';
    }
    return new Date(task.dueDate).toLocaleDateString();
  }

  formatTaskTime(task: Task): string {
    if (!task.dueDate) {
      return '--';
    }
    return new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
