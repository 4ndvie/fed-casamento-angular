import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface Vendor {
  id: string;
  companyName: string;
  category: string;
  city: string;
  state: string;
  startingPrice?: number | null;
}

export interface AuthInput {
  email: string;
  password: string;
  fullName?: string;
  role?: 'BRIDE_GROOM' | 'VENDOR';
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'BRIDE_GROOM' | 'VENDOR' | 'ADMIN';
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface CreateQuotePayload {
  vendorId: string;
  eventDate: string;
  guestCount: number;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class MarketplaceApiService {
  private readonly baseUrl = 'http://127.0.0.1:3000';

  constructor(private readonly http: HttpClient) {}

  async getVendors(city?: string): Promise<Vendor[]> {
    const url = new URL(`${this.baseUrl}/vendors`);
    if (city?.trim()) {
      url.searchParams.set('city', city.trim());
    }
    return firstValueFrom(this.http.get<Vendor[]>(url.toString()));
  }

  async register(payload: AuthInput): Promise<AuthResponse> {
    try {
      return await firstValueFrom(
        this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, payload),
      );
    } catch (error) {
      throw new Error(this.getErrorMessage(error, 'Erro ao cadastrar'));
    }
  }

  async login(payload: AuthInput): Promise<AuthResponse> {
    try {
      return await firstValueFrom(
        this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, {
          email: payload.email,
          password: payload.password,
        }),
      );
    } catch (error) {
      throw new Error(this.getErrorMessage(error, 'Erro ao autenticar'));
    }
  }

  async createQuote(payload: CreateQuotePayload, token: string): Promise<unknown> {
    try {
      return await firstValueFrom(
        this.http.post<unknown>(`${this.baseUrl}/quotes`, payload, {
          headers: new HttpHeaders({
            Authorization: `Bearer ${token}`,
          }),
        }),
      );
    } catch (error) {
      throw new Error(this.getErrorMessage(error, 'Erro ao enviar orçamento'));
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const backend = error.error as { message?: string } | null;
      if (backend?.message) {
        return backend.message;
      }
    }
    return fallback;
  }
}
