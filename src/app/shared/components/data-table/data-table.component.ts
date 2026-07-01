import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

export type DataTableColumn = {
  key: string;
  label: string;
};

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
})
export class DataTableComponent {
  readonly columns = input<DataTableColumn[]>([]);
  readonly rows = input<Array<Record<string, string | number | null>>>([]);

  protected readonly hasRows = computed(() => this.rows().length > 0);
}
