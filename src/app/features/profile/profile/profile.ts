import { Component, signal } from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatSliderModule, MatCardModule, CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent {
  mood = signal(5);

  goals = signal<{ title: string; status: string }[]>([
  { title: 'Exercise daily', status: 'In progress' },
  { title: 'Read 30 mins', status: 'Completed' },
  { title: 'Practice coding', status: 'Not started' }
]);

  updateMood(value: number) {
    this.mood.set(value);
  }
}
