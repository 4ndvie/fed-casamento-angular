import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { WeddingPlannerService } from '../services/wedding-planner.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
})
export class FavoritesComponent {
  private readonly planner = inject(WeddingPlannerService);

  readonly favorites = this.planner.favorites;

  private readonly icons: Record<string, string> = {
    Fotografia: 'photo_camera',
    Buffet: 'restaurant',
    Música: 'music_note',
    Decoração: 'celebration',
    Espaço: 'location_city',
    Assessoria: 'groups',
  };

  icon(category: string): string {
    return this.icons[category] ?? 'storefront';
  }

  formatCurrency(value: number | null): string {
    return value == null ? 'Sob consulta' : `R$ ${value.toLocaleString('pt-BR')}`;
  }

  remove(id: string): void {
    this.planner.removeFavorite(id);
  }
}

