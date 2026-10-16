import React, { useState } from 'react';
import { TrialStateInfo } from '../types';

interface BannerProps {
  hasExamples: boolean;
  saveErr: boolean;
  quotesCount: number;
  trialState?: TrialStateInfo | null;
  onClearExamples: () => void;
  onLoadExamples?: () => void;
  onOpenSubscription?: () => void;
}

export const Banner: React.FC<BannerProps> = ({
  hasExamples,
  saveErr,
  quotesCount,
  trialState,
  onClearExamples,
  onLoadExamples,
  onOpenSubscription,
}) => {
  const [showFixHelp, setShowFixHelp] = useState(false);

  return (
    <>
      {/* Trial Expired Alert Banner */}
      {trialState?.isExpired && (
        <div
          className="banner"
          style={{
            background: 'var(--bad-soft)',
            color: 'var(--bad)',
            borderColor: 'var(--bad)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span>
            <strong>Prueba gratuita finalizada:</strong> Puedes consultar todos tus presupuestos creados, pero las funciones de creación y edición están pausadas hasta activar tu suscripción.
          </span>
          {onOpenSubscription && (
            <button
              type="button"
              className="btn btn-primary sm"
              onClick={onOpenSubscription}
              style={{ whiteSpace: 'nowrap' }}
            >
              Activar Plan Profesional (12 €/mes)
            </button>
          )}
        </div>
      )}

      {/* Trial Ending Soon Warning Banner */}
      {!trialState?.isExpired &&
        (trialState?.badgeType === 'trial_ending_soon' || trialState?.badgeType === 'trial_last_day') && (
          <div
            className="banner"
            style={{
              background: 'var(--warn-soft)',
              color: 'var(--warn)',
              borderColor: 'var(--warn)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <span>{trialState.message}</span>
            {onOpenSubscription && (
              <button
                type="button"
                className="btn sm"
                onClick={onOpenSubscription}
                style={{ whiteSpace: 'nowrap' }}
              >
                Ver detalles
              </button>
            )}
          </div>
        )}
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
