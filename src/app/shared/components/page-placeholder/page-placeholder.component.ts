import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-page-placeholder',
  standalone: true,
  template: `
    <section class="placeholder">
      <h1>{{ title() }}</h1>
      <p>{{ subtitle() }}</p>
    </section>
  `,
  styles: [
    `
      .placeholder {
        padding: 1rem;
      }

      h1 {
        margin: 0;
        font-size: 1.5rem;
      }

      p {
        margin: 0.4rem 0 0;
        color: var(--ink-soft);
      }
    `,
  ],
})
export class PagePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  title = computed(() => (this.route.snapshot.data['title'] as string) ?? 'Coming Soon');
  subtitle = computed(
    () =>
      (this.route.snapshot.data['subtitle'] as string) ??
      'This page will be implemented in the next step.',
  );
}