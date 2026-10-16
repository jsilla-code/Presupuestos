import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { AppState, Settings, TrialStateInfo } from '../types';
import { IVAS } from '../utils/calc';
import { formatTrialDateTime } from '../utils/trial';

interface AjustesViewProps {
  appState: AppState;
  user: User | null;
  trialState?: TrialStateInfo | null;
  onUpdateSettings: (newSettings: Settings) => void;
  onRestoreBackup: (restoredState: AppState) => void;
  onCopyText: (text: string, toastMsg?: string) => void;
  onShowToast: (msg: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenSubscription?: (reason?: string) => void;
}

export const AjustesView: React.FC<AjustesViewProps> = ({
  appState,
  user,
  trialState,
  onUpdateSettings,
  onRestoreBackup,
  onCopyText,
  onShowToast,
  onOpenAuth,
  onLogout,
  onOpenSubscription,
}) => {
  const settings = appState.settings;

  const [confirmImport, setConfirmImport] = useState(false);
  const [importText, setImportText] = useState('');

  const checkExpired = (): boolean => {
    if (trialState?.isExpired) {
      onOpenSubscription?.('Tu prueba gratuita ha finalizado. Para guardar ajustes o importar datos, activa tu suscripción.');
      return true;
    }
    return false;
  };

  const handleFieldChange = (key: keyof Settings, value: string | number) => {
    if (checkExpired()) return;
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
    onShowToast('Guardado');
  };

  const handleDayChange = (index: number, valStr: string) => {
    if (checkExpired()) return;
    const v = parseInt(valStr, 10);
    if (isNaN(v) || v < 1 || v > 90) {
      onShowToast('Introduce un número de días entre 1 y 90');
      return;
    }
    const nextDays = [...settings.dias];
    nextDays[index] = v;
    nextDays.sort((a, b) => a - b);
    onUpdateSettings({
      ...settings,
      dias: nextDays,
    });
    onShowToast('Guardado');
  };

  const handleRestore = () => {
    if (checkExpired()) return;
    try {
      const parsed = JSON.parse(importText);
      if (!parsed || !Array.isArray(parsed.quotes) || !parsed.settings) {
        throw new Error('Invalid format');
      }
      onRestoreBackup(parsed as AppState);
      setConfirmImport(false);
      setImportText('');
    } catch {
      setConfirmImport(false);
      onShowToast('El texto no es una copia válida');
    }
  };

  return (
    <div>
      <div className="sec-h">
        <h2>Ajustes</h2>
      </div>

      <div className="stack">
        {/* Cuenta y autenticación Firebase */}
        <section className="card">
          <h3>Cuenta y autenticación Firebase</h3>
          {user ? (
            <div className="stack" style={{ gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                  }}
                >
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {user.displayName || 'Usuario registrado'}
                  </div>
                  <div className="sub muted" style={{ fontSize: '0.86rem' }}>
                    {user.email} · Proveedor: {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Correo y contraseña'}
                  </div>
                </div>
              </div>
              <div className="btnrow" style={{ marginTop: '4px' }}>
                <button
                  type="button"
                  className="btn btn-quiet sm"
                  onClick={onLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="hint" style={{ marginBottom: '12px' }}>
                Puedes probar el inicio de sesión o registro tanto con tu cuenta de Google como con correo y contraseña.
              </p>
              <button
                type="button"
                className="btn btn-primary sm"
                onClick={onOpenAuth}
              >
                Iniciar sesión o registrarse
              </button>
            </div>
          )}
        </section>

        {/* Suscripción y prueba gratuita */}
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>Suscripción y prueba gratuita</h3>
            {trialState && (
              trialState.hasSubscription ? (
                <span className="chip chip-aceptado">Plan Profesional</span>
              ) : trialState.isExpired ? (
                <span className="chip chip-rechazado">Prueba finalizada</span>
              ) : trialState.badgeType === 'trial_last_day' ? (
                <span className="chip chip-vencido">Último día</span>
              ) : (
                <span className="chip chip-enviado">Prueba 14 días</span>
              )
            )}
          </div>

          {trialState && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                <span className="muted">Inicio de la prueba:</span>
                <span className="num">{formatTrialDateTime(trialState.trialStartedAt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                <span className="muted">Fin de la prueba:</span>
                <span className="num">{formatTrialDateTime(trialState.trialEndsAt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                <span className="muted">Días restantes:</span>
                <span
                  className="num"
                  style={{
                    fontWeight: 700,
                    color: trialState.isExpired
                      ? 'var(--bad)'
                      : trialState.badgeType === 'trial_ending_soon' || trialState.badgeType === 'trial_last_day'
                      ? 'var(--warn)'
                      : 'var(--ok)',
                  }}
                >
                  {trialState.isExpired ? '0 días (vencida)' : `${trialState.daysRemaining} días`}
                </span>
              </div>
              <div style={{ marginTop: '4px', fontSize: '0.86rem', color: 'var(--muted)' }}>
                {trialState.message}
              </div>
              {onOpenSubscription && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className={trialState.isExpired ? 'btn btn-primary sm' : 'btn sm'}
                    onClick={() => onOpenSubscription()}
                  >
                    {trialState.isExpired
                      ? 'Activar Plan Profesional (12 €/mes)'
                      : 'Ver detalles del Plan Profesional'}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Tu negocio */}
        <section className="card">
          <h3>Tu negocio</h3>
          <div className="grid-fields">
            <div className="f">
              <label htmlFor="s-negocio">Nombre del negocio</label>
              <input
                id="s-negocio"
                value={settings.negocio}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, negocio: e.target.value })
                }
                onBlur={() => onShowToast('Guardado')}
              />
            </div>

            <div className="f">
              <label htmlFor="s-tel">Teléfono de contacto</label>
              <input
                id="s-tel"
                inputMode="tel"
                value={settings.telefono}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, telefono: e.target.value })
                }
                onBlur={() => onShowToast('Guardado')}
              />
            </div>

            <div className="f">
              <label htmlFor="s-iva">IVA por defecto en líneas nuevas</label>
              <select
                id="s-iva"
                value={settings.iva}
                onChange={(e) => handleFieldChange('iva', Number(e.target.value))}
              >
                {IVAS.map((r) => (
                  <option key={r} value={r}>
                    {r} %
                  </option>
                ))}
              </select>
            </div>

            <div className="f full">
              <label htmlFor="s-cond">Condiciones habituales</label>
              <textarea
                id="s-cond"
                rows={3}
                value={settings.condiciones}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, condiciones: e.target.value })
                }
                onBlur={() => onShowToast('Guardado')}
              />
            </div>
          </div>
          <p className="hint" style={{ marginTop: '10px' }}>
            Elige tú el tipo de IVA que corresponde a cada trabajo. La aplicación no comprueba la normativa fiscal.
          </p>
        </section>

        {/* Días de seguimiento */}
        <section className="card">
          <h3>Días de seguimiento</h3>
          <p className="hint" style={{ marginBottom: '10px' }}>
            Días desde el envío hasta cada recordatorio. Se aplican a los presupuestos que envíes a partir de ahora.
          </p>
          <div className="grid-fields">
            {[0, 1, 2].map((i) => (
              <div key={i} className="f">
                <label htmlFor={`s-d${i}`}>Recordatorio {i + 1}</label>
                <input
                  id={`s-d${i}`}
                  inputMode="numeric"
                  defaultValue={settings.dias[i] || 3}
                  key={`${i}-${settings.dias[i]}`}
                  onBlur={(e) => handleDayChange(i, e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Copia de seguridad */}
        <section className="card">
          <h3>Copia de seguridad</h3>
          <p className="hint" style={{ marginBottom: '10px' }}>
            Copia este texto y guárdalo en un lugar seguro. Para restaurar, pégalo abajo.
          </p>
          <div className="f">
            <label htmlFor="bk-out">Tus datos</label>
            <textarea
              id="bk-out"
              rows={4}
              readOnly
              value={JSON.stringify(appState)}
            />
          </div>
          <div className="btnrow" style={{ margin: '8px 0 14px' }}>
            <button
              type="button"
              className="btn"
              onClick={() =>
                onCopyText(JSON.stringify(appState), 'Copia de seguridad copiada')
              }
            >
              Copiar copia de seguridad
            </button>
          </div>

          <div className="f">
            <label htmlFor="bk-in">Restaurar desde una copia</label>
            <textarea
              id="bk-in"
              rows={3}
              placeholder="Pega aquí la copia"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
          </div>
          <div className="btnrow" style={{ marginTop: '8px' }}>
            {confirmImport ? (
              <button
                type="button"
                className="btn btn-bad"
                onClick={handleRestore}
              >
                Confirmar: reemplaza todos los datos actuales
              </button>
            ) : (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  if (!importText.trim()) {
                    onShowToast('Pega primero el texto de la copia');
                    return;
                  }
                  setConfirmImport(true);
                }}
              >
                Restaurar
              </button>
            )}
          </div>
        </section>

        {/* Qué no hace todavía esta versión */}
        <section className="card">
          <h3>Qué no hace todavía esta versión</h3>
          <ul className="todo-list">
            <li>No genera PDF ni un enlace público para que el cliente acepte o rechace.</li>
            <li>No envía correos ni mensajes por sí sola: tú los envías y lo marcas.</li>
            <li>No avisa fuera de la aplicación; hay que abrirla cada día.</li>
            <li>Los datos viven en este navegador hasta que actives la sincronización con Firestore.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
