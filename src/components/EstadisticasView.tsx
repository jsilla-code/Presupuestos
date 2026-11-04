import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Quote, StatsPeriod } from '../types';
import { fmt, qTotal } from '../utils/calc';
import { diffDays, isVencido, today } from '../utils/date';
import { calcFinancialSummary } from '../utils/payments';

interface EstadisticasViewProps {
  quotes: Quote[];
}

export const EstadisticasView: React.FC<EstadisticasViewProps> = ({ quotes }) => {
  const [period, setPeriod] = useState<StatsPeriod>('todo');

  const t = today();
  let from: string | null = null;
  if (period === 'mes') from = t.slice(0, 8) + '01';
  if (period === 'anio') from = t.slice(0, 4) + '-01-01';

  const sent = quotes.filter((q) => q.enviado && (!from || q.enviado >= from));
  const financialSummary = calcFinancialSummary(quotes, { from });

  const A: Quote[] = [];
  const R: Quote[] = [];
  const P: Quote[] = [];
  const V: Quote[] = [];
  const C: Quote[] = [];
  let tot = 0;
  let fu = 0;

  sent.forEach((q) => {
    tot += qTotal(q);
    fu += q.seg.filter((s) => s.hecho).length;
    if (q.estado === 'aceptado') A.push(q);
    else if (q.estado === 'rechazado') R.push(q);
    else if (q.estado === 'cancelado') C.push(q);
    else if (isVencido(q)) V.push(q);
    else P.push(q);
  });

  const sum = (a: Quote[]) => a.reduce((s, q) => s + qTotal(q), 0);
  const decided = A.length + R.length;
  const rate = decided ? Math.round((A.length / decided) * 100) + ' %' : '—';

  const res = A.concat(R).filter((q) => q.resuelto && q.enviado);
  const avg = res.length
    ? (
        res.reduce((s, q) => s + diffDays(q.resuelto!, q.enviado!), 0) / res.length
      )
        .toFixed(1)
        .replace('.', ',') + ' días'
    : '—';

  const pend = P.concat(V);
  const sumA = sum(A);
  const sumPend = sum(pend);
  const sumR = sum(R);
  const totalBar = sumA + sumPend + sumR || 1;

  const w = (v: number) => ((v / totalBar) * 100).toFixed(1) + '%';

  const mot: Record<string, number> = {};
  R.forEach((q) => {
    const m = q.motivo || 'Sin indicar';
    mot[m] = (mot[m] || 0) + 1;
  });

  const perButtons: Array<[StatsPeriod, string]> = [
    ['todo', 'Todo'],
    ['anio', 'Este año'],
    ['mes', 'Este mes'],
  ];

  return (
    <div>
      <div className="sec-h">
        <h2>Estadísticas</h2>
        <div className="filters" style={{ margin: 0 }} role="group" aria-label="Periodo">
          {perButtons.map(([pKey, pLabel]) => (
            <button
              key={pKey}
              type="button"
              className="fchip"
              aria-pressed={period === pKey}
              onClick={() => setPeriod(pKey)}
            >
              {pLabel}
            </button>
          ))}
        </div>
      </div>

      {!sent.length ? (
        <div className="empty">Aún no hay presupuestos enviados en este periodo.</div>
      ) : (
        <div className="stack">
          {/* Segmented bar chart */}
          <section>
            <div className="bar" role="img" aria-label="Reparto del importe presupuestado">
              <i style={{ width: w(sumA), background: 'var(--ok)' }} />
              <i style={{ width: w(sumPend), background: 'var(--pending)' }} />
              <i style={{ width: w(sumR), background: 'var(--bad)' }} />
            </div>

            <div className="legend num">
              <span style={{ ['--c' as string]: 'var(--ok)' }}>Aceptado {fmt(sumA)}</span>
              <span style={{ ['--c' as string]: 'var(--pending)' }}>
                Pendiente o vencido {fmt(sumPend)}
              </span>
              <span style={{ ['--c' as string]: 'var(--bad)' }}>Rechazado {fmt(sumR)}</span>
            </div>

            <p className="hint" style={{ marginTop: '6px' }}>
              Los importes anteriores corresponden a propuestas comerciales. A continuación puedes consultar los cobros reales registrados.
            </p>
          </section>

          {/* Resumen económico del periodo */}
          <section className="card" style={{ background: 'var(--surface)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                }}
              >
                <CreditCard size={17} color="var(--accent)" />
                <span>Cobros y facturación de presupuestos aceptados</span>
              </h3>
              {financialSummary.totalPresupuestado > 0 && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: financialSummary.pendienteCobro === 0 ? 'var(--ok)' : 'var(--accent)',
                    background:
                      financialSummary.pendienteCobro === 0
                        ? 'var(--ok-soft)'
                        : 'var(--accent-soft)',
                    padding: '2px 8px',
                    borderRadius: '99px',
                  }}
                >
                  {financialSummary.porcentajeCobrado} % cobrado
                </span>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '10px',
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
                <div className="k" style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: '2px' }}>
                  Total presupuestado
                </div>
                <div className="v num" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>
                  {fmt(financialSummary.totalPresupuestado)}
                </div>
                <div className="s muted" style={{ fontSize: '0.74rem' }}>
                  {financialSummary.countAceptados} {financialSummary.countAceptados === 1 ? 'aceptado' : 'aceptados'}
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
                <div className="k" style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: '2px' }}>
                  Total cobrado
                </div>
                <div
                  className="v num"
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: financialSummary.totalCobrado > 0 ? 'var(--ok)' : 'var(--ink)',
                  }}
                >
                  {fmt(financialSummary.totalCobrado)}
                </div>
                <div className="s muted" style={{ fontSize: '0.74rem' }}>
                  Pagos registrados
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
                <div className="k" style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: '2px' }}>
                  Pendiente de cobro
                </div>
                <div
                  className="v num"
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: financialSummary.pendienteCobro > 0 ? 'var(--pending)' : 'var(--muted)',
                  }}
                >
                  {fmt(financialSummary.pendienteCobro)}
                </div>
                <div className="s muted" style={{ fontSize: '0.74rem' }}>
                  {financialSummary.countParciales + financialSummary.countPendientes} con saldo
                </div>
              </div>
            </div>
          </section>

          {/* Key Metrics */}
          <div className="kv">
            <div>
              <span>Presupuestos enviados</span>
              <span className="num">{sent.length}</span>
            </div>
            <div>
              <span>Importe enviado</span>
              <span className="num">{fmt(tot)}</span>
            </div>
            <div>
              <span>Aceptados</span>
              <span className="num">{A.length}</span>
            </div>
            <div>
              <span>Rechazados</span>
              <span className="num">{R.length}</span>
            </div>
            <div>
              <span>Pendientes</span>
              <span className="num">{P.length}</span>
            </div>
            <div>
              <span>Vencidos</span>
              <span className="num">{V.length}</span>
            </div>
            <div>
              <span>Tasa de aceptación</span>
              <span className="num">{rate}</span>
            </div>
            <div>
              <span>Tiempo medio hasta respuesta</span>
              <span className="num">{avg}</span>
            </div>
            <div>
              <span>Recordatorios enviados</span>
              <span className="num">{fu}</span>
            </div>
            <div>
              <span>Cancelados</span>
              <span className="num">{C.length}</span>
            </div>
          </div>

          <p className="hint">
            Tasa de aceptación = aceptados ÷ (aceptados + rechazados). Los pendientes y vencidos no cuentan hasta que haya respuesta.
          </p>

          {/* Reasons for rejection */}
          {R.length > 0 && (
            <section>
              <div className="sec-h">
                <h3>Por qué rechazan</h3>
              </div>
              <div className="kv">
                {Object.keys(mot).map((m) => (
                  <div key={m}>
                    <span>{m}</span>
                    <span className="num">{mot[m]}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
