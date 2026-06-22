import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
    MatCheckboxModule
  ],
  templateUrl: './daily-tasks.html',
  styleUrls: ['./daily-tasks.css']
})
export class DailyTasksComponent {
  progress = signal(65);

  overdue = signal([
    { title: 'Update project timeline', tag: 'Product', date: 'Yesterday' }
  ]);

  today = signal([
    { title: 'Review client feedback', tag: 'Design', time: '10:00 AM' },
    { title: 'Sync with engineering', tag: 'Mobile App', time: '2:00 PM' }
  ]);

  completed = signal([
    { title: 'Prepare weekly report', tag: 'Admin' }
  ]);
}
