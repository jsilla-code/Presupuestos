export interface LineItem {
  desc: string;
  qty: string;
  price: string;
  disc: string;
  iva: string;
}

export interface FollowUpStep {
  dia: number;
  hecho: string | null;
}

export interface QuoteHistory {
  f: string; // ISO datetime or YYYY-MM-DDTHH:mm
  t: string; // Event description
}

export type QuoteStatus = 'borrador' | 'enviado' | 'aceptado' | 'rechazado' | 'cancelado';

export interface Quote {
  id: string;
  num: string;
  example?: boolean;
  pausa: boolean;
  resuelto: string | null;
  motivo: string;
  nota: string;
  notas: string;
  condiciones: string;
  cliente: string;
  telefono: string;
  email: string;
  titulo: string;
  lineas: LineItem[];
  estado: QuoteStatus;
  emision: string; // YYYY-MM-DD
  validez: string; // YYYY-MM-DD
  enviado: string | null; // YYYY-MM-DD
  seg: FollowUpStep[];
  hist: QuoteHistory[];
}

export interface Settings {
  negocio: string;
  telefono: string;
  iva: number;
  dias: number[];
  condiciones: string;
}

export interface AppState {
  v: number;
  settings: Settings;
  quotes: Quote[];
}

export type TabView = 'hoy' | 'lista' | 'stats' | 'ajustes' | 'det' | 'edit' | 'admin_survey';
export type ListFilter = 'todos' | 'pendientes' | 'vencidos' | 'aceptados' | 'rechazados' | 'borradores';
export type StatsPeriod = 'todo' | 'anio' | 'mes';

export type TrialStatus = 'active' | 'expired';
export type SubscriptionStatus = 'none' | 'active' | 'canceled' | 'past_due';

export interface UserSubscriptionProfile {
  userId: string;
  email: string | null;
  displayName?: string | null;
  createdAt: string; // ISO 8601 UTC timestamp
  trialStartedAt: string; // ISO 8601 UTC timestamp
  trialEndsAt: string; // ISO 8601 UTC timestamp
  trialStatus: TrialStatus;
  subscriptionStatus: SubscriptionStatus;
  planId: string | null;
}

export type TrialBadgeType = 'trial_active' | 'trial_ending_soon' | 'trial_last_day' | 'trial_expired' | 'subscribed';

export interface TrialStateInfo {
  trialStartedAt: Date;
  trialEndsAt: Date;
  trialStatus: TrialStatus;
  subscriptionStatus: SubscriptionStatus;
  planId: string | null;
  isActive: boolean;
  hasSubscription: boolean;
  isTrialing: boolean;
  isExpired: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  badgeType: TrialBadgeType;
  message: string;
}

// Product Validation Survey (21 Days)
export interface SurveyAnswers {
  q1_usage: string; // 'habitualmente' | 'algunas_veces' | 'apenas' | 'no_suficiente' | ''
  q2_problems: string[]; // ['seguimiento', 'recordar_contacto', 'organizacion', 'ahorro_tiempo', 'ninguno', 'otro']
  q2_problemOther?: string;
  q3_mostValued?: string;
  q4_leastLiked?: string;
  q5_willingnessToPay: string; // 'contrataria' | 'probablemente' | 'dependeria' | 'probablemente_no' | 'no_pagaria' | 'no_valoro' | ''
  q5b_monthlyPrice?: string; // 'menos_6' | '6_10' | '10_15' | '15_20' | 'mas_20' | 'no_pagaria' | 'no_se' | ''
  q6_requestedFeatures?: string;
  q7_recommendScore?: number | null; // 0 to 10 or null if skipped
}

export interface SurveyResponse {
  id: string; // userId for 1-to-1 mapping
  userId: string;
  userEmail?: string | null;
  userCreatedAt?: string | null;
  submittedAt: string; // ISO 8601 string
  surveyVersion: string; // e.g. 'v1'
  answers: SurveyAnswers;
  status: 'completed';
}

export interface SurveyEligibility {
  isEligible: boolean;
  daysSinceRegistration: number;
  hasSubmitted: boolean;
  dismissedInSession: boolean;
  reason: string;
}


