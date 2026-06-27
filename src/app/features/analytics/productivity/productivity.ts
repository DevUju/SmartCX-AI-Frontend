import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { ApiAnalyticsService } from '../../../core/services/api/analytics-api.service';
import { ProductivityMetrics } from '../../../core/models';

@Component({
  selector: 'app-productivity',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './productivity.html',
  styleUrls: ['./productivity.css']
})
export class ProductivityComponent implements OnInit {
  progress = signal(0);
  stats = signal({
    completed: 0,
    streak: 0,
    weeklyCompletion: '0%',
    insight: 'Loading your productivity metrics...'
  });

  achievement = signal({
    title: 'Loading...',
    description: 'Analyzing your performance...'
  });

  categories = signal<{ name: string; percent: number }[]>([
    { name: 'Work & Projects', percent: 0 },
    { name: 'Personal Development', percent: 0 }
  ]);

  weekly = signal<{ day: string; value: number }[]>([
    { day: 'M', value: 0 },
    { day: 'T', value: 0 },
    { day: 'W', value: 0 },
    { day: 'T', value: 0 },
    { day: 'F', value: 0 },
    { day: 'S', value: 0 },
    { day: 'S', value: 0 }
  ]);

  loading = signal(false);
  error = signal<string | null>(null);

  private analyticsService = inject(ApiAnalyticsService);

  ngOnInit() {
    this.loadMetrics();
  }

  loadMetrics() {
    this.loading.set(true);
    this.error.set(null);
    this.analyticsService.getProductivityMetrics().subscribe({
      next: (metrics: ProductivityMetrics) => {
        this.loading.set(false);
        this.progress.set(metrics.overallProgress);
        this.stats.set({
          completed: metrics.completedTasks,
          streak: metrics.streak,
          weeklyCompletion: `+${metrics.weeklyImprovement}% vs last week`,
          insight: `You have completed ${metrics.todaysCompletedTasks} tasks today.`
        });
        this.achievement.set({
          title: metrics.achievement,
          description: `You have maintained a ${metrics.streak}-day streak with ${metrics.completedTasks} tasks completed.`
        });
        this.categories.set([
          { name: 'Work & Projects', percent: metrics.categoryBreakdown.work },
          { name: 'Personal Development', percent: metrics.categoryBreakdown.personalDevelopment }
        ]);

        // Map weekly data to chart format
        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        this.weekly.set(
          days.map((day, index) => ({
            day,
            value: metrics.weeklyData[index] || 0
          }))
        );
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to load metrics');
        console.error('Error loading metrics:', err);
        this.progress.set(0);
        this.stats.set({
          completed: 0,
          streak: 0,
          weeklyCompletion: '0% vs last week',
          insight: 'Unable to load metrics right now.'
        });
        this.achievement.set({
          title: 'No data available',
          description: 'Try again when the backend is reachable.'
        });
        this.categories.set([
          { name: 'Work & Projects', percent: 0 },
          { name: 'Personal Development', percent: 0 }
        ]);
        this.weekly.set([
          { day: 'M', value: 0 },
          { day: 'T', value: 0 },
          { day: 'W', value: 0 },
          { day: 'T', value: 0 },
          { day: 'F', value: 0 },
          { day: 'S', value: 0 },
          { day: 'S', value: 0 }
        ]);
      }
    });
  }
}
