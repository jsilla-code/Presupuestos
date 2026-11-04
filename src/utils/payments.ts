import { Payment, PaymentMethod, PaymentStatus, Quote } from '../types';
import { qTotal, rnd } from './calc';

export interface PaymentInfo {
  total: number; // in cents
  cobrado: number; // in cents
  pendiente: number; // in cents
  porcentaje: number; // 0 to 100
  status: PaymentStatus;
  statusLabel: string;
  isOverpaid: boolean;
  paymentsCount: number;
}

export const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string }> = [
  { id: 'transferencia', label: 'Transferencia bancaria' },
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'tarjeta', label: 'Tarjeta' },
  { id: 'bizum', label: 'Bizum' },
  { id: 'otro', label: 'Otro' },
];

export function getPaymentMethodLabel(method?: PaymentMethod): string {
  if (!method) return 'Sin especificar';
  const match = PAYMENT_METHODS.find((m) => m.id === method);
  return match ? match.label : 'Otro';
}

/**
 * Calculates payment information dynamically from stored quote data.
 * All amounts are in integer cents to avoid floating-point drift.
 */
export function calcPaymentInfo(quote: Quote): PaymentInfo {
  const total = qTotal(quote);
  const pagos = Array.isArray(quote.pagos) ? quote.pagos : [];
  const cobrado = pagos.reduce((sum, p) => sum + (typeof p.cantidad === 'number' ? p.cantidad : 0), 0);
  const pendiente = Math.max(0, total - cobrado);
  const isOverpaid = total > 0 && cobrado > total;

  let status: PaymentStatus = 'pendiente';
  let statusLabel = 'Pendiente de cobro';

  if (total > 0 && cobrado >= total) {
    status = 'cobrado';
    statusLabel = 'Cobrado';
  } else if (cobrado > 0) {
    status = 'parcial';
    statusLabel = 'Parcialmente cobrado';
  }

  let porcentaje = 0;
  if (total > 0) {
    porcentaje = Math.min(100, Math.max(0, Math.round((cobrado / total) * 100)));
  } else if (cobrado > 0) {
    porcentaje = 100;
  }

  return {
    total,
    cobrado,
    pendiente,
    porcentaje,
    status,
    statusLabel,
    isOverpaid,
    paymentsCount: pagos.length,
  };
}

export interface FinancialSummary {
  totalPresupuestado: number; // in cents, sum of accepted quotes
  totalCobrado: number; // in cents, sum of payments of accepted quotes
  pendienteCobro: number; // in cents, totalPresupuestado - totalCobrado
  porcentajeCobrado: number; // 0 to 100
  countAceptados: number;
  countCobrados: number;
  countParciales: number;
  countPendientes: number;
}

/**
 * Computes general economic summary of accepted quotes.
 * Excludes rejected, draft, sent, or cancelled quotes from confirmed income metrics.
 */
export function calcFinancialSummary(
  quotes: Quote[],
  periodFilter?: { from?: string | null }
): FinancialSummary {
  const fromDate = periodFilter?.from || null;

  // Filter accepted quotes respecting temporal filter when present
  const acceptedQuotes = quotes.filter((q) => {
    if (q.estado !== 'aceptado') return false;
    if (!fromDate) return true;
    const refDate = q.resuelto || q.enviado || q.emision;
    return refDate >= fromDate;
  });

  let totalPresupuestado = 0;
  let totalCobrado = 0;
  let countCobrados = 0;
  let countParciales = 0;
  let countPendientes = 0;

  acceptedQuotes.forEach((q) => {
    const info = calcPaymentInfo(q);
    totalPresupuestado += info.total;
    totalCobrado += info.cobrado;

    if (info.status === 'cobrado') countCobrados++;
    else if (info.status === 'parcial') countParciales++;
    else countPendientes++;
  });

  const pendienteCobro = Math.max(0, totalPresupuestado - totalCobrado);
  const porcentajeCobrado =
    totalPresupuestado > 0
      ? Math.min(100, Math.max(0, Math.round((totalCobrado / totalPresupuestado) * 100)))
      : 0;

  return {
    totalPresupuestado,
    totalCobrado,
    pendienteCobro,
    porcentajeCobrado,
    countAceptados: acceptedQuotes.length,
    countCobrados,
    countParciales,
    countPendientes,
  };
}

/**
 * Parses user input in euros (e.g. "400", "400,50", "400.5") into integer cents (40050).
 */
export function parseEurosToCents(val: string | number): number {
  if (typeof val === 'number') {
    return rnd(val * 100);
  }
  const clean = String(val || '')
    .trim()
    .replace(/\s+/g, '')
    .replace('€', '')
    .replace(',', '.');
  const n = parseFloat(clean);
  if (!isFinite(n) || n <= 0) return 0;
  return rnd(n * 100);
}

/**
 * Formats cents (e.g. 40050) into standard editable text in Euros (e.g. "400,50").
 */
export function formatCentsToInput(cents: number): string {
  if (!cents || isNaN(cents)) return '';
  const euros = (cents / 100).toFixed(2);
  return euros.replace('.', ',');
}

export function paymentUid(): string {
  return 'pay_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
