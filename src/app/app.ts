import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  AuthUser,
  MarketplaceApiService,
  Vendor,
  VendorFilters,
} from './services/marketplace-api.service';
import { WeddingPlannerService } from './services/wedding-planner.service';
import { VendorSearchComponent, VendorSearchFilters } from './vendor-search/vendor-search.component';
import { OnboardingComponent } from './onboarding/onboarding.component';
import { QuotesComponent } from './quotes/quotes.component';
import { FavoritesComponent } from './favorites/favorites.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { FinancesComponent } from './finances/finances.component';
import { GuideComponent } from './guide/guide.component';

type AuthMode = 'login' | 'register';
type MenuItemId =
  | 'vendors'
  | 'quotes'
  | 'favorites'
  | 'calendar'
  | 'budget'
  | 'notifications'
  | 'guide'
  | 'profile'
  | 'settings';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    VendorSearchComponent,
    OnboardingComponent,
    QuotesComponent,
    FavoritesComponent,
    NotificationsComponent,
    FinancesComponent,
    GuideComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly authStorageKey = 'mqc_auth_session';

  vendors: Vendor[] = [];
  selectedVendor: Vendor | null = null;
  cityFilter = '';
  activeFilters: VendorFilters = {};

  eventDate = '';
  guestCount = 100;
  message = '';

  authMode: AuthMode = 'login';
  isAuthSubmitting = false;
  readonly authForm;
  isMenuCollapsed = false;
  activeMenu: MenuItemId = 'vendors';
  token = '';
  authUser: AuthUser | null = null;
  readonly menuMeta: Record<
    MenuItemId,
    { title: string; subtitle: string; actions: Array<{ icon: string; label: string; hint: string }> }
  > = {
    vendors: {
      title: 'Fornecedores em destaque',
      subtitle: 'Compare serviços por categoria, cidade e estilo.',
      actions: [
        { icon: 'photo_camera', label: 'Fotografia', hint: 'Ensaios e cobertura do evento.' },
        { icon: 'restaurant', label: 'Buffet', hint: 'Menus para todos os perfis de convidados.' },
        { icon: 'music_note', label: 'Música', hint: 'Bandas, DJs e cerimônia.' },
        { icon: 'celebration', label: 'Decoração', hint: 'Ambientação minimalista e elegante.' },
      ],
    },
    quotes: {
      title: 'Gestão de orçamentos',
      subtitle: 'Acompanhe solicitações, respostas e próximas ações.',
      actions: [
        { icon: 'pending_actions', label: 'Pendentes', hint: 'Pedidos aguardando retorno.' },
        { icon: 'mark_email_read', label: 'Respondidos', hint: 'Orçamentos já recebidos.' },
        { icon: 'task_alt', label: 'Aprovados', hint: 'Fornecedores confirmados.' },
        { icon: 'schedule', label: 'Vencendo', hint: 'Prazos próximos de expirar.' },
      ],
    },
    favorites: {
      title: 'Lista de favoritos',
      subtitle: 'Centralize seus fornecedores preferidos.',
      actions: [
        { icon: 'favorite', label: 'Mais salvos', hint: 'Itens com maior prioridade.' },
        { icon: 'map', label: 'Por região', hint: 'Visualize por cidade e estado.' },
        { icon: 'sell', label: 'Promoções', hint: 'Acompanhe condições especiais.' },
        { icon: 'share', label: 'Compartilhar', hint: 'Envie para noivos e familiares.' },
      ],
    },
    calendar: {
      title: 'Calendário do evento',
      subtitle: 'Organize datas-chave do planejamento.',
      actions: [
        { icon: 'event', label: 'Cerimônia', hint: 'Data principal e lembretes.' },
        { icon: 'cake', label: 'Provas', hint: 'Agenda de degustação e testes.' },
        { icon: 'groups', label: 'Reuniões', hint: 'Encontros com fornecedores.' },
        { icon: 'checklist', label: 'Checklist', hint: 'Marcos de execução.' },
      ],
    },
    budget: {
      title: 'Controle financeiro',
      subtitle: 'Acompanhe limites e distribuição de gastos.',
      actions: [
        { icon: 'wallet', label: 'Resumo geral', hint: 'Visão consolidada do orçamento.' },
        { icon: 'bar_chart', label: 'Por categoria', hint: 'Onde o investimento está maior.' },
        { icon: 'savings', label: 'Economia', hint: 'Metas para reduzir custos.' },
        { icon: 'receipt_long', label: 'Pagamentos', hint: 'Parcelas e comprovantes.' },
      ],
    },
    notifications: {
      title: 'Notificações',
      subtitle: 'Atualizações, lembretes e mensagens do planejamento.',
      actions: [
        { icon: 'notifications_active', label: 'Lembretes', hint: 'Próximas atividades e prazos.' },
        { icon: 'chat', label: 'Mensagens', hint: 'Retornos dos fornecedores.' },
        { icon: 'campaign', label: 'Atualizações', hint: 'Novidades da plataforma.' },
        { icon: 'event_available', label: 'Calendário', hint: 'Sincronize com sua agenda.' },
      ],
    },
    guide: {
      title: 'Guia de planejamento',
      subtitle: 'Passo a passo com dicas e lembretes do casamento.',
      actions: [
        { icon: 'flag', label: 'Início', hint: 'Estilo, data e convidados.' },
        { icon: 'handshake', label: 'Contratações', hint: 'Fornecedores principais.' },
        { icon: 'checklist', label: 'Reta final', hint: 'Confirmações e detalhes.' },
        { icon: 'tips_and_updates', label: 'Dicas', hint: 'Sugestões inteligentes.' },
      ],
    },
    profile: {
      title: 'Perfil do casal',
      subtitle: 'Dados de contato e preferências do evento.',
      actions: [
        { icon: 'person', label: 'Dados pessoais', hint: 'Informações principais do casal.' },
        { icon: 'palette', label: 'Estilo', hint: 'Paleta e referências visuais.' },
        { icon: 'group_add', label: 'Convidados', hint: 'Lista e confirmação de presença.' },
        { icon: 'lock', label: 'Privacidade', hint: 'Permissões e segurança.' },
      ],
    },
    settings: {
      title: 'Configurações do sistema',
      subtitle: 'Ajustes da sua experiência no painel.',
      actions: [
        { icon: 'notifications', label: 'Notificações', hint: 'Alertas por e-mail e app.' },
        { icon: 'language', label: 'Idioma', hint: 'Preferências regionais.' },
        { icon: 'dark_mode', label: 'Aparência', hint: 'Tema e densidade da interface.' },
        { icon: 'help', label: 'Suporte', hint: 'Ajuda e atendimento.' },
      ],
    },
  };

  constructor(
    private readonly api: MarketplaceApiService,
    private readonly formBuilder: FormBuilder,
    private readonly snackBar: MatSnackBar,
    private readonly planner: WeddingPlannerService,
  ) {
    this.authForm = this.formBuilder.group({
      fullName: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
    this.setAuthMode('login');
  }

  /* ── Onboarding / planner ── */
  get onboardingCompleted(): boolean {
    return this.planner.onboarding().completed;
  }

  get unreadNotifications(): number {
    return this.planner.unreadNotifications();
  }

  onOnboardingFinished(): void {
    this.notify('Configuração inicial concluída. Boa jornada!', 'success');
    this.setActiveMenu('guide');
  }

  isFavorite(vendor: Vendor): boolean {
    return this.planner.isFavorite(vendor.id);
  }

  toggleFavorite(vendor: Vendor, event: Event): void {
    event.stopPropagation();
    this.planner.toggleFavorite({
      id: vendor.id,
      name: vendor.companyName,
      category: vendor.category,
      city: `${vendor.city}, ${vendor.state}`,
      startingPrice: vendor.startingPrice ?? null,
      rating: Number(this.getVendorRating(vendor)),
      savedAt: new Date().toISOString(),
    });
  }

  async ngOnInit(): Promise<void> {
    const session = this.readStoredSession();
    if (session) {
      this.token = session.token;
      this.authUser = session.user;
    }
    await this.loadVendors({});
  }

  async loadVendors(filters: VendorFilters = this.activeFilters): Promise<void> {
    try {
      this.vendors = await this.api.getVendors(filters);
    } catch (error) {
      this.notify(this.getErrorMessage(error), 'error');
    }
  }

  onVendorSearch(filters: VendorSearchFilters): void {
    this.activeFilters = {
      category: filters.category,
      priceMin: filters.priceRange[0],
      priceMax: filters.priceRange[1],
      maxDistance: filters.maxDistance,
      startDate: filters.startDate,
      endDate: filters.endDate,
      city: filters.city,
    };
    this.cityFilter = filters.city;
    void this.loadVendors(this.activeFilters);
  }

  getCategoryIcon(category: string): string {
    const map: Record<string, string> = {
      Fotografia: 'photo_camera',
      Buffet: 'restaurant',
      Música: 'music_note',
      Decoração: 'celebration',
      Espaço: 'location_city',
      Assessoria: 'groups',
    };
    return map[category] ?? 'storefront';
  }

  getVendorRating(vendor: Vendor): string {
    if (vendor.rating != null) return vendor.rating.toFixed(1);
    const hash = vendor.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return (4.5 + (hash % 5) / 10).toFixed(1);
  }

  getVendorReviewCount(vendor: Vendor): number {
    if (vendor.reviewCount != null) return vendor.reviewCount;
    const hash = vendor.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return 50 + (hash % 100);
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
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
    this.isAuthSubmitting = false;
    this.setAuthMode('login');
    this.authForm.reset({ fullName: '', email: '', password: '' });
    this.authForm.markAsPristine();
    this.authForm.markAsUntouched();
  }

  async handleAuthSubmit(): Promise<void> {
    if (this.isAuthSubmitting) {
      return;
    }

    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      this.notify('Preencha os campos obrigatórios para continuar.', 'error');
      return;
    }

    const { email, password, fullName } = this.authForm.getRawValue();
    this.isAuthSubmitting = true;

    try {
      const authResponse =
        this.authMode === 'register'
          ? await this.api.register({
              email: email ?? '',
              password: password ?? '',
              fullName: fullName ?? '',
              role: 'BRIDE_GROOM',
            })
          : await this.api.login({
              email: email ?? '',
              password: password ?? '',
            });

      this.saveSession(authResponse.token, authResponse.user);
      this.notify(
        this.authMode === 'register'
          ? 'Cadastro realizado com sucesso!'
          : 'Login realizado com sucesso!',
        'success',
      );
      this.authForm.patchValue({ password: '' });
    } catch (error) {
      this.notify(this.getErrorMessage(error), 'error');
    } finally {
      this.isAuthSubmitting = false;
    }
  }

  setAuthMode(mode: AuthMode): void {
    this.authMode = mode;
    const fullNameControl = this.authForm.controls.fullName;
    if (mode === 'register') {
      fullNameControl.setValidators([Validators.required]);
    } else {
      fullNameControl.clearValidators();
      fullNameControl.setValue('');
    }
    fullNameControl.updateValueAndValidity();
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  get greetingSubtitle(): string {
    const firstName = this.authUser?.fullName?.split(' ')[0];
    return firstName
      ? `Encontre os melhores fornecedores para o seu grande dia, ${firstName}!`
      : 'Encontre tudo para o seu grande dia, noiva!';
  }

  setActiveMenu(menu: MenuItemId): void {
    this.activeMenu = menu;
  }

  get currentMenuData(): {
    title: string;
    subtitle: string;
    actions: Array<{ icon: string; label: string; hint: string }>;
  } {
    return this.menuMeta[this.activeMenu];
  }

  async handleSendQuote(): Promise<void> {
    if (!this.selectedVendor) return;
    if (!this.token) {
      this.notify('Faça login para enviar orçamento.', 'info');
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
      this.notify('Orçamento enviado com sucesso!', 'success');
      this.selectedVendor = null;
      this.message = '';
    } catch (error) {
      this.notify(this.getErrorMessage(error), 'error');
    }
  }

  private notify(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: [`${type}-snackbar`],
    });
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
