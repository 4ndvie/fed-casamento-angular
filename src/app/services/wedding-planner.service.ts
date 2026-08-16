import { Injectable, signal, computed } from '@angular/core';

/* ─────────────────────────── Models ─────────────────────────── */

export type WeddingStyle =
  | 'classico'
  | 'rustico'
  | 'praia'
  | 'moderno'
  | 'intimista'
  | 'religioso';

export interface OnboardingData {
  completed: boolean;
  coupleNames: string;
  style: WeddingStyle | '';
  guestCount: number;
  budget: number;
  eventDate: string; // ISO date (yyyy-mm-dd)
  city: string;
  priorities: string[]; // ex.: ['Fotografia', 'Buffet']
}

export type QuoteStatus = 'pending' | 'answered' | 'approved' | 'expiring';

export interface Quote {
  id: string;
  vendorName: string;
  category: string;
  status: QuoteStatus;
  amount: number | null;
  requestedAt: string; // ISO
  dueDate: string; // ISO — prazo de resposta / validade
  message: string;
}

export interface FavoriteItem {
  id: string;
  name: string;
  category: string;
  city: string;
  startingPrice: number | null;
  rating: number;
  savedAt: string; // ISO
}

export type NotificationType = 'reminder' | 'message' | 'update' | 'deadline';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  date: string; // ISO — data do evento/lembrete
  read: boolean;
  addToCalendar: boolean;
}

export type ExpenseStatus = 'planned' | 'paid';

export interface Expense {
  id: string;
  description: string;
  category: string;
  vendorName: string;
  isCustomVendor: boolean; // fornecedor fora da plataforma
  amount: number;
  status: ExpenseStatus;
  date: string; // ISO
}

export interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  done: boolean;
  phase: 'inicio' | 'meio' | 'reta-final';
}

export type PersonalMediaType = 'photo' | 'video';

export interface PersonalMediaItem {
  id: string;
  type: PersonalMediaType;
  name: string;
  dataUrl: string;
  createdAt: string;
}

export interface CollageItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: string;
}

const STORAGE_KEY = 'mqc_planner_state';

interface PersistedState {
  onboarding: OnboardingData;
  favorites: FavoriteItem[];
  expenses: Expense[];
  notifications: AppNotification[];
  guide: GuideStep[];
  personalMedia: PersonalMediaItem[];
  collages: CollageItem[];
}

/* ─────────────────────────── Service ─────────────────────────── */

@Injectable({ providedIn: 'root' })
export class WeddingPlannerService {
  private readonly _onboarding = signal<OnboardingData>(this.defaultOnboarding());
  private readonly _favorites = signal<FavoriteItem[]>([]);
  private readonly _expenses = signal<Expense[]>([]);
  private readonly _notifications = signal<AppNotification[]>([]);
  private readonly _quotes = signal<Quote[]>(this.seedQuotes());
  private readonly _guide = signal<GuideStep[]>(this.seedGuide());
  private readonly _personalMedia = signal<PersonalMediaItem[]>([]);
  private readonly _collages = signal<CollageItem[]>([]);

  /* Public readonly views */
  readonly onboarding = this._onboarding.asReadonly();
  readonly favorites = this._favorites.asReadonly();
  readonly expenses = this._expenses.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly quotes = this._quotes.asReadonly();
  readonly guide = this._guide.asReadonly();
  readonly personalMedia = this._personalMedia.asReadonly();
  readonly collages = this._collages.asReadonly();

  /* Derived data */
  readonly unreadNotifications = computed(
    () => this._notifications().filter(n => !n.read).length,
  );

  readonly guideProgress = computed(() => {
    const steps = this._guide();
    if (!steps.length) return 0;
    return Math.round((steps.filter(s => s.done).length / steps.length) * 100);
  });

  readonly nextGuideStep = computed(() => this._guide().find(s => !s.done) ?? null);

  readonly totalPlanned = computed(() =>
    this._expenses().reduce((sum, e) => sum + e.amount, 0),
  );

  readonly totalPaid = computed(() =>
    this._expenses()
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0),
  );

  readonly remainingBudget = computed(
    () => this._onboarding().budget - this.totalPlanned(),
  );

  readonly savings = computed(() => {
    const budget = this._onboarding().budget;
    const planned = this.totalPlanned();
    return budget > planned ? budget - planned : 0;
  });

  readonly expensesByCategory = computed(() => {
    const map = new Map<string, number>();
    for (const e of this._expenses()) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    const total = this.totalPlanned() || 1;
    return Array.from(map.entries())
      .map(([category, value]) => ({
        category,
        value,
        percent: Math.round((value / total) * 100),
      }))
      .sort((a, b) => b.value - a.value);
  });

  readonly quotesByStatus = computed(() => {
    const quotes = this._quotes();
    return {
      pending: quotes.filter(q => q.status === 'pending'),
      answered: quotes.filter(q => q.status === 'answered'),
      approved: quotes.filter(q => q.status === 'approved'),
      expiring: quotes.filter(q => q.status === 'expiring'),
    };
  });

  readonly photos = computed(() => this._personalMedia().filter(i => i.type === 'photo'));
  readonly videos = computed(() => this._personalMedia().filter(i => i.type === 'video'));

  constructor() {
    this.restore();
  }

  /* ── Onboarding ── */
  saveOnboarding(data: Partial<OnboardingData>, completed = false): void {
    this._onboarding.update(current => ({ ...current, ...data, completed }));
    this.persist();
  }

  resetOnboarding(): void {
    this._onboarding.set(this.defaultOnboarding());
    this.persist();
  }

  /* ── Favorites ── */
  isFavorite(id: string): boolean {
    return this._favorites().some(f => f.id === id);
  }

  toggleFavorite(item: FavoriteItem): void {
    this._favorites.update(list =>
      list.some(f => f.id === item.id)
        ? list.filter(f => f.id !== item.id)
        : [{ ...item, savedAt: new Date().toISOString() }, ...list],
    );
    this.persist();
  }

  removeFavorite(id: string): void {
    this._favorites.update(list => list.filter(f => f.id !== id));
    this.persist();
  }

  /* ── Expenses ── */
  addExpense(expense: Omit<Expense, 'id'>): void {
    this._expenses.update(list => [
      { ...expense, id: crypto.randomUUID() },
      ...list,
    ]);
    this.persist();
  }

  updateExpenseStatus(id: string, status: ExpenseStatus): void {
    this._expenses.update(list =>
      list.map(e => (e.id === id ? { ...e, status } : e)),
    );
    this.persist();
  }

  removeExpense(id: string): void {
    this._expenses.update(list => list.filter(e => e.id !== id));
    this.persist();
  }

  /* ── Notifications ── */
  markNotificationRead(id: string): void {
    this._notifications.update(list =>
      list.map(n => (n.id === id ? { ...n, read: true } : n)),
    );
    this.persist();
  }

  markAllNotificationsRead(): void {
    this._notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.persist();
  }

  toggleCalendarSync(id: string): void {
    this._notifications.update(list =>
      list.map(n => (n.id === id ? { ...n, addToCalendar: !n.addToCalendar } : n)),
    );
    this.persist();
  }

  /* ── Guide ── */
  toggleGuideStep(id: string): void {
    this._guide.update(list =>
      list.map(s => (s.id === id ? { ...s, done: !s.done } : s)),
    );
    this.persist();
  }

  /* ── Personalize ── */
  addPersonalMedia(items: Array<Omit<PersonalMediaItem, 'id' | 'createdAt'>>): void {
    this._personalMedia.update(list => [
      ...items.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      })),
      ...list,
    ]);
    this.persist();
  }

  removePersonalMedia(id: string): void {
    this._personalMedia.update(list => list.filter(item => item.id !== id));
    this.persist();
  }

  addCollage(input: Omit<CollageItem, 'id' | 'createdAt'>): void {
    this._collages.update(list => [
      {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      },
      ...list,
    ]);
    this.persist();
  }

  removeCollage(id: string): void {
    this._collages.update(list => list.filter(item => item.id !== id));
    this.persist();
  }

  /* ─────────────── Persistence ─────────────── */
  private persist(): void {
    const state: PersistedState = {
      onboarding: this._onboarding(),
      favorites: this._favorites(),
      expenses: this._expenses(),
      notifications: this._notifications(),
      guide: this._guide(),
      personalMedia: this._personalMedia(),
      collages: this._collages(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }

  private restore(): void {
    let parsed: Partial<PersistedState> | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      parsed = raw ? (JSON.parse(raw) as Partial<PersistedState>) : null;
    } catch {
      parsed = null;
    }

    if (parsed?.onboarding) this._onboarding.set(parsed.onboarding);
    if (parsed?.favorites) this._favorites.set(parsed.favorites);
    if (parsed?.expenses) this._expenses.set(parsed.expenses);
    this._notifications.set(
      parsed?.notifications?.length ? parsed.notifications : this.seedNotifications(),
    );
    if (parsed?.guide?.length) this._guide.set(parsed.guide);
    if (parsed?.personalMedia) this._personalMedia.set(parsed.personalMedia);
    if (parsed?.collages) this._collages.set(parsed.collages);
  }

  /* ─────────────── Defaults / mock seeds ─────────────── */
  private defaultOnboarding(): OnboardingData {
    return {
      completed: false,
      coupleNames: '',
      style: '',
      guestCount: 100,
      budget: 50000,
      eventDate: '',
      city: '',
      priorities: [],
    };
  }

  private daysFromNow(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  private seedQuotes(): Quote[] {
    return [
      {
        id: 'q1',
        vendorName: 'Estúdio Luz & Amor',
        category: 'Fotografia',
        status: 'pending',
        amount: null,
        requestedAt: this.daysFromNow(-3),
        dueDate: this.daysFromNow(4),
        message: 'Cobertura completa da cerimônia e festa.',
      },
      {
        id: 'q2',
        vendorName: 'Buffet Sabor Real',
        category: 'Buffet',
        status: 'answered',
        amount: 18500,
        requestedAt: this.daysFromNow(-6),
        dueDate: this.daysFromNow(10),
        message: 'Menu para 120 convidados, incluindo bar.',
      },
      {
        id: 'q3',
        vendorName: 'Banda Encanto',
        category: 'Música',
        status: 'approved',
        amount: 7200,
        requestedAt: this.daysFromNow(-14),
        dueDate: this.daysFromNow(-2),
        message: 'Banda + DJ para a recepção.',
      },
      {
        id: 'q4',
        vendorName: 'Flores da Serra',
        category: 'Decoração',
        status: 'expiring',
        amount: 9800,
        requestedAt: this.daysFromNow(-8),
        dueDate: this.daysFromNow(2),
        message: 'Decoração floral do altar e mesas.',
      },
      {
        id: 'q5',
        vendorName: 'Espaço Villa Bella',
        category: 'Espaço',
        status: 'pending',
        amount: null,
        requestedAt: this.daysFromNow(-1),
        dueDate: this.daysFromNow(6),
        message: 'Aluguel do espaço para 120 pessoas.',
      },
    ];
  }

  private seedNotifications(): AppNotification[] {
    return [
      {
        id: 'n1',
        type: 'deadline',
        title: 'Orçamento vencendo',
        description: 'A proposta de Flores da Serra expira em 2 dias.',
        date: this.daysFromNow(2),
        read: false,
        addToCalendar: true,
      },
      {
        id: 'n2',
        type: 'message',
        title: 'Nova mensagem do fornecedor',
        description: 'Buffet Sabor Real respondeu seu orçamento.',
        date: this.daysFromNow(0),
        read: false,
        addToCalendar: false,
      },
      {
        id: 'n3',
        type: 'reminder',
        title: 'Prova do vestido',
        description: 'Lembrete: prova marcada no ateliê.',
        date: this.daysFromNow(7),
        read: false,
        addToCalendar: true,
      },
      {
        id: 'n4',
        type: 'update',
        title: 'Dica do guia',
        description: 'Chegou a hora de definir a lista de convidados.',
        date: this.daysFromNow(1),
        read: true,
        addToCalendar: false,
      },
    ];
  }

  private seedGuide(): GuideStep[] {
    return [
      {
        id: 'g1',
        title: 'Defina o estilo e a data',
        description: 'Escolha o tipo de casamento e reserve a data ideal.',
        icon: 'event_available',
        done: false,
        phase: 'inicio',
      },
      {
        id: 'g2',
        title: 'Monte a lista de convidados',
        description: 'Estime o número de convidados para dimensionar o evento.',
        icon: 'groups',
        done: false,
        phase: 'inicio',
      },
      {
        id: 'g3',
        title: 'Reserve o espaço',
        description: 'Garanta o local antes de fechar os demais fornecedores.',
        icon: 'location_city',
        done: false,
        phase: 'meio',
      },
      {
        id: 'g4',
        title: 'Contrate fornecedores principais',
        description: 'Buffet, fotografia e música costumam esgotar rápido.',
        icon: 'handshake',
        done: false,
        phase: 'meio',
      },
      {
        id: 'g5',
        title: 'Envie os convites',
        description: 'Envie com antecedência e acompanhe as confirmações.',
        icon: 'mail',
        done: false,
        phase: 'reta-final',
      },
      {
        id: 'g6',
        title: 'Confirme os detalhes finais',
        description: 'Reveja pagamentos, horários e logística da semana.',
        icon: 'task_alt',
        done: false,
        phase: 'reta-final',
      },
    ];
  }
}
