import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { RouterModule } from '@angular/router';
import { ApiEventService } from '../../../core/services/api/event-api.service';
import { Event } from '../../../core/models';

@Component({
  selector: 'app-upcoming-schedule',
  imports: [MatIconModule, MatCardModule, MatButtonModule, CommonModule, RouterModule],
  standalone: true,
  templateUrl: './upcoming-schedule.html',
  styleUrls: ['./upcoming-schedule.css']
})
export class UpcomingScheduleComponent implements OnInit {
  events = signal<Event[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  private eventApiService = inject(ApiEventService);

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.loading.set(true);
    this.error.set(null);
    this.eventApiService.getAll().subscribe({
      next: (loadedEvents: Event[]) => {
        this.loading.set(false);
        this.events.set(loadedEvents);
        this.renderCalendar(loadedEvents);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to load events');
        console.error('Error loading events:', err);
        this.events.set([]);
        this.renderCalendar([]);
      }
    });
  }

  ngAfterViewInit() {
    // Calendar will be rendered when events are loaded
  }

  private renderCalendar(calendarEvents: Event[]) {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    // Clear previous calendar
    calendarEl.innerHTML = '';

    const formattedEvents = calendarEvents.map(event => ({
      title: event.title,
      date: new Date(event.date).toISOString().split('T')[0]
    }));

    const calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin],
      initialView: 'dayGridMonth',
      events: formattedEvents
    });
    calendar.render();
  }

  createQuickEvent() {
    const now = new Date();
    const eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const time = '09:00';

    this.eventApiService.create({
      title: `Quick Event ${eventDate.toLocaleDateString()}`,
      description: 'Created from schedule page',
      date: eventDate,
      time
    }).subscribe({
      next: () => {
        this.loadEvents();
      },
      error: (err) => {
        this.error.set('Failed to create event');
        console.error('Error creating event:', err);
      }
    });
  }
}
