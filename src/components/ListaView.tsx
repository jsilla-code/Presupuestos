import React from 'react';
import { ListFilter, Quote } from '../types';
import { fmt, qTotal } from '../utils/calc';
import { fdate, getDueStatus, getStatusInfo, isVencido, nextFu } from '../utils/date';
import { Chip } from './Chip';

interface ListaViewProps {
  quotes: Quote[];
  currentFilter: ListFilter;
  searchQuery: string;
  onSelectFilter: (filter: ListFilter) => void;
  onSearchChange: (query: string) => void;
  onOpenQuote: (id: string) => void;
}

export const ListaView: React.FC<ListaViewProps> = ({
  quotes,
  currentFilter,
  searchQuery,
  onSelectFilter,
  onSearchChange,
  onOpenQuote,
}) => {
  const cnt = {
    todos: quotes.length,
    pendientes: 0,
    vencidos: 0,
    aceptados: 0,
    rechazados: 0,
    borradores: 0,
  };

  quotes.forEach((q) => {
    const [k] = getStatusInfo(q);
    if (k === 'enviado' || k === 'pausa') cnt.pendientes++;
    if (k === 'vencido') cnt.vencidos++;
    if (k === 'aceptado') cnt.aceptados++;
    if (k === 'rechazado') cnt.rechazados++;
    if (k === 'borrador') cnt.borradores++;
  });

  const filterButtons: Array<[ListFilter, string]> = [
    ['todos', 'Todos'],
    ['pendientes', 'Pendientes'],
    ['vencidos', 'Vencidos'],
    ['aceptados', 'Aceptados'],
    ['rechazados', 'Rechazados'],
    ['borradores', 'Borradores'],
  ];

  const qTrim = searchQuery.trim().toLowerCase();
  const rows = quotes.filter((x) => {
    const [k] = getStatusInfo(x);
    let okF = false;

    if (currentFilter === 'todos') okF = true;
    else if (currentFilter === 'pendientes') okF = k === 'enviado' || k === 'pausa';
    else if (currentFilter === 'borradores') okF = k === 'borrador';
    else if (currentFilter === 'aceptados') okF = k === 'aceptado';
    else if (currentFilter === 'rechazados') okF = k === 'rechazado';
    else if (currentFilter === 'vencidos') okF = k === 'vencido';

    const okQ =
      !qTrim ||
      x.num.toLowerCase().includes(qTrim) ||
      x.cliente.toLowerCase().includes(qTrim) ||
      x.titulo.toLowerCase().includes(qTrim);

    return okF && okQ;
  });

  const renderDueText = (due: string) => {
    const d = getDueStatus(due);
    if (d.type === 'late') return <span className="late">{d.text}</span>;
    if (d.type === 'today') return <span className="today">{d.text}</span>;
    return <span>{d.text}</span>;
  };

  return (
    <div>
      <div className="sec-h">
        <h2>Presupuestos</h2>
      </div>

      <div className="filters" role="group" aria-label="Filtrar por estado">
        {filterButtons.map(([fKey, fLabel]) => (
          <button
            key={fKey}
            type="button"
            className="fchip"
            aria-pressed={currentFilter === fKey}
            onClick={() => onSelectFilter(fKey)}
          >
            {fLabel} {cnt[fKey]}
          </button>
        ))}
      </div>

      <div className="f" style={{ marginBottom: '12px' }}>
        <label className="sr" htmlFor="q-search">
          Buscar
        </label>
        <input
          id="q-search"
          className="search"
          type="search"
          placeholder="Buscar por número, cliente o trabajo"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div id="qlist">
        {rows.length === 0 ? (
          <div className="empty">No hay presupuestos con este filtro.</div>
        ) : (
          <div className="list">
            {rows.map((x) => {
              const n = nextFu(x);
              const extraNode =
                n && !isVencido(x) ? (
                  renderDueText(n.due)
                ) : (
                  <span>
                    {x.enviado
                      ? `Enviado el ${fdate(x.enviado)}`
                      : `Creado el ${fdate(x.emision)}`}
                  </span>
                );

              return (
                <button
                  key={x.id}
                  type="button"
                  className="item"
                  onClick={() => onOpenQuote(x.id)}
                >
                  <div style={{ minWidth: 0 }}>
                    <div className="who">{x.cliente}</div>
                    <div className="sub">
                      <span className="mono">{x.num}</span> · {x.titulo}
                    </div>
                    <div className="sub">{extraNode}</div>
                  </div>
                  <div className="side">
                    <span className="amt num">{fmt(qTotal(x))}</span>
                    <Chip quote={x} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
