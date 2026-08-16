import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { WeddingPlannerService } from '../services/wedding-planner.service';

type PersonalizeTab = 'photos' | 'videos' | 'collages';

@Component({
  selector: 'app-personalize',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTabsModule,
  ],
  templateUrl: './personalize.component.html',
  styleUrl: './personalize.component.scss',
})
export class PersonalizeComponent {
  private readonly planner = inject(WeddingPlannerService);

  readonly active = signal<PersonalizeTab>('photos');
  readonly photos = this.planner.photos;
  readonly videos = this.planner.videos;
  readonly collages = this.planner.collages;

  readonly collageDraft = signal({
    title: '',
    description: '',
    imageUrl: '',
  });

  async onPickPhotos(event: Event): Promise<void> {
    await this.handleFiles(event, 'photo');
  }

  async onPickVideos(event: Event): Promise<void> {
    await this.handleFiles(event, 'video');
  }

  removeMedia(id: string): void {
    this.planner.removePersonalMedia(id);
  }

  patchCollage(field: 'title' | 'description' | 'imageUrl', value: string): void {
    this.collageDraft.update(current => ({ ...current, [field]: value }));
  }

  addCollage(): void {
    const draft = this.collageDraft();
    if (!draft.title.trim()) return;
    this.planner.addCollage({
      title: draft.title.trim(),
      description: draft.description.trim(),
      imageUrl: draft.imageUrl.trim(),
    });
    this.collageDraft.set({ title: '', description: '', imageUrl: '' });
  }

  removeCollage(id: string): void {
    this.planner.removeCollage(id);
  }

  private async handleFiles(event: Event, type: 'photo' | 'video'): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    const loaded = await Promise.all(
      files.map(async file => ({
        type,
        name: file.name,
        dataUrl: await this.fileToDataUrl(file),
      })),
    );
    this.planner.addPersonalMedia(loaded);
    input.value = '';
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Nao foi possivel carregar o arquivo selecionado.'));
      reader.readAsDataURL(file);
    });
  }
}

