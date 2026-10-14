import React, { useState } from 'react';
import { AppState, Settings } from '../types';
import { IVAS } from '../utils/calc';

interface AjustesViewProps {
  appState: AppState;
  onUpdateSettings: (newSettings: Settings) => void;
  onRestoreBackup: (restoredState: AppState) => void;
  onCopyText: (text: string, toastMsg?: string) => void;
  onShowToast: (msg: string) => void;
}

export const AjustesView: React.FC<AjustesViewProps> = ({
  appState,
  onUpdateSettings,
  onRestoreBackup,
  onCopyText,
  onShowToast,
}) => {
  const settings = appState.settings;

  const [confirmImport, setConfirmImport] = useState(false);
  const [importText, setImportText] = useState('');

  const handleFieldChange = (key: keyof Settings, value: string | number) => {
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
    onShowToast('Guardado');
  };

  const handleDayChange = (index: number, valStr: string) => {
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
            <li>Los datos viven en un solo navegador.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
