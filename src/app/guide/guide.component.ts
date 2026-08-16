import { CommonModule } from '@angular/common';
import { Component, inject, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { GuideStep, WeddingPlannerService } from '../services/wedding-planner.service';

@Component({
  selector: 'app-guide',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './guide.component.html',
  styleUrl: './guide.component.scss',
})
export class GuideComponent {
  private readonly planner = inject(WeddingPlannerService);

  readonly progress = this.planner.guideProgress;
  readonly nextStep = this.planner.nextGuideStep;
  readonly onboarding = this.planner.onboarding;

  readonly phases: Array<{ key: GuideStep['phase']; label: string }> = [
    { key: 'inicio', label: 'Início do planejamento' },
    { key: 'meio', label: 'Contratações' },
    { key: 'reta-final', label: 'Reta final' },
  ];

  readonly stepsByPhase = computed(() => {
    const steps = this.planner.guide();
    return this.phases.map(p => ({
      ...p,
      steps: steps.filter(s => s.phase === p.key),
    }));
  });

  toggle(id: string): void {
    this.planner.toggleGuideStep(id);
  }

  daysToEvent(): number | null {
    const date = this.onboarding().eventDate;
    if (!date) return null;
    const diff = new Date(date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}

