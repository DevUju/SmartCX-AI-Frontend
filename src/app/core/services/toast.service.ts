import { Injectable, signal } from '@angular/core';

export type ToastLevel = 'success' | 'error' | 'info';

export type ToastMessage = {
  id: number;
  level: ToastLevel;
  text: string;
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly messages = signal<ToastMessage[]>([]);
  private nextId = 1;

  success(text: string): void {
    this.push('success', text);
  }

  error(text: string): void {
    this.push('error', text);
  }

  info(text: string): void {
    this.push('info', text);
  }

  dismiss(id: number): void {
    this.messages.update((items) => items.filter((item) => item.id !== id));
  }

  private push(level: ToastLevel, text: string): void {
    const id = this.nextId++;
    this.messages.update((items) => [...items, { id, level, text }]);
    setTimeout(() => this.dismiss(id), 3500);
  }
}
