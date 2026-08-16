import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';

export interface VendorSearchFilters {
  category: string;
  priceRange: [number, number];
  maxDistance: number;
  startDate: Date | null;
  endDate: Date | null;
  city: string;
}

@Component({
  selector: 'app-vendor-search',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
  ],
  templateUrl: './vendor-search.component.html',
  styleUrl: './vendor-search.component.scss',
})
export class VendorSearchComponent {
  @Output() search = new EventEmitter<VendorSearchFilters>();

  private readonly fb = inject(FormBuilder);

  readonly categories = [
    { value: 'Fotografia', icon: 'photo_camera' },
    { value: 'Buffet', icon: 'restaurant' },
    { value: 'Música', icon: 'music_note' },
    { value: 'Decoração', icon: 'celebration' },
    { value: 'Espaço', icon: 'location_city' },
    { value: 'Assessoria', icon: 'groups' },
  ] as const;

  readonly form = this.fb.group({
    category: ['Fotografia'],
    priceMin: [500],
    priceMax: [30000],
    maxDistance: [100],
    startDate: [null as Date | null],
    endDate: [null as Date | null],
    city: [''],
  });

  get selectedCategoryIcon(): string {
    return this.categories.find(c => c.value === this.form.value.category)?.icon ?? 'photo_camera';
  }

  get selectedCategoryValue(): string {
    return this.form.value.category ?? 'Fotografia';
  }

  get priceMinLabel(): string {
    const v = this.form.value.priceMin ?? 500;
    return `R$ ${v.toLocaleString('pt-BR')}`;
  }

  get priceMaxLabel(): string {
    const v = this.form.value.priceMax ?? 30000;
    return v >= 30000 ? 'R$ 30.000+' : `R$ ${v.toLocaleString('pt-BR')}`;
  }

  get maxDistanceLabel(): string {
    const v = this.form.value.maxDistance ?? 100;
    return `Até ${v} km`;
  }

  get cityDisplay(): string {
    return this.form.value.city?.trim() || 'Todas as cidades';
  }

  readonly formatPrice = (value: number): string =>
    `R$ ${value.toLocaleString('pt-BR')}`;

  onSubmit(): void {
    const v = this.form.getRawValue();
    this.search.emit({
      category: v.category ?? 'Fotografia',
      priceRange: [v.priceMin ?? 500, v.priceMax ?? 30000],
      maxDistance: v.maxDistance ?? 100,
      startDate: v.startDate,
      endDate: v.endDate,
      city: v.city ?? '',
    });
  }
}

