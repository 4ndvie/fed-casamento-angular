import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  OnboardingData,
  WeddingPlannerService,
  WeddingStyle,
} from '../services/wedding-planner.service';

type Step = 'welcome' | 'questions' | 'summary';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent {
  @Output() finished = new EventEmitter<void>();

  private readonly planner = inject(WeddingPlannerService);

  readonly step = signal<Step>('welcome');

  readonly features = [
    { icon: 'storefront', title: 'Fornecedores', text: 'Encontre e compare os melhores profissionais.' },
    { icon: 'request_quote', title: 'Orçamentos', text: 'Solicite e acompanhe propostas em um só lugar.' },
    { icon: 'account_balance_wallet', title: 'Finanças', text: 'Controle gastos, metas e pagamentos.' },
    { icon: 'menu_book', title: 'Guia', text: 'Passo a passo para não esquecer nada.' },
  ];

  readonly styles: Array<{ value: WeddingStyle; label: string; icon: string }> = [
    { value: 'classico', label: 'Clássico', icon: 'church' },
    { value: 'rustico', label: 'Rústico', icon: 'forest' },
    { value: 'praia', label: 'Praia', icon: 'beach_access' },
    { value: 'moderno', label: 'Moderno', icon: 'auto_awesome' },
    { value: 'intimista', label: 'Intimista', icon: 'favorite' },
    { value: 'religioso', label: 'Religioso', icon: 'volunteer_activism' },
  ];

  readonly priorityOptions = ['Fotografia', 'Buffet', 'Música', 'Decoração', 'Espaço', 'Assessoria'];

  /* Local editable model, seeded from any saved data */
  readonly form = signal<OnboardingData>({ ...this.planner.onboarding() });

  readonly styleLabel = computed(
    () => this.styles.find(s => s.value === this.form().style)?.label ?? '—',
  );

  goToQuestions(): void {
    this.step.set('questions');
  }

  patch<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]): void {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  selectStyle(value: WeddingStyle): void {
    this.patch('style', value);
  }

  togglePriority(option: string): void {
    this.form.update(f => {
      const has = f.priorities.includes(option);
      return {
        ...f,
        priorities: has
          ? f.priorities.filter(p => p !== option)
          : [...f.priorities, option],
      };
    });
  }

  get canContinue(): boolean {
    const f = this.form();
    return !!f.coupleNames.trim() && !!f.style && !!f.eventDate && f.guestCount > 0;
  }

  goToSummary(): void {
    if (this.canContinue) this.step.set('summary');
  }

  backToQuestions(): void {
    this.step.set('questions');
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toLocaleString('pt-BR')}`;
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  confirm(): void {
    this.planner.saveOnboarding(this.form(), true);
    this.finished.emit();
  }
}

