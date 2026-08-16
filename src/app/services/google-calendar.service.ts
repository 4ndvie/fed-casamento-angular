import { Injectable } from '@angular/core';

export interface GoogleCalendarEventInput {
  title: string;
  description: string;
  startIso: string;
  endIso: string;
}

@Injectable({ providedIn: 'root' })
export class GoogleCalendarService {
  private readonly baseUrl = 'https://www.googleapis.com/calendar/v3';

  /**
   * Creates an event using Google Calendar REST API.
   * Requires a valid OAuth2 access token with calendar scope.
   */
  async createEvent(
    event: GoogleCalendarEventInput,
    accessToken: string,
    calendarId = 'primary',
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          start: {
            dateTime: event.startIso,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: event.endIso,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      },
    );

    if (!response.ok) {
      let backendMessage = '';
      try {
        backendMessage = await response.text();
      } catch {
        backendMessage = '';
      }
      throw new Error(
        backendMessage ||
          'Nao foi possivel criar evento no Google Calendar. Verifique o token OAuth.',
      );
    }
  }

  /** Fallback: opens the Google Calendar template URL in a new tab. */
  openTemplate(event: GoogleCalendarEventInput): void {
    const fmt = (iso: string): string =>
      new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const query = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      details: event.description,
      dates: `${fmt(event.startIso)}/${fmt(event.endIso)}`,
    });
    window.open(`https://calendar.google.com/calendar/render?${query.toString()}`, '_blank');
  }
}

