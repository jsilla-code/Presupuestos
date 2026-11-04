import React from 'react';
import { CreditCard } from 'lucide-react';
import { Quote, Settings } from '../types';
import { fmt, qTotal } from '../utils/calc';
import { diffDays, fdate, getDueStatus, isVencido, nextFu, today } from '../utils/date';
import { fuMsg, waUrl } from '../utils/messages';
import { calcFinancialSummary } from '../utils/payments';
import { Chip } from './Chip';

interface HoyViewProps {
  quotes: Quote[];
  settings: Settings;
  onOpenQuote: (id: string) => void;
  onNewQuote: () => void;
  onCopyText: (text: string, toastMsg: string) => void;
  onFollowUpDone: (quoteId: string, stepIndex: number) => void;
}

export const HoyView: React.FC<HoyViewProps> = ({
  quotes,
  settings,
  onOpenQuote,
  onNewQuote,
  onCopyText,
  onFollowUpDone,
}) => {
  if (!quotes.length) {
    return (
      <div className="empty">
        <h2>Todavía no hay presupuestos</h2>
        <p style={{ margin: '8px 0 14px' }}>
          Crea el primero y la aplicación te dirá cuándo volver a contactar con el cliente.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNewQuote}
        >
          Crear presupuesto
        </button>
      </div>
    );
  }

  const t = today();
  const dueList: Array<{ q: Quote; i: number; due: string; dia: number }> = [];
  const soonList: Array<{ q: Quote; i: number; due: string; dia: number }> = [];
  const vencList: Quote[] = [];
  const endedList: Quote[] = [];
  let pendCount = 0;
  let pendAmt = 0;

  quotes.forEach((q) => {
    if (q.estado !== 'enviado') return;
    pendCount++;
    pendAmt += qTotal(q);

    if (isVencido(q)) {
      vencList.push(q);
      return;
    }

    if (q.pausa) return;

    const n = nextFu(q);
    if (!n) {
      endedList.push(q);
      return;
    }

    const item = { q, i: n.i, due: n.due, dia: n.dia };
    if (n.due <= t) {
      dueList.push(item);
    } else {
      soonList.push(item);
    }
  });

  dueList.sort((a, b) => (a.due < b.due ? -1 : 1));
  soonList.sort((a, b) => (a.due < b.due ? -1 : 1));

  const renderDueText = (due: string) => {
    const d = getDueStatus(due);
    if (d.type === 'late') return <span className="late">{d.text}</span>;
    if (d.type === 'today') return <span className="today">{d.text}</span>;
    return <span>{d.text}</span>;
  };

  const financialSummary = calcFinancialSummary(quotes);

  return (
    <div>
      <div className="strip">
        <div>
          <div className="k">Pendientes de respuesta</div>
          <div className="v num">{pendCount}</div>
          <div className="s num">{fmt(pendAmt)} presupuestados</div>
        </div>
        <div>
          <div className="k">Para contactar hoy</div>
          <div className="v num">{dueList.length}</div>
          <div className="s">
            {dueList.length ? 'Empieza por los retrasados' : 'Sin avisos para hoy'}
          </div>
        </div>
        <div>
          <div className="k">Vencidos</div>
          <div className="v num">{vencList.length}</div>
          <div className="s">
            {vencList.length ? 'Hay que revisarlos' : 'Ninguno'}
          </div>
        </div>
      </div>

      {/* Resumen económico general de presupuestos aceptados */}
      <section
        className="card"
        style={{
          marginTop: '16px',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.02rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CreditCard size={18} color="var(--accent)" />
              <span>Resumen económico</span>
            </h3>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.82rem' }}>
              Cobros y cantidades pendientes de los presupuestos aceptados
            </p>
          </div>

          {financialSummary.countAceptados > 0 && (
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: financialSummary.pendienteCobro === 0 ? 'var(--ok)' : 'var(--accent)',
                background:
                  financialSummary.pendienteCobro === 0
                    ? 'var(--ok-soft)'
                    : 'var(--accent-soft)',
                padding: '2px 10px',
                borderRadius: '99px',
              }}
            >
              {financialSummary.pendienteCobro === 0
                ? '✓ 100 % cobrado'
                : `${financialSummary.porcentajeCobrado} % cobrado`}
            </span>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '10px',
            marginBottom: financialSummary.totalPresupuestado > 0 ? '12px' : 0,
          }}
        >
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '10px 12px',
            }}
          >
            <div className="k" style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: '3px' }}>
              Total presupuestado
            </div>
            <div className="v num" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>
              {fmt(financialSummary.totalPresupuestado)}
            </div>
            <div className="s muted" style={{ fontSize: '0.76rem', marginTop: '2px' }}>
              {financialSummary.countAceptados} {financialSummary.countAceptados === 1 ? 'presupuesto aceptado' : 'presupuestos aceptados'}
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '10px 12px',
            }}
          >
            <div className="k" style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: '3px' }}>
              Total cobrado
            </div>
            <div
              className="v num"
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: financialSummary.totalCobrado > 0 ? 'var(--ok)' : 'var(--ink)',
              }}
            >
              {fmt(financialSummary.totalCobrado)}
            </div>
            <div className="s muted" style={{ fontSize: '0.76rem', marginTop: '2px' }}>
              Pagos efectivamente registrados
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '10px 12px',
            }}
          >
            <div className="k" style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: '3px' }}>
              Pendiente de cobro
            </div>
            <div
              className="v num"
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: financialSummary.pendienteCobro > 0 ? 'var(--pending)' : 'var(--muted)',
              }}
            >
              {fmt(financialSummary.pendienteCobro)}
            </div>
            <div className="s muted" style={{ fontSize: '0.76rem', marginTop: '2px' }}>
              {financialSummary.pendienteCobro > 0
                ? `${financialSummary.countParciales + financialSummary.countPendientes} con saldo pendiente`
                : 'Sin saldo pendiente'}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {financialSummary.totalPresupuestado > 0 && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.76rem',
                color: 'var(--muted)',
                marginBottom: '4px',
              }}
            >
              <span>
                {financialSummary.countCobrados} {financialSummary.countCobrados === 1 ? 'liquidado' : 'liquidados'} · {financialSummary.countParciales} {financialSummary.countParciales === 1 ? 'parcial' : 'parciales'} · {financialSummary.countPendientes} {financialSummary.countPendientes === 1 ? 'pendiente' : 'pendientes'}
              </span>
              <span className="num" style={{ fontWeight: 600 }}>
                {financialSummary.porcentajeCobrado} %
              </span>
            </div>
            <div
              style={{
                height: '6px',
                background: 'var(--surface-2)',
                borderRadius: '99px',
                overflow: 'hidden',
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${financialSummary.porcentajeCobrado}%`,
                  background:
                    financialSummary.pendienteCobro === 0 ? 'var(--ok)' : 'var(--accent)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}
      </section>

      <div className="stack" style={{ marginTop: '22px' }}>
        {/* Contactar hoy */}
        <section>
          <div className="sec-h">
            <h2>Contactar hoy</h2>
            <span className="count">{dueList.length}</span>
          </div>

          {dueList.length > 0 ? (
            <div className="list">
              {dueList.map((o) => {
                const q = o.q;
                const msg = fuMsg(q, o.i, settings);
                return (
                  <div key={q.id + '-' + o.i} className="item">
                    <div style={{ minWidth: 0 }}>
                      <div className="who">{q.cliente}</div>
                      <div className="sub">
                        <span className="mono">{q.num}</span> · {q.titulo}
                      </div>
                      <div className="sub">
                        Recordatorio {o.i + 1} (día {o.dia}) · {renderDueText(o.due)}
                      </div>
                    </div>

                    <div className="side">
                      <span className="amt num">{fmt(qTotal(q))}</span>
                    </div>

                    <div className="acts btnrow">
                      <a
                        className="btn btn-primary sm"
                        href={waUrl(q.telefono, msg)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => onCopyText(msg, 'Mensaje copiado')}
                      >
                        Copiar mensaje
                      </button>
                      <button
                        type="button"
                        className="btn btn-ok sm"
                        onClick={() => onFollowUpDone(q.id, o.i)}
                      >
                        Ya lo he enviado
                      </button>
                      <button
                        type="button"
                        className="btn btn-quiet sm"
                        onClick={() => onOpenQuote(q.id)}
                      >
                        Ya respondió…
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty">
              Nada pendiente hoy.
              {soonList.length > 0 && (
                <> El próximo seguimiento es el {fdate(soonList[0].due)} ({soonList[0].q.cliente}).</>
              )}
            </div>
          )}
        </section>

        {/* Sin respuesta tras el último aviso */}
        {endedList.length > 0 && (
          <section>
            <div className="sec-h">
              <h2>Sin respuesta tras el último aviso</h2>
              <span className="count">{endedList.length}</span>
            </div>
            <div className="list">
              {endedList.map((q) => {
                const d = q.enviado ? diffDays(today(), q.enviado) : 0;
                return (
                  <button
                    key={q.id}
                    type="button"
                    className="item"
                    onClick={() => onOpenQuote(q.id)}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div className="who">{q.cliente}</div>
                      <div className="sub">
                        <span className="mono">{q.num}</span> · {q.titulo}
                      </div>
                      <div className="sub">
                        Enviado hace {d} días · se acabaron los recordatorios, decide si lo das por perdido o llamas
                      </div>
                    </div>
                    <div className="side">
                      <span className="amt num">{fmt(qTotal(q))}</span>
                      <Chip quote={q} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Vencidos */}
        {vencList.length > 0 && (
          <section>
            <div className="sec-h">
              <h2>Vencidos</h2>
              <span className="count">{vencList.length}</span>
            </div>
            <div className="list">
              {vencList.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className="item"
                  onClick={() => onOpenQuote(q.id)}
                >
                  <div style={{ minWidth: 0 }}>
                    <div className="who">{q.cliente}</div>
                    <div className="sub">
                      <span className="mono">{q.num}</span> · {q.titulo}
                    </div>
                    <div className="sub">
                      Venció el {fdate(q.validez)} · no recibe más recordatorios
                    </div>
                  </div>
                  <div className="side">
                    <span className="amt num">{fmt(qTotal(q))}</span>
                    <Chip quote={q} />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Próximos seguimientos */}
        {soonList.length > 0 && (
          <section>
            <div className="sec-h">
              <h2>Próximos seguimientos</h2>
              <span className="count">{soonList.length}</span>
            </div>
            <div className="list">
              {soonList.slice(0, 6).map((o) => {
                const q = o.q;
                return (
                  <div key={q.id + '-' + o.i} className="item">
                    <div style={{ minWidth: 0 }}>
                      <div className="who">{q.cliente}</div>
                      <div className="sub">
                        <span className="mono">{q.num}</span> · {q.titulo}
                      </div>
                      <div className="sub">
                        Recordatorio {o.i + 1} (día {o.dia}) · {renderDueText(o.due)}
                      </div>
                    </div>
                    <div className="side">
                      <span className="amt num">{fmt(qTotal(q))}</span>
                      <button
                        type="button"
                        className="btn btn-quiet sm"
                        onClick={() => onOpenQuote(q.id)}
                      >
                        Abrir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
