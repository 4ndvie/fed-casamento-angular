import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GoogleCalendarService } from '../services/google-calendar.service';
import {
  AppNotification,
  NotificationType,
  WeddingPlannerService,
} from '../services/wedding-planner.service';

const GOOGLE_TOKEN_STORAGE_KEY = 'mqc_google_calendar_token';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent {
  private readonly planner = inject(WeddingPlannerService);
  private readonly googleCalendar = inject(GoogleCalendarService);
  private readonly snackBar = inject(MatSnackBar);

  readonly notifications = this.planner.notifications;
  readonly unread = this.planner.unreadNotifications;

  googleToken = localStorage.getItem(GOOGLE_TOKEN_STORAGE_KEY) ?? '';
  isGoogleSyncLoading = false;

  private readonly meta: Record<NotificationType, { icon: string; label: string }> = {
    reminder: { icon: 'notifications_active', label: 'Lembrete' },
    message: { icon: 'chat', label: 'Mensagem' },
    update: { icon: 'campaign', label: 'Atualização' },
    deadline: { icon: 'schedule', label: 'Prazo' },
  };

  icon(type: NotificationType): string {
    return this.meta[type].icon;
  }

  label(type: NotificationType): string {
    return this.meta[type].label;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  markRead(id: string): void {
    this.planner.markNotificationRead(id);
  }

  markAll(): void {
    this.planner.markAllNotificationsRead();
  }

  saveGoogleToken(): void {
    localStorage.setItem(GOOGLE_TOKEN_STORAGE_KEY, this.googleToken.trim());
    this.notify('Token do Google Calendar salvo.', 'success');
  }

  clearGoogleToken(): void {
    this.googleToken = '';
    localStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY);
    this.notify('Token removido.', 'info');
  }

  async addToGoogleCalendar(notification: AppNotification): Promise<void> {
    const event = this.toGoogleEvent(notification);

    if (!this.googleToken.trim()) {
      // Fallback if OAuth token is not configured.
      this.googleCalendar.openTemplate(event);
      this.planner.toggleCalendarSync(notification.id);
      this.notify('Abrimos o Google Calendar com os dados preenchidos.', 'info');
      return;
    }

    this.isGoogleSyncLoading = true;
    try {
      await this.googleCalendar.createEvent(event, this.googleToken.trim());
      if (!notification.addToCalendar) this.planner.toggleCalendarSync(notification.id);
      this.notify('Evento criado no Google Calendar.', 'success');
    } catch (error) {
      this.notify(
        error instanceof Error ? error.message : 'Falha ao enviar para Google Calendar.',
        'error',
      );
    } finally {
      this.isGoogleSyncLoading = false;
    }
  }

  /** Exports the notification as an .ics file so it can be added to any calendar app. */
  addToCalendar(notification: AppNotification): void {
    const start = new Date(notification.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Miseri e Quero Casar//Planner//PT-BR',
      'BEGIN:VEVENT',
      `UID:${notification.id}@miserequerocasar`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${notification.title}`,
      `DESCRIPTION:${notification.description}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notification.title.replace(/\s+/g, '-').toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    if (!notification.addToCalendar) this.planner.toggleCalendarSync(notification.id);
  }

  private toGoogleEvent(notification: AppNotification): {
    title: string;
    description: string;
    startIso: string;
    endIso: string;
  } {
    const start = new Date(notification.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
      title: notification.title,
      description: notification.description,
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    };
  }

  private notify(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: [`${type}-snackbar`],
    });
  }
}
