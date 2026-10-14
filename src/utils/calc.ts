import { LineItem, Quote } from '../types';

export const MOTIVOS = [
  'Precio',
  'Plazo',
  'Ha elegido otra alternativa',
  'Ya no necesita el servicio',
  'Otro motivo'
];

export const IVAS = [21, 10, 4, 0];

export function num(v: unknown): number {
  const n = parseFloat(String(v == null ? '' : v).replace(',', '.'));
  return isFinite(n) ? n : 0;
}

export function rnd(x: number): number {
  return Math.round(x + (x < 0 ? -1e-9 : 1e-9));
}

export function clampDisc(v: unknown): number {
  return Math.min(100, Math.max(0, num(v)));
}

export function lineBase(l: LineItem): number {
  return rnd(num(l.qty) * num(l.price) * 100);
}

export function lineTotal(l: LineItem): number {
  const b = lineBase(l);
  return b - rnd((b * clampDisc(l.disc)) / 100);
}

export interface IvaBreakdown {
  rate: number;
  base: number;
  cuota: number;
}

export interface QuoteCalc {
  bruto: number;
  desc: number;
  base: number;
  ivas: IvaBreakdown[];
  imp: number;
  total: number;
}

export function calc(lineas: LineItem[]): QuoteCalc {
  let bruto = 0;
  let desc = 0;
  const g: Record<number, number> = {};

  lineas.forEach((l) => {
    const b = lineBase(l);
    const dd = rnd((b * clampDisc(l.disc)) / 100);
    const k = num(l.iva);
    bruto += b;
    desc += dd;
    g[k] = (g[k] || 0) + b - dd;
  });

  const ivas: IvaBreakdown[] = Object.keys(g)
    .map(Number)
    .sort((a, b) => b - a)
    .map((k) => ({
      rate: k,
      base: g[k],
      cuota: rnd((g[k] * k) / 100),
    }));

  const imp = ivas.reduce((s, x) => s + x.cuota, 0);
  const base = bruto - desc;

  return { bruto, desc, base, ivas, imp, total: base + imp };
}

export function fmt(c: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(c / 100);
}

export function qTotal(q: Quote): number {
  return calc(q.lineas).total;
}

export function uid(): string {
  return 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function nextNum(quotes: Quote[]): string {
  const y = new Date().getFullYear();
  const re = new RegExp('^PF-' + y + '-(\\d+)$');
  let mx = 0;
  quotes.forEach((q) => {
    const m = re.exec(q.num);
    if (m) mx = Math.max(mx, parseInt(m[1], 10));
  });
  return 'PF-' + y + '-' + String(mx + 1).padStart(4, '0');
}

export function firstName(n: string): string {
  return String(n || '').trim().split(/\s+/)[0] || '';
}

export function plural(n: number, a: string, b: string): string {
  return n === 1 ? a : b;
}
