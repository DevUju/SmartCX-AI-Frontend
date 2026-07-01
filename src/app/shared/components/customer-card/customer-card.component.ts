import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-customer-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-card.component.html',
  styleUrl: './customer-card.component.css',
})
export class CustomerCardComponent {
  readonly name = input('Unknown Customer');
  readonly phone = input<string | null>(null);
  readonly email = input<string | null>(null);
  readonly location = input<string | null>(null);
  readonly status = input<string | null>(null);
  readonly totalSpent = input<number | null>(null);
}
