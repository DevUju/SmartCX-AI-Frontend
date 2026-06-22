import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-user-persona',
  standalone: true,
  imports: [MatCardModule, CommonModule],
  templateUrl: './user-persona.html',
  styleUrls: ['./user-persona.css']
})
export class UserPersonaComponent {
  persona = {
    name: 'Alex',
    role: 'High-Achieving Manager',
    goals: [
      'Drive team productivity',
      'Achieve quarterly targets',
      'Improve customer satisfaction'
    ],
    frustrations: [
      'Too many meetings',
      'Difficulty balancing priorities',
      'Limited time for strategy'
    ],
    dayInLife: [
      'Morning standup',
      'Client calls',
      'Project reviews',
      'Evening reporting'
    ],
    personality: 'Strategic, detail-oriented, results-driven',
    biography: 'Alex has 10+ years of experience in management, leading cross-functional teams and delivering successful product launches.'
  };
}
