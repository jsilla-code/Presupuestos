import React, { useEffect, useState } from 'react';
import { X, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { Payment, PaymentMethod, Quote } from '../types';
import { fmt } from '../utils/calc';
import { today } from '../utils/date';
import {
  calcPaymentInfo,
  formatCentsToInput,
  parseEurosToCents,
  PAYMENT_METHODS,
} from '../utils/payments';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  paymentToEdit?: Payment | null;
  onSavePayment: (paymentData: Omit<Payment, 'id'>, paymentId?: string) => Promise<boolean | void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  quote,
  paymentToEdit,
  onSavePayment,
}) => {
  const [cantidadInput, setCantidadInput] = useState('');
  const [fecha, setFecha] = useState(today());
  const [metodo, setMetodo] = useState<PaymentMethod | ''>('');
  const [notas, setNotas] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentInfo = calcPaymentInfo(quote);

  // Maximum allowed cents for this entry
  // If editing an existing payment, we add back its original amount to the available room
  const maxAllowedCents = paymentToEdit
    ? paymentInfo.pendiente + paymentToEdit.cantidad
    : paymentInfo.pendiente;

  useEffect(() => {
    if (!isOpen) return;

    if (paymentToEdit) {
      setCantidadInput(formatCentsToInput(paymentToEdit.cantidad));
      setFecha(paymentToEdit.fecha || today());
      setMetodo(paymentToEdit.metodo || '');
      setNotas(paymentToEdit.notas || '');
    } else {
      // Default: prefill with pending amount if positive for convenience
      setCantidadInput(paymentInfo.pendiente > 0 ? formatCentsToInput(paymentInfo.pendiente) : '');
      setFecha(today());
      setMetodo('transferencia');
      setNotas('');
    }
    setErrorMsg(null);
    setIsSubmitting(false);
  }, [isOpen, paymentToEdit, quote.id, paymentInfo.pendiente]);

  if (!isOpen) return null;

  const handleSetPreset = (cents: number) => {
    setCantidadInput(formatCentsToInput(cents));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const parsedCents = parseEurosToCents(cantidadInput);

    // 1. Validation: Cantidad > 0
    if (parsedCents <= 0) {
      setErrorMsg('Introduce una cantidad válida superior a 0,00 €.');
      return;
    }

    // 2. Validation: Cannot exceed pending
    if (parsedCents > maxAllowedCents) {
      setErrorMsg(
        `La cantidad (${fmt(parsedCents)}) supera el importe pendiente de cobro (${fmt(maxAllowedCents)}).`
      );
      return;
    }

    // 3. Validation: Fecha
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      setErrorMsg('Indica una fecha de pago válida.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: Omit<Payment, 'id'> = {
        cantidad: parsedCents,
        fecha,
        metodo: metodo ? (metodo as PaymentMethod) : undefined,
        notas: notas.trim() || undefined,
        createdAt: paymentToEdit?.createdAt || new Date().toISOString(),
      };

      const res = await onSavePayment(payload, paymentToEdit?.id);
      if (res !== false) {
        onClose();
      }
    } catch (err) {
      setErrorMsg('Ocurrió un error al guardar el pago. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(paymentToEdit);

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
        zIndex: 110,
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-modal-title"
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          padding: '24px',
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
            top: '14px',
            right: '14px',
            padding: '4px',
            borderRadius: '50%',
          }}
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--ok-soft)',
              color: 'var(--ok)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CreditCard size={20} />
          </div>
          <div>
            <h2 id="pay-modal-title" style={{ fontSize: '1.25rem', margin: 0 }}>
              {isEditing ? 'Editar pago registrado' : 'Registrar pago recibido'}
            </h2>
            <p className="muted" style={{ fontSize: '0.84rem', margin: '2px 0 0' }}>
              {quote.num} · {quote.cliente}
            </p>
          </div>
        </div>

        {/* Current Quote Financial Summary Bar */}
        <div
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '0.86rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            textAlign: 'center',
          }}
        >
          <div>
            <div className="muted" style={{ fontSize: '0.76rem' }}>
              Total
            </div>
            <div className="num" style={{ fontWeight: 700, fontSize: '0.98rem' }}>
              {fmt(paymentInfo.total)}
            </div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: '0.76rem' }}>
              Ya cobrado
            </div>
            <div
              className="num"
              style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--ok)' }}
            >
              {fmt(paymentInfo.cobrado)}
            </div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: '0.76rem' }}>
              Pendiente
            </div>
            <div
              className="num"
              style={{
                fontWeight: 700,
                fontSize: '0.98rem',
                color: maxAllowedCents > 0 ? 'var(--pending)' : 'var(--muted)',
              }}
            >
              {fmt(maxAllowedCents)}
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div
            style={{
              background: 'var(--bad-soft)',
              color: 'var(--bad)',
              border: '1px solid rgba(163, 48, 42, 0.3)',
              borderRadius: '8px',
              padding: '9px 12px',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="stack" style={{ gap: '14px' }}>
          {/* Amount field */}
          <div className="f">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label htmlFor="pago-cantidad" style={{ fontWeight: 600 }}>
                Cantidad recibida (€) <span style={{ color: 'var(--bad)' }}>*</span>
              </label>
              {maxAllowedCents > 0 && (
                <button
                  type="button"
                  className="btn btn-quiet sm"
                  style={{ fontSize: '0.78rem', padding: '1px 6px', color: 'var(--accent)' }}
                  onClick={() => handleSetPreset(maxAllowedCents)}
                >
                  Cobrar todo ({fmt(maxAllowedCents)})
                </button>
              )}
            </div>

            <div style={{ position: 'relative', marginTop: '4px' }}>
              <input
                id="pago-cantidad"
                type="text"
                inputMode="decimal"
                autoFocus
                placeholder="Ej.: 400,00"
                value={cantidadInput}
                onChange={(e) => {
                  setCantidadInput(e.target.value);
                  setErrorMsg(null);
                }}
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  paddingRight: '36px',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 700,
                  color: 'var(--muted)',
                }}
              >
                €
              </span>
            </div>

            {/* Quick 50% Preset if quote has total and pending >= 50% */}
            {!isEditing && paymentInfo.paymentsCount === 0 && paymentInfo.total > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-quiet sm"
                  style={{ fontSize: '0.78rem', padding: '2px 8px' }}
                  onClick={() => handleSetPreset(Math.round(paymentInfo.total * 0.5))}
                >
                  50 % anticipo ({fmt(Math.round(paymentInfo.total * 0.5))})
                </button>
              </div>
            )}
          </div>

          {/* Payment Date */}
          <div className="f">
            <label htmlFor="pago-fecha" style={{ fontWeight: 600 }}>
              Fecha del pago <span style={{ color: 'var(--bad)' }}>*</span>
            </label>
            <input
              id="pago-fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              style={{ marginTop: '4px' }}
            />
          </div>

          {/* Payment Method */}
          <div className="f">
            <label htmlFor="pago-metodo" style={{ fontWeight: 600 }}>
              Método de pago (opcional)
            </label>
            <select
              id="pago-metodo"
              value={metodo}
              onChange={(e) => setMetodo(e.target.value as PaymentMethod | '')}
              style={{ marginTop: '4px' }}
            >
              <option value="">Seleccionar método...</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes / Remarks */}
          <div className="f">
            <label htmlFor="pago-notas" style={{ fontWeight: 600 }}>
              Observaciones (opcional)
            </label>
            <textarea
              id="pago-notas"
              rows={3}
              placeholder="Ej.: Primer plazo acordado, transferencia ref #9832..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              style={{ marginTop: '4px' }}
            />
          </div>

          {/* Action buttons */}
          <div className="btnrow" style={{ marginTop: '6px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ flex: 1, padding: '10px 16px', fontWeight: 700 }}
            >
              {isSubmitting ? (
                'Guardando...'
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>{isEditing ? 'Actualizar pago' : 'Guardar pago'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: '10px 14px' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
