import React from 'react';
import { CheckCircle2, ShieldCheck, X, Sparkles, AlertCircle, Mail } from 'lucide-react';
import { TrialStateInfo } from '../types';
import { formatTrialDateLong } from '../utils/trial';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialState: TrialStateInfo | null;
  reason?: string | null;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  trialState,
  reason,
}) => {
  if (!isOpen) return null;

  const isExpired = trialState?.isExpired;
  const hasSubscription = trialState?.hasSubscription;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 100,
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sub-modal-title"
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          padding: '28px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="btn btn-quiet sm"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '4px',
            borderRadius: '50%',
          }}
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        {/* Reason banner if triggered by a blocked action */}
        {reason && (
          <div
            style={{
              background: 'var(--warn-soft)',
              color: 'var(--warn)',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '18px',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{reason}</span>
          </div>
        )}

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
            }}
          >
            <Sparkles size={24} />
          </div>

          <h2 id="sub-modal-title" style={{ fontSize: '1.45rem', marginBottom: '6px' }}>
            {hasSubscription
              ? 'Plan Profesional activo'
              : isExpired
              ? 'Tu prueba gratuita ha finalizado'
              : 'Plan Profesional PresuFollow'}
          </h2>

          {/* Status Chip */}
          <div style={{ marginTop: '8px' }}>
            {hasSubscription ? (
              <span className="chip chip-aceptado" style={{ fontSize: '0.82rem' }}>
                Suscripción activa · Acceso completo
              </span>
            ) : isExpired ? (
              <span className="chip chip-rechazado" style={{ fontSize: '0.82rem' }}>
                Prueba de 14 días vencida el{' '}
                {trialState ? formatTrialDateLong(trialState.trialEndsAt) : ''}
              </span>
            ) : trialState?.badgeType === 'trial_last_day' ? (
              <span className="chip chip-vencido" style={{ fontSize: '0.82rem' }}>
                Último día de prueba gratuita ({trialState.hoursRemaining} h restantes)
              </span>
            ) : (
              <span className="chip chip-enviado" style={{ fontSize: '0.82rem' }}>
                Prueba gratuita activa: {trialState?.daysRemaining} días restantes
              </span>
            )}
          </div>
        </div>

        {/* Plan Pricing Card */}
        <div
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            borderRadius: '10px',
            padding: '18px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '1.15rem' }}>Plan Profesional</span>
            <div style={{ textAlign: 'right' }}>
              <span className="num" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--ink)' }}>
                12 €
              </span>
              <span className="muted" style={{ fontSize: '0.88rem' }}>
                {' '}/ mes
              </span>
            </div>
          </div>
          <p className="hint" style={{ fontSize: '0.84rem', margin: '0 0 14px' }}>
            Sin permanencia. Cancela en cualquier momento sin penalizaciones.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--ok)" style={{ flexShrink: 0 }} />
              <span>Creación y edición ilimitada de presupuestos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--ok)" style={{ flexShrink: 0 }} />
              <span>Recordatorios automáticos en el panel «Hoy»</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--ok)" style={{ flexShrink: 0 }} />
              <span>Plantillas para WhatsApp y Email en un clic</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--ok)" style={{ flexShrink: 0 }} />
              <span>Estadísticas de conversión y motivos de rechazo</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--ok)" style={{ flexShrink: 0 }} />
              <span>Sincronización en la nube privada con Firebase</span>
            </div>
          </div>
        </div>

        {/* Data preservation guarantee */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '20px',
            fontSize: '0.86rem',
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <ShieldCheck size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Tus datos están protegidos:</strong> Ningún presupuesto ni dato de cliente se
            elimina tras finalizar la prueba. Puedes consultar tus presupuestos históricos y descargar
            copias de seguridad en cualquier momento.
          </div>
        </div>

        {/* Phase notice about Stripe integration */}
        <div
          style={{
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '20px',
            fontSize: '0.84rem',
            lineHeight: 1.45,
          }}
        >
          <strong>Aviso de fase:</strong> La pasarela de pago automatizada (Stripe) se activará en
          la siguiente fase de producción. Para activar tu cuenta ahora o resolver dudas, pulsa el
          botón inferior para contactar con nuestro equipo.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a
            href="mailto:contacto@presufollow.com?subject=Solicitud%20de%20activaci%C3%B3n%20Plan%20Profesional%20PresuFollow"
            className="btn btn-primary"
            style={{
              padding: '11px',
              fontSize: '0.98rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Mail size={16} />
            Contactar para activar (12 €/mes)
          </a>

          <button
            type="button"
            className="btn sm"
            onClick={onClose}
            style={{ width: '100%', padding: '9px' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
