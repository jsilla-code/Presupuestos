import React, { useState } from 'react';

interface BannerProps {
  hasExamples: boolean;
  saveErr: boolean;
  quotesCount: number;
  onClearExamples: () => void;
  onLoadExamples?: () => void;
}

export const Banner: React.FC<BannerProps> = ({
  hasExamples,
  saveErr,
  quotesCount,
  onClearExamples,
  onLoadExamples,
}) => {
  const [showFixHelp, setShowFixHelp] = useState(false);

  return (
    <>
      {hasExamples && (
        <div className="banner">
          <span>Estás viendo datos de ejemplo para que pruebes la aplicación.</span>
          <button
            type="button"
            className="btn sm"
            onClick={onClearExamples}
          >
            Borrar ejemplos
          </button>
        </div>
      )}

      {quotesCount === 0 && onLoadExamples && (
        <div className="banner" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          <span>Tu cuenta aún no tiene presupuestos creados. ¿Deseas cargar propuestas de demostración?</span>
          <button
            type="button"
            className="btn sm"
            onClick={onLoadExamples}
          >
            Cargar ejemplos
          </button>
        </div>
      )}

      {saveErr && (
        <div
          className="banner"
          style={{
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '8px',
            background: 'var(--warn-soft)',
            borderColor: 'var(--warn)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>
              <strong>Aviso de Firestore:</strong> La base de datos no está creada o las reglas de seguridad en Firebase Console bloquean el acceso. Tus presupuestos se están guardando localmente en este navegador.
            </span>
            <button
              type="button"
              className="btn sm"
              onClick={() => setShowFixHelp(!showFixHelp)}
            >
              {showFixHelp ? 'Ocultar solución' : '¿Cómo solucionarlo?'}
            </button>
          </div>

          {showFixHelp && (
            <div
              style={{
                marginTop: '6px',
                padding: '10px 12px',
                background: 'var(--surface)',
                borderRadius: '6px',
                fontSize: '0.86rem',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>Pasos rápidos en Firebase Console:</p>
              <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Entra en <strong>Firebase Console</strong> &gt; Proyecto <strong>presupuestos-3ce7c</strong>.</li>
                <li>Ve a <strong>Firestore Database</strong>. Si aún no está creada, pulsa <strong>«Crear base de datos»</strong>.</li>
                <li>Entra en la pestaña <strong>Reglas (Rules)</strong> y pega:
                  <pre style={{ margin: '6px 0', padding: '6px', background: 'var(--surface-2)', borderRadius: '4px', overflowX: 'auto' }}>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
                  </pre>
                </li>
                <li>Pulsa el botón <strong>Publicar (Publish)</strong>.</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </>
  );
};
