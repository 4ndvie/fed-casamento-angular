import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AuthUser,
  MarketplaceApiService,
  Vendor,
} from './services/marketplace-api.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly authStorageKey = 'mqc_auth_session';

  vendors: Vendor[] = [];
  selectedVendor: Vendor | null = null;
  cityFilter = '';

  eventDate = '';
  guestCount = 100;
  message = '';
  statusMsg = '';

  authMode: AuthMode = 'login';
  email = '';
  password = '';
  fullName = '';
  token = '';
  authUser: AuthUser | null = null;

  constructor(private readonly api: MarketplaceApiService) {}

  async ngOnInit(): Promise<void> {
    const session = this.readStoredSession();
    if (session) {
      this.token = session.token;
      this.authUser = session.user;
    }
    await this.loadVendors();
  }

  async loadVendors(): Promise<void> {
    try {
      this.vendors = await this.api.getVendors(this.cityFilter);
    } catch (error) {
      this.statusMsg = this.getErrorMessage(error);
    }
  }

  saveSession(nextToken: string, user: AuthUser): void {
    localStorage.setItem(this.authStorageKey, JSON.stringify({ token: nextToken, user }));
    this.token = nextToken;
    this.authUser = user;
  }

  clearSession(): void {
    localStorage.removeItem(this.authStorageKey);
    this.token = '';
    this.authUser = null;
  }

  async handleAuthSubmit(): Promise<void> {
    try {
      const authResponse =
        this.authMode === 'register'
          ? await this.api.register({
              email: this.email,
              password: this.password,
              fullName: this.fullName,
              role: 'BRIDE_GROOM',
            })
          : await this.api.login({
              email: this.email,
              password: this.password,
            });

      this.saveSession(authResponse.token, authResponse.user);
      this.statusMsg =
        this.authMode === 'register'
          ? 'Cadastro realizado com sucesso!'
          : 'Login realizado com sucesso!';
      this.password = '';
    } catch (error) {
      this.statusMsg = this.getErrorMessage(error);
    }
  }

  async handleSendQuote(): Promise<void> {
    if (!this.selectedVendor) return;
    if (!this.token) {
      this.statusMsg = 'Faça login para enviar orçamento.';
      return;
    }

    try {
      await this.api.createQuote(
        {
          vendorId: this.selectedVendor.id,
          eventDate: new Date(this.eventDate).toISOString(),
          guestCount: Number(this.guestCount),
          message: this.message,
        },
        this.token,
      );
      this.statusMsg = 'Orçamento enviado com sucesso!';
      this.selectedVendor = null;
      this.message = '';
    } catch (error) {
      this.statusMsg = this.getErrorMessage(error);
    }
  }

  private readStoredSession(): { token: string; user: AuthUser } | null {
    const raw = localStorage.getItem(this.authStorageKey);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as { token?: string; user?: AuthUser };
      if (!parsed.token || !parsed.user) {
        return null;
      }
      return { token: parsed.token, user: parsed.user };
    } catch {
      return null;
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Erro inesperado';
  }
}
