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
  rating?: number | null;
  reviewCount?: number | null;
}

export interface VendorFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  maxDistance?: number;
  startDate?: Date | null;
  endDate?: Date | null;
  city?: string;
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

export interface OnboardingResponse {
  coupleNames: string | null;
  style: string | null;
  guestCount: number | null;
  budget: number | null;
  eventDate: string | null;
  city: string | null;
  priorities: string[] | null;
  completed: boolean;
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

  async getVendors(filters: VendorFilters = {}): Promise<Vendor[]> {
    const url = new URL(`${this.baseUrl}/vendors`);
    if (filters.city?.trim()) url.searchParams.set('city', filters.city.trim());
    if (filters.category) url.searchParams.set('category', filters.category);
    if (filters.priceMin != null) url.searchParams.set('priceMin', String(filters.priceMin));
    if (filters.priceMax != null) url.searchParams.set('priceMax', String(filters.priceMax));
    if (filters.maxDistance != null) url.searchParams.set('maxDistance', String(filters.maxDistance));
    if (filters.startDate) url.searchParams.set('startDate', filters.startDate.toISOString());
    if (filters.endDate) url.searchParams.set('endDate', filters.endDate.toISOString());
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

  async getOnboarding(token: string): Promise<OnboardingResponse> {
    try {
      return await firstValueFrom(
        this.http.get<OnboardingResponse>(`${this.baseUrl}/onboarding`, {
          headers: new HttpHeaders({
            Authorization: `Bearer ${token}`,
          }),
        }),
      );
    } catch (error) {
      throw new Error(this.getErrorMessage(error, 'Erro ao carregar onboarding'));
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
