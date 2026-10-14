import { Quote } from '../types';
import { plural } from './calc';

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function iso(d: Date): string {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export function today(): string {
  return iso(new Date());
}

export function parseD(s: string): Date {
  const p = s.slice(0, 10).split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}

export function addDays(s: string, n: number): string {
  const d = parseD(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseD(a).getTime() - parseD(b).getTime()) / 86400000);
}

export function fdate(s: string | null | undefined): string {
  if (!s) return '—';
  return parseD(s.slice(0, 10)).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function isVencido(q: Quote): boolean {
  return q.estado === 'enviado' && !!q.validez && q.validez < today();
}

export interface NextFollowUp {
  i: number;
  due: string;
  dia: number;
}

export function nextFu(q: Quote): NextFollowUp | null {
  if (q.estado !== 'enviado' || q.pausa) return null;
  if (!q.enviado) return null;
  const i = q.seg.findIndex((s) => !s.hecho);
  if (i < 0) return null;
  return {
    i,
    due: addDays(q.enviado, q.seg[i].dia),
    dia: q.seg[i].dia,
  };
}

export function getStatusInfo(q: Quote): [string, string] {
  if (q.estado === 'enviado') {
    if (isVencido(q)) return ['vencido', 'Vencido'];
    if (q.pausa) return ['pausa', 'Seguimiento en pausa'];
    return ['enviado', 'Pendiente de respuesta'];
  }
  const labels: Record<string, string> = {
    borrador: 'Borrador',
    aceptado: 'Aceptado',
    rechazado: 'Rechazado',
    cancelado: 'Cancelado',
  };
  return [q.estado, labels[q.estado] || q.estado];
}

export function getDueStatus(due: string): { type: 'late' | 'today' | 'upcoming'; text: string; daysDiff: number } {
  const t = today();
  const d = diffDays(t, due);
  if (d > 0) {
    return {
      type: 'late',
      text: `Retrasado ${d} ${plural(d, 'día', 'días')}`,
      daysDiff: d,
    };
  }
  if (d === 0) {
    return {
      type: 'today',
      text: 'Toca hoy',
      daysDiff: 0,
    };
  }
  return {
    type: 'upcoming',
    text: `Seguimiento el ${fdate(due)}`,
    daysDiff: d,
  };
}
