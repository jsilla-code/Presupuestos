import React, { useEffect, useState } from 'react';
import { Quote, Settings } from '../types';
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
import { Chip } from './Chip';

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
}) => {
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'del' | null>(null);
  const [resolvingState, setResolvingState] = useState<'aceptado' | 'rechazado' | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolveMotivo, setResolveMotivo] = useState(MOTIVOS[0]);

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
    </div>
  );
};
