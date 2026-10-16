import React from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { TrialStateInfo } from '../types';

interface TrialBannerProps {
  trialState: TrialStateInfo;
  onOpenPlans: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ trialState, onOpenPlans }) => {
  // If subscription is active, display a subtle non-intrusive badge or nothing
  if (trialState.isSubscriptionActive) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--ok-soft)',
          color: 'var(--ok)',
          borderRadius: '8px',
          padding: '8px 14px',
          marginBottom: '16px',
          fontSize: '0.88rem',
          fontWeight: 600,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} />
          <span>Plan Profesional activo · Acceso ilimitado</span>
        </div>
      </div>
    );
  }

  // Expired trial banner
  if (trialState.isExpired) {
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          background: 'var(--bad-soft)',
          color: 'var(--bad)',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '0.9rem',
          border: '1px solid rgba(163, 48, 42, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <AlertCircle size={18} />
          <span>Tu prueba gratuita de 14 días ha terminado. Estás en modo solo lectura.</span>
        </div>
        <button
          type="button"
          className="btn btn-primary sm"
          style={{ background: 'var(--bad)', borderColor: 'var(--bad)', color: '#fff' }}
          onClick={onOpenPlans}
        >
          Activar Plan (12 €/mes)
        </button>
      </div>
    );
  }

  // Last day of trial banner
  if (trialState.statusType === 'active_last_day') {
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          background: 'var(--warn-soft)',
          color: 'var(--warn)',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '0.9rem',
          border: '1px solid rgba(180, 83, 9, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <AlertTriangle size={18} />
          <span>Último día de prueba gratuita. Tu acceso para crear presupuestos finaliza hoy.</span>
        </div>
        <button
          type="button"
          className="btn sm"
          style={{ background: 'var(--surface)', borderColor: 'currentColor', color: 'inherit' }}
          onClick={onOpenPlans}
        >
          Elegir plan
        </button>
      </div>
    );
  }

  // Expiring soon (<= 3 days)
  if (trialState.statusType === 'active_expiring_soon') {
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          background: 'var(--pending-soft)',
          color: 'var(--pending)',
          borderRadius: '8px',
          padding: '9px 14px',
          marginBottom: '16px',
          fontSize: '0.88rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <Clock size={16} />
          <span>Tu prueba gratuita termina pronto: te quedan {trialState.daysRemaining} días.</span>
        </div>
        <button
          type="button"
          className="btn sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}
          onClick={onOpenPlans}
        >
          Ver suscripción (12 €/mes)
        </button>
      </div>
    );
  }

  // Normal active trial (> 3 days)
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        background: 'var(--surface-2)',
        color: 'var(--muted)',
        border: '1px solid var(--line)',
        borderRadius: '8px',
        padding: '7px 12px',
        marginBottom: '16px',
        fontSize: '0.85rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={15} color="var(--accent)" />
        <span>
          Te quedan <strong style={{ color: 'var(--ink)' }}>{trialState.daysRemaining} días</strong> de prueba gratuita
        </span>
      </div>
      <button
        type="button"
        className="btn btn-quiet sm"
        style={{ padding: '2px 6px', fontSize: '0.8rem', color: 'var(--accent)' }}
        onClick={onOpenPlans}
      >
        Detalles del plan →
      </button>
    </div>
  );
};
