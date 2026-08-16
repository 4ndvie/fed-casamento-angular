import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Quote, QuoteStatus, WeddingPlannerService } from '../services/wedding-planner.service';

interface StatusTab {
  value: QuoteStatus;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './quotes.component.html',
  styleUrl: './quotes.component.scss',
})
export class QuotesComponent {
  private readonly planner = inject(WeddingPlannerService);

  readonly tabs: StatusTab[] = [
    { value: 'pending', label: 'Pendentes', icon: 'pending_actions' },
    { value: 'answered', label: 'Respondidos', icon: 'mark_email_read' },
    { value: 'approved', label: 'Aprovados', icon: 'task_alt' },
    { value: 'expiring', label: 'Vencendo', icon: 'schedule' },
  ];

  readonly active = signal<QuoteStatus>('pending');

  readonly grouped = this.planner.quotesByStatus;

  readonly current = computed<Quote[]>(() => this.grouped()[this.active()]);

  countOf(status: QuoteStatus): number {
    return this.grouped()[status].length;
  }

  formatCurrency(value: number | null): string {
    return value == null ? 'Aguardando' : `R$ ${value.toLocaleString('pt-BR')}`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  daysLeft(iso: string): number {
    const diff = new Date(iso).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}

