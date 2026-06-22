import { Component, signal } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [MatProgressBarModule, MatButtonModule, MatCardModule, CommonModule, MatIconModule],
  templateUrl: './projects.html',
  styleUrls: ['./projects.css']
})
export class ProjectsComponent {
  projects = signal([
    { name: 'Product Launch', progress: 70 },
    { name: 'Marketing Prep', progress: 40 },
    { name: 'Indie App Design', progress: 20 }
  ]);

  archive = signal([
    { name: 'Website Redesign', progress: 100 },
    { name: 'Client Portal', progress: 100 }
  ]);
}
