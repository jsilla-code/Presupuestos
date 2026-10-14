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

export type TabView = 'hoy' | 'lista' | 'stats' | 'ajustes' | 'det' | 'edit';
export type ListFilter = 'todos' | 'pendientes' | 'vencidos' | 'aceptados' | 'rechazados' | 'borradores';
export type StatsPeriod = 'todo' | 'anio' | 'mes';
