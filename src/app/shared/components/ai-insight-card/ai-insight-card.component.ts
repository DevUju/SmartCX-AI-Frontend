import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, input } from '@angular/core';

@Component({
  selector: 'app-ai-insight-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-insight-card.component.html',
  styleUrl: './ai-insight-card.component.css',
})
export class AiInsightCardComponent {
  readonly title = input('AI Insight');
  readonly text = input('No insight available');
  readonly actionLabel = input('Apply Recommendation');

  @Output() readonly action = new EventEmitter<void>();

  protected emitAction(): void {
    this.action.emit();
  }
}
