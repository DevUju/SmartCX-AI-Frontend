import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-productivity',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './productivity.html',
  styleUrls: ['./productivity.css']
})
export class ProductivityComponent {
  progress = signal(65);

  stats = signal({
    completed: 128,
    streak: 12,
    weeklyCompletion: '+12% vs last week',
    insight: 'You’ve reached 84% of your target this week.'
  });

  achievement = signal({
    title: 'Deep Work Master',
    description: 'You completed 5 high-priority projects this month without delays.'
  });

  categories = signal([
    { name: 'Work & Projects', percent: 64 },
    { name: 'Personal Development', percent: 22 }
  ]);

  weekly = signal([
    { day: 'M', value: 70 },
    { day: 'T', value: 80 },
    { day: 'W', value: 90 },
    { day: 'T', value: 85 },
    { day: 'F', value: 88 },
    { day: 'S', value: 76 },
    { day: 'S', value: 84 }
  ]);
}
