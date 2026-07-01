import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.css',
})
export class MessageBubbleComponent {
  readonly sender = input<'customer' | 'agent' | 'ai_bot'>('customer');
  readonly content = input('');
  readonly time = input('');
  readonly isInternalNote = input(false);
}
