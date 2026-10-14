import React from 'react';
import { User } from 'firebase/auth';
import { TabView } from '../types';

interface HeaderProps {
  currentTab: TabView;
  dueCount: number;
  user: User | null;
  onSelectTab: (tab: TabView) => void;
  onNewQuote: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  dueCount,
  user,
  onSelectTab,
  onNewQuote,
  onOpenAuth,
  onLogout,
}) => {
  const activeTab = currentTab === 'det' || currentTab === 'edit' ? 'lista' : currentTab;

  const getUserDisplay = () => {
    if (!user) return '';
    return user.displayName || user.email?.split('@')[0] || 'Usuario';
  };

  return (
    <>
      <header className="top">
        <div className="brand cursor-pointer" onClick={() => onSelectTab('hoy')}>
          Presu<span>Follow</span>
        </div>

        <div className="btnrow" style={{ alignItems: 'center' }}>
          {user ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.85rem',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                }}
              >
                {getUserDisplay().charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight: 600, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getUserDisplay()}
              </span>
              <button
                type="button"
                className="btn btn-quiet sm"
                style={{ padding: '2px 4px', fontSize: '0.8rem' }}
                onClick={onLogout}
                title="Cerrar sesión"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn sm"
              onClick={onOpenAuth}
            >
              Iniciar sesión
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={onNewQuote}
          >
            Nuevo presupuesto
          </button>
        </div>
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
