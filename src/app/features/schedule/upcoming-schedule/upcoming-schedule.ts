import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

@Component({
  selector: 'app-upcoming-schedule',
  imports: [MatIconModule, MatCardModule, CommonModule ],
  standalone: true,
  templateUrl: './upcoming-schedule.html',
  styleUrls: ['./upcoming-schedule.css']
})
export class UpcomingScheduleComponent {
  ngAfterViewInit() {
    const calendarEl = document.getElementById('calendar')!;
    const calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin],
      initialView: 'dayGridMonth',
      events: [
        { title: 'Client Review', date: '2024-09-10' },
        { title: 'System Review', date: '2024-09-12' },
        { title: 'Team Meeting', date: '2024-09-15' }
      ]
    });
    calendar.render();
  }
}
