import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, Pencil, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Payment, Quote, Settings } from '../types';
import { MOTIVOS, calc, fmt, lineTotal, num, rnd } from '../utils/calc';
import { addDays, fdate, getDueStatus, isVencido, nextFu, today } from '../utils/date';
import {
  fuMsg,
  fuSubject,
  initMsg,
  initSubject,
  mailUrl,
  neg,
  waUrl,
} from '../utils/messages';
import { calcPaymentInfo, getPaymentMethodLabel } from '../utils/payments';
import { Chip } from './Chip';
import { PaymentModal } from './PaymentModal';

interface DetalleViewProps {
  quote: Quote;
  settings: Settings;
  onBack: () => void;
  onEditDraft: (quote: Quote) => void;
  onDuplicate: (quote: Quote) => void;
  onDeleteDraft: (quoteId: string) => void;
  onCancelQuote: (quoteId: string) => void;
  onPauseResume: (quoteId: string, pause: boolean) => void;
  onResolve: (quoteId: string, status: 'aceptado' | 'rechazado', motivo?: string, nota?: string) => void;
  onMarkSent: (quoteId: string) => void;
  onFollowUpDone: (quoteId: string, stepIndex: number) => void;
  onCopyText: (text: string, toastMsg?: string) => void;
  onAddPayment: (quoteId: string, paymentData: Omit<Payment, 'id'>) => Promise<boolean | void>;
  onEditPayment: (quoteId: string, paymentId: string, paymentData: Omit<Payment, 'id'>) => Promise<boolean | void>;
  onDeletePayment: (quoteId: string, paymentId: string) => Promise<boolean | void>;
}

export const DetalleView: React.FC<DetalleViewProps> = ({
  quote,
  settings,
  onBack,
  onEditDraft,
  onDuplicate,
  onDeleteDraft,
  onCancelQuote,
  onPauseResume,
  onResolve,
  onMarkSent,
  onFollowUpDone,
  onCopyText,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
}) => {
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'del' | null>(null);
  const [resolvingState, setResolvingState] = useState<'aceptado' | 'rechazado' | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolveMotivo, setResolveMotivo] = useState(MOTIVOS[0]);

  // Payment management state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [confirmDeletePaymentId, setConfirmDeletePaymentId] = useState<string | null>(null);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);

  // Message panel state
  const n = nextFu(quote);
  const defaultMsg =
    quote.estado === 'borrador'
      ? initMsg(quote, settings)
      : n
      ? fuMsg(quote, n.i, settings)
      : '';

  const [customMsg, setCustomMsg] = useState(defaultMsg);

  useEffect(() => {
    setCustomMsg(defaultMsg);
  }, [quote.id, quote.estado, n?.i]);

  const c = calc(quote.lineas);
  const payInfo = calcPaymentInfo(quote);
  const vencido = isVencido(quote);

  const getSubj = () => {
    if (quote.estado === 'borrador') return initSubject(quote, settings);
    if (n) return fuSubject(quote, n.i);
    return '';
  };

  const getMsgTitle = () => {
    if (quote.estado === 'borrador') return 'Enviar el presupuesto';
    if (n) {
      const d = getDueStatus(n.due);
      return `Recordatorio ${n.i + 1} · ${d.text}`;
    }
    return '';
  };

  const renderDueText = (due: string) => {
    const d = getDueStatus(due);
    if (d.type === 'late') return <span className="late">{d.text}</span>;
    if (d.type === 'today') return <span className="today">{d.text}</span>;
    return <span>{d.text}</span>;
  };

  return (
    <div>
      <div className="back">
        <button
          type="button"
          className="btn btn-quiet sm"
          onClick={onBack}
        >
          ← Presupuestos
        </button>
      </div>

      <div className="detail">
        {/* Document view (Paper) */}
        <div style={{ minWidth: 0 }}>
          <article className="paper">
            <div className="head">
              <div>
                <div className="biz">{neg(settings) || 'Tu negocio'}</div>
                {settings.telefono && (
                  <div className="sub muted">{settings.telefono}</div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono font-semibold">{quote.num}</div>
                <div className="sub muted">Emitido el {fdate(quote.emision)}</div>
                <div className="sub muted">Válido hasta el {fdate(quote.validez)}</div>
              </div>
            </div>

            <p className="lab">Para</p>
            <p style={{ fontWeight: 600 }}>{quote.cliente}</p>
            <p className="muted" style={{ fontSize: '0.88rem' }}>
              {[quote.telefono, quote.email].filter(Boolean).join(' · ')}
            </p>

            <h3 style={{ margin: '14px 0 8px' }}>{quote.titulo}</h3>

            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th className="r">Cant.</th>
                    <th className="r">Precio</th>
                    <th className="r">Dto.</th>
                    <th className="r">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.lineas.map((l, idx) => (
                    <tr key={idx}>
                      <td>{l.desc}</td>
                      <td className="r">{l.qty}</td>
                      <td className="r">{fmt(rnd(num(l.price) * 100))}</td>
                      <td className="r">{num(l.disc) ? `${num(l.disc)} %` : '—'}</td>
                      <td className="r">{fmt(lineTotal(l))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="totals">
              <div>
                <span>Base imponible</span>
                <span>{fmt(c.base)}</span>
              </div>
              {c.ivas.map((x) => (
                <div key={x.rate}>
                  <span>IVA {x.rate} %</span>
                  <span>{fmt(x.cuota)}</span>
                </div>
              ))}
              <div className="grand">
                <span>Total</span>
                <span>{fmt(c.total)}</span>
              </div>
            </div>

            {quote.condiciones && (
              <p className="hint" style={{ marginTop: '14px', whiteSpace: 'pre-wrap' }}>
                {quote.condiciones}
              </p>
            )}
          </article>

          {quote.notas && (
            <p className="hint" style={{ marginTop: '10px' }}>
              <strong>Nota interna:</strong> {quote.notas}
            </p>
          )}
        </div>

        {/* Side Panel: Actions, Timeline, Messages, History */}
        <div className="stack" style={{ gap: '14px', minWidth: 0 }}>
          <section className="panel">
            <div className="btnrow" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Estado</span>
              <Chip quote={quote} />
            </div>

            {quote.estado === 'enviado' && (
              <>
                <p className="hint">
                  Enviado el {fdate(quote.enviado)}.
                  {vencido && ` Venció el ${fdate(quote.validez)} y no recibirá más recordatorios.`}
                </p>
                <ul className="steps">
                  {quote.seg.map((s, i) => (
                    <li key={i}>
                      <span>
                        Recordatorio {i + 1} · día {s.dia}
                      </span>
                      <span>
                        {s.hecho ? (
                          <>
                            <strong>Enviado</strong> el {fdate(s.hecho)}
                          </>
                        ) : quote.enviado ? (
                          fdate(addDays(quote.enviado, s.dia))
                        ) : (
                          '—'
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {(quote.estado === 'aceptado' || quote.estado === 'rechazado') && (
              <p className="hint">
                {quote.estado === 'aceptado' ? 'Aceptado' : 'Rechazado'} el {fdate(quote.resuelto)}
                {quote.motivo && `. Motivo: ${quote.motivo}`}
                {quote.nota && `. ${quote.nota}`}.
              </p>
            )}

            {/* Action Buttons */}
            <div className="btnrow">
              {quote.estado === 'enviado' && (
                <>
                  <button
                    type="button"
                    className="btn btn-ok sm"
                    onClick={() => {
                      setResolvingState('aceptado');
                      setConfirmAction(null);
                    }}
                  >
                    El cliente aceptó
                  </button>
                  <button
                    type="button"
                    className="btn btn-bad sm"
                    onClick={() => {
                      setResolvingState('rechazado');
                      setConfirmAction(null);
                    }}
                  >
                    El cliente rechazó
                  </button>
                  {quote.pausa ? (
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => onPauseResume(quote.id, false)}
                    >
                      Reanudar seguimientos
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => onPauseResume(quote.id, true)}
                    >
                      Pausar seguimientos
                    </button>
                  )}
                </>
              )}

              {quote.estado === 'borrador' && (
                <button
                  type="button"
                  className="btn sm"
                  onClick={() => onEditDraft(quote)}
                >
                  Editar
                </button>
              )}

              <button
                type="button"
                className="btn sm"
                onClick={() => onDuplicate(quote)}
              >
                Duplicar
              </button>

              {(quote.estado === 'enviado' || quote.estado === 'borrador') && (
                confirmAction === 'cancel' ? (
                  <button
                    type="button"
                    className="btn btn-bad sm"
                    onClick={() => onCancelQuote(quote.id)}
                  >
                    Confirmar cancelación
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-quiet sm"
                    onClick={() => {
                      setConfirmAction('cancel');
                      setResolvingState(null);
                    }}
                  >
                    Cancelar presupuesto
                  </button>
                )
              )}

              {quote.estado === 'borrador' && (
                confirmAction === 'del' ? (
                  <button
                    type="button"
                    className="btn btn-bad sm"
                    onClick={() => onDeleteDraft(quote.id)}
                  >
                    Confirmar eliminar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-quiet sm"
                    onClick={() => {
                      setConfirmAction('del');
                      setResolvingState(null);
                    }}
                  >
                    Eliminar
                  </button>
                )
              )}
            </div>

            {/* Resolution confirmation boxes */}
            {resolvingState === 'aceptado' && (
              <div className="stack" style={{ gap: '8px', marginTop: '6px' }}>
                <div className="f">
                  <label htmlFor="res-nota">Nota (opcional)</label>
                  <input
                    id="res-nota"
                    placeholder="Ej.: empezamos el día 3"
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-ok"
                  onClick={() => {
                    onResolve(quote.id, 'aceptado', undefined, resolveNote);
                    setResolvingState(null);
                  }}
                >
                  Confirmar aceptación
                </button>
              </div>
            )}

            {resolvingState === 'rechazado' && (
              <div className="stack" style={{ gap: '8px', marginTop: '6px' }}>
                <div className="f">
                  <label htmlFor="res-motivo">Motivo</label>
                  <select
                    id="res-motivo"
                    value={resolveMotivo}
                    onChange={(e) => setResolveMotivo(e.target.value)}
                  >
                    {MOTIVOS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="f">
                  <label htmlFor="res-nota">Nota (opcional)</label>
                  <input
                    id="res-nota"
                    placeholder="Nota sobre el rechazo"
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-bad"
                  onClick={() => {
                    onResolve(quote.id, 'rechazado', resolveMotivo, resolveNote);
                    setResolvingState(null);
                  }}
                >
                  Confirmar rechazo
                </button>
              </div>
            )}

            {quote.estado === 'enviado' && vencido && (
              <p className="hint">
                Para reactivarlo, duplícalo como nueva versión con fechas actualizadas y envíalo de nuevo.
              </p>
            )}
          </section>

          {/* Estado de cobro y pagos */}
          <section
            className="panel"
            style={{
              borderColor:
                payInfo.status === 'cobrado'
                  ? 'rgba(22, 101, 52, 0.4)'
                  : payInfo.status === 'parcial'
                  ? 'rgba(14, 165, 233, 0.35)'
                  : undefined,
            }}
          >
            <div
              className="btnrow"
              style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                }}
              >
                <CreditCard size={18} color="var(--accent)" />
                <span>Estado de cobro</span>
              </h3>
              <span
                className={`chip chip-${
                  payInfo.status === 'cobrado'
                    ? 'cobrado'
                    : payInfo.status === 'parcial'
                    ? 'parcial'
                    : 'pendiente-cobro'
                }`}
              >
                {payInfo.statusLabel}
              </span>
            </div>

            {/* Financial Amounts Trio */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '10px',
                textAlign: 'center',
                marginBottom: '10px',
              }}
            >
              <div>
                <div className="muted" style={{ fontSize: '0.74rem', marginBottom: '2px' }}>
                  Importe total
                </div>
                <div className="num" style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                  {fmt(payInfo.total)}
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: '0.74rem', marginBottom: '2px' }}>
                  Importe cobrado
                </div>
                <div
                  className="num"
                  style={{
                    fontWeight: 700,
                    fontSize: '0.98rem',
                    color: payInfo.cobrado > 0 ? 'var(--ok)' : 'var(--ink)',
                  }}
                >
                  {fmt(payInfo.cobrado)}
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: '0.74rem', marginBottom: '2px' }}>
                  Pendiente de cobro
                </div>
                <div
                  className="num"
                  style={{
                    fontWeight: 700,
                    fontSize: '0.98rem',
                    color: payInfo.pendiente > 0 ? 'var(--pending)' : 'var(--muted)',
                  }}
                >
                  {fmt(payInfo.pendiente)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  fontSize: '0.78rem',
                  color: 'var(--muted)',
                  marginBottom: '4px',
                }}
              >
                <span>Progreso de cobro</span>
                <span className="num" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                  {payInfo.porcentaje} %
                </span>
              </div>
              <div
                style={{
                  height: '7px',
                  background: 'var(--surface-2)',
                  borderRadius: '99px',
                  overflow: 'hidden',
                  border: '1px solid var(--line)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${payInfo.porcentaje}%`,
                    background:
                      payInfo.status === 'cobrado'
                        ? 'var(--ok)'
                        : 'var(--accent)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Warning if overpaid */}
            {payInfo.isOverpaid && (
              <div
                style={{
                  background: 'var(--warn-soft)',
                  color: 'var(--warn)',
                  border: '1px solid rgba(180, 83, 9, 0.3)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Atención:</strong> El importe total actual ({fmt(payInfo.total)}) es inferior a los pagos ya registrados ({fmt(payInfo.cobrado)}). Revisa las líneas o los pagos para evitar inconsistencias.
                </span>
              </div>
            )}

            {/* Action button */}
            {payInfo.status === 'cobrado' ? (
              <div
                style={{
                  background: 'var(--ok-soft)',
                  color: 'var(--ok)',
                  border: '1px solid rgba(22, 101, 52, 0.25)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Presupuesto totalmente cobrado (100 %)</span>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary sm"
                style={{
                  width: '100%',
                  marginBottom: '16px',
                  padding: '9px 12px',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
                onClick={() => {
                  setPaymentToEdit(null);
                  setIsPaymentModalOpen(true);
                }}
              >
                <Plus size={16} />
                <span>Registrar pago</span>
              </button>
            )}

            {/* Historial de pagos */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '8px',
                }}
              >
                <h4 style={{ margin: 0, fontSize: '0.94rem', color: 'var(--ink)' }}>
                  Historial de pagos ({payInfo.paymentsCount})
                </h4>
                {payInfo.status === 'cobrado' && (
                  <button
                    type="button"
                    className="btn btn-quiet sm"
                    style={{ fontSize: '0.78rem', padding: '1px 6px' }}
                    onClick={() => {
                      setPaymentToEdit(null);
                      setIsPaymentModalOpen(true);
                    }}
                    title="Añadir ajuste o pago adicional"
                  >
                    + Añadir otro pago
                  </button>
                )}
              </div>

              {(!quote.pagos || quote.pagos.length === 0) ? (
                <p className="hint" style={{ margin: 0, fontSize: '0.86rem' }}>
                  Todavía no se ha registrado ningún pago para este presupuesto. Pulsa «Registrar pago» cuando recibas un anticipo o liquidación.
                </p>
              ) : (
                <div className="stack" style={{ gap: '8px' }}>
                  {quote.pagos.map((p) => {
                    const isConfirmingDelete = confirmDeletePaymentId === p.id;
                    return (
                      <div
                        key={p.id}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--line)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="num" style={{ fontWeight: 700, fontSize: '0.96rem' }}>
                              {fmt(p.cantidad)}
                            </span>
                            {p.metodo && (
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: 'var(--surface-2)',
                                  color: 'var(--muted)',
                                  border: '1px solid var(--line)',
                                }}
                              >
                                {getPaymentMethodLabel(p.metodo)}
                              </span>
                            )}
                          </div>
                          <span className="muted" style={{ fontSize: '0.8rem' }}>
                            {fdate(p.fecha)}
                          </span>
                        </div>

                        {p.notas && (
                          <p
                            className="hint"
                            style={{ margin: 0, fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}
                          >
                            {p.notas}
                          </p>
                        )}

                        {/* Payment action buttons */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '6px',
                            marginTop: '2px',
                          }}
                        >
                          {isConfirmingDelete ? (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'var(--bad-soft)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  color: 'var(--bad)',
                                  fontWeight: 600,
                                }}
                              >
                                ¿Eliminar pago?
                              </span>
                              <button
                                type="button"
                                className="btn btn-bad sm"
                                disabled={isDeletingPayment}
                                style={{ padding: '2px 8px', fontSize: '0.78rem' }}
                                onClick={async () => {
                                  setIsDeletingPayment(true);
                                  try {
                                    await onDeletePayment(quote.id, p.id);
                                    setConfirmDeletePaymentId(null);
                                  } finally {
                                    setIsDeletingPayment(false);
                                  }
                                }}
                              >
                                {isDeletingPayment ? '...' : 'Sí, eliminar'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-quiet sm"
                                disabled={isDeletingPayment}
                                style={{ padding: '2px 6px', fontSize: '0.78rem' }}
                                onClick={() => setConfirmDeletePaymentId(null)}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn-quiet sm"
                                style={{ padding: '2px 6px', fontSize: '0.78rem' }}
                                onClick={() => {
                                  setPaymentToEdit(p);
                                  setIsPaymentModalOpen(true);
                                }}
                                title="Editar importe, fecha u observaciones"
                              >
                                <Pencil size={13} style={{ marginRight: '3px' }} />
                                Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn-quiet sm"
                                style={{
                                  padding: '2px 6px',
                                  fontSize: '0.78rem',
                                  color: 'var(--bad)',
                                }}
                                onClick={() => setConfirmDeletePaymentId(p.id)}
                                title="Eliminar pago registrado"
                              >
                                <Trash2 size={13} style={{ marginRight: '3px' }} />
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Message Panel for sending or follow-up */}
          {(quote.estado === 'borrador' || n) && (
            <section className="panel">
              <h3>{getMsgTitle()}</h3>
              <p className="hint">
                Revisa el mensaje, ábrelo en WhatsApp o cópialo, y pulsa el botón verde cuando lo hayas enviado. Esta versión no envía nada por sí sola.
              </p>

              <div className="f">
                <label htmlFor="msgtxt">Mensaje</label>
                <textarea
                  id="msgtxt"
                  rows={11}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                />
              </div>

              <div className="btnrow">
                <a
                  id="wa"
                  className="btn btn-primary"
                  href={waUrl(quote.telefono, customMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir WhatsApp
                </a>
                <button
                  type="button"
                  className="btn"
                  onClick={() => onCopyText(customMsg, 'Mensaje copiado')}
                >
                  Copiar mensaje
                </button>
                {quote.email && (
                  <>
                    <a
                      id="mail"
                      className="btn btn-quiet"
                      href={mailUrl(quote, getSubj(), customMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Correo
                    </a>
                    <button
                      type="button"
                      className="btn btn-quiet"
                      onClick={() => onCopyText(getSubj(), 'Asunto copiado')}
                    >
                      Copiar asunto
                    </button>
                  </>
                )}
              </div>

              <div>
                {quote.estado === 'borrador' ? (
                  <button
                    type="button"
                    className="btn btn-ok"
                    onClick={() => onMarkSent(quote.id)}
                  >
                    Ya lo he enviado
                  </button>
                ) : n ? (
                  <button
                    type="button"
                    className="btn btn-ok"
                    onClick={() => onFollowUpDone(quote.id, n.i)}
                  >
                    Ya he enviado el recordatorio {n.i + 1}
                  </button>
                ) : null}
              </div>
            </section>
          )}

          {/* Historial */}
          <section className="panel">
            <h3>Historial</h3>
            <ul className="hist">
              {quote.hist
                .slice()
                .reverse()
                .map((h, i) => (
                  <li key={i}>
                    <time>{fdate(h.f)}</time>
                    <span>{h.t}</span>
                  </li>
                ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Modal para registrar o editar pagos */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentToEdit(null);
        }}
        quote={quote}
        paymentToEdit={paymentToEdit}
        onSavePayment={async (paymentData, paymentId) => {
          if (paymentId) {
            return await onEditPayment(quote.id, paymentId, paymentData);
          } else {
            return await onAddPayment(quote.id, paymentData);
          }
        }}
      />
    </div>
  );
};
