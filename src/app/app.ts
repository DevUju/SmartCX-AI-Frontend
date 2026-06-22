import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './layouts/bottom-nav/bottom-nav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BottomNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('smartcx-ai-frontend');
}
