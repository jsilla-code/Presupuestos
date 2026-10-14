import React from 'react';
import { TabView } from '../types';

interface HeaderProps {
  currentTab: TabView;
  dueCount: number;
  onSelectTab: (tab: TabView) => void;
  onNewQuote: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  dueCount,
  onSelectTab,
  onNewQuote,
}) => {
  const activeTab = currentTab === 'det' || currentTab === 'edit' ? 'lista' : currentTab;

  return (
    <>
      <header className="top">
        <div className="brand cursor-pointer" onClick={() => onSelectTab('hoy')}>
          Presu<span>Follow</span>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNewQuote}
        >
          Nuevo presupuesto
        </button>
      </header>

      <nav className="tabs" aria-label="Secciones">
        <button
          type="button"
          className="tab"
          aria-current={activeTab === 'hoy' ? 'page' : undefined}
          onClick={() => onSelectTab('hoy')}
        >
          Hoy
          {dueCount > 0 && <span className="badge">{dueCount}</span>}
        </button>

        <button
          type="button"
          className="tab"
          aria-current={activeTab === 'lista' ? 'page' : undefined}
          onClick={() => onSelectTab('lista')}
        >
          Presupuestos
        </button>

        <button
          type="button"
          className="tab"
          aria-current={activeTab === 'stats' ? 'page' : undefined}
          onClick={() => onSelectTab('stats')}
        >
          Estadísticas
        </button>

        <button
          type="button"
          className="tab"
          aria-current={activeTab === 'ajustes' ? 'page' : undefined}
          onClick={() => onSelectTab('ajustes')}
        >
          Ajustes
        </button>
      </nav>
    </>
  );
};
