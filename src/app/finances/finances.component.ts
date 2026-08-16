import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  Expense,
  ExpenseStatus,
  WeddingPlannerService,
} from '../services/wedding-planner.service';

type FinanceTab = 'overview' | 'category' | 'savings' | 'payments';

@Component({
  selector: 'app-finances',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './finances.component.html',
  styleUrl: './finances.component.scss',
})
export class FinancesComponent {
  private readonly planner = inject(WeddingPlannerService);

  readonly tabs: Array<{ value: FinanceTab; label: string; icon: string }> = [
    { value: 'overview', label: 'Resumo geral', icon: 'wallet' },
    { value: 'category', label: 'Por categoria', icon: 'bar_chart' },
    { value: 'savings', label: 'Economia', icon: 'savings' },
    { value: 'payments', label: 'Pagamentos', icon: 'receipt_long' },
  ];
  readonly active = signal<FinanceTab>('overview');

  readonly categories = ['Fotografia', 'Buffet', 'Música', 'Decoração', 'Espaço', 'Assessoria', 'Outros'];

  readonly onboarding = this.planner.onboarding;
  readonly expenses = this.planner.expenses;
  readonly byCategory = this.planner.expensesByCategory;
  readonly totalPlanned = this.planner.totalPlanned;
  readonly totalPaid = this.planner.totalPaid;
  readonly remaining = this.planner.remainingBudget;
  readonly savings = this.planner.savings;

  /* Add-expense modal */
  readonly showForm = signal(false);
  readonly draft = signal<Omit<Expense, 'id'>>(this.emptyDraft());

  get paidExpenses(): Expense[] {
    return this.expenses().filter(e => e.status === 'paid');
  }

  get plannedExpenses(): Expense[] {
    return this.expenses().filter(e => e.status === 'planned');
  }

  budgetUsedPercent(): number {
    const budget = this.onboarding().budget || 1;
    return Math.min(100, Math.round((this.totalPlanned() / budget) * 100));
  }

  paidPercent(): number {
    const planned = this.totalPlanned() || 1;
    return Math.round((this.totalPaid() / planned) * 100);
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
  }

  openForm(): void {
    this.draft.set(this.emptyDraft());
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  patchDraft<K extends keyof Omit<Expense, 'id'>>(key: K, value: Omit<Expense, 'id'>[K]): void {
    this.draft.update(d => ({ ...d, [key]: value }));
  }

  get canSave(): boolean {
    const d = this.draft();
    return !!d.description.trim() && !!d.vendorName.trim() && d.amount > 0 && !!d.category;
  }

  save(): void {
    if (!this.canSave) return;
    this.planner.addExpense(this.draft());
    this.showForm.set(false);
  }

  togglePaid(e: Expense): void {
    const next: ExpenseStatus = e.status === 'paid' ? 'planned' : 'paid';
    this.planner.updateExpenseStatus(e.id, next);
  }

  remove(id: string): void {
    this.planner.removeExpense(id);
  }

  private emptyDraft(): Omit<Expense, 'id'> {
    return {
      description: '',
      category: 'Buffet',
      vendorName: '',
      isCustomVendor: false,
      amount: 0,
      status: 'planned',
      date: new Date().toISOString().slice(0, 10),
    };
  }
}

