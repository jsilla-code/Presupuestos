import React, { useState } from 'react';
import { CheckCircle2, MessageSquare, X, Send, Sparkles, AlertCircle } from 'lucide-react';
import { SurveyAnswers, SurveyResponse } from '../types';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: SurveyAnswers) => Promise<boolean>;
  userEmail?: string | null;
}

export const SurveyModal: React.FC<SurveyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userEmail,
}) => {
  const [answers, setAnswers] = useState<SurveyAnswers>({
    q1_usage: '',
    q2_problems: [],
    q2_problemOther: '',
    q3_mostValued: '',
    q4_leastLiked: '',
    q5_willingnessToPay: '',
    q5b_monthlyPrice: '',
    q6_requestedFeatures: '',
    q7_recommendScore: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQ2Toggle = (problemKey: string) => {
    setAnswers((prev) => {
      const exists = prev.q2_problems.includes(problemKey);
      let updated: string[];
      if (exists) {
        updated = prev.q2_problems.filter((p) => p !== problemKey);
      } else {
        // If selecting "ninguno", unselect others; if selecting other, unselect "ninguno"
        if (problemKey === 'ninguno') {
          updated = ['ninguno'];
        } else {
          updated = [...prev.q2_problems.filter((p) => p !== 'ninguno'), problemKey];
        }
      }
      return { ...prev, q2_problems: updated };
    });
  };

  const handleScoreSelect = (score: number) => {
    setAnswers((prev) => ({
      ...prev,
      q7_recommendScore: prev.q7_recommendScore === score ? null : score,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const success = await onSubmit(answers);
      if (success) {
        setIsSubmitted(true);
      } else {
        setSubmitError('Hubo un problema al guardar tus respuestas. Por favor, inténtalo de nuevo.');
      }
    } catch (err) {
      setSubmitError('Error de conexión con Firebase. Tus respuestas no se han perdido, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 110,
        backdropFilter: 'blur(4px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="survey-title"
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0,0,0,0.22)',
          padding: 0,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '14px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 id="survey-title" style={{ fontSize: '1.28rem', margin: 0, lineHeight: 1.25 }}>
                Ayúdanos a mejorar PresuFollow
              </h2>
              <span className="sub muted" style={{ fontSize: '0.8rem' }}>
                Encuesta de experiencia y validación de producto
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-quiet sm"
            style={{
              padding: '6px',
              borderRadius: '50%',
              flexShrink: 0,
            }}
            aria-label="Cerrar encuesta"
            title="Responder más tarde"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
          }}
        >
          {isSubmitted ? (
            /* Thank you success screen */
            <div
              style={{
                textAlign: 'center',
                padding: '40px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--ok-soft, #D1FAE5)',
                  color: 'var(--ok, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.35rem', margin: 0 }}>¡Muchas gracias por tu tiempo!</h3>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.55,
                  maxWidth: '460px',
                  color: 'var(--ink)',
                  margin: 0,
                }}
              >
                ¡Gracias por ayudarnos a mejorar PresuFollow! Tus respuestas nos ayudarán a construir una herramienta más útil para los autónomos.
              </p>
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onClose}
                  style={{ padding: '10px 28px' }}
                >
                  Volver a la aplicación
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Introduction Text */}
              <div
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  color: 'var(--ink)',
                }}
              >
                Llevas un tiempo utilizando PresuFollow y queremos saber cómo te está ayudando. Tus respuestas nos permitirán mejorar la herramienta. Solo te llevará un par de minutos.
              </div>

              {submitError && (
                <div
                  style={{
                    background: 'var(--bad-soft)',
                    color: 'var(--bad)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Pregunta 1 */}
              <div className="f">
                <label style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '8px', display: 'block' }}>
                  1. ¿Has utilizado PresuFollow para gestionar tus presupuestos?
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { val: 'habitualmente', label: 'Sí, habitualmente.' },
                    { val: 'algunas_veces', label: 'Sí, algunas veces.' },
                    { val: 'apenas', label: 'Apenas lo he utilizado.' },
                    { val: 'no_suficiente', label: 'Todavía no he podido probarlo lo suficiente.' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        background: answers.q1_usage === opt.val ? 'var(--accent-soft)' : 'var(--surface)',
                        border: `1px solid ${answers.q1_usage === opt.val ? 'var(--accent)' : 'var(--line)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      <input
                        type="radio"
                        name="q1_usage"
                        value={opt.val}
                        checked={answers.q1_usage === opt.val}
                        onChange={(e) => setAnswers({ ...answers, q1_usage: e.target.value })}
                        style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pregunta 2 */}
              <div className="f">
                <label style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '8px', display: 'block' }}>
                  2. ¿Qué problema te ha ayudado a resolver?{' '}
                  <span className="muted" style={{ fontWeight: 400, fontSize: '0.84rem' }}>
                    (Puedes elegir varios)
                  </span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { val: 'seguimiento', label: 'Hacer seguimiento de presupuestos enviados.' },
                    { val: 'recordar_contacto', label: 'Recordar cuándo contactar con un cliente.' },
                    { val: 'organizacion', label: 'Tener los presupuestos mejor organizados.' },
                    { val: 'ahorro_tiempo', label: 'Ahorrar tiempo en tareas administrativas.' },
                    { val: 'ninguno', label: 'Ninguno por ahora.' },
                    { val: 'otro', label: 'Otro' },
                  ].map((opt) => {
                    const isChecked = answers.q2_problems.includes(opt.val);
                    return (
                      <div key={opt.val} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            background: isChecked ? 'var(--accent-soft)' : 'var(--surface)',
                            border: `1px solid ${isChecked ? 'var(--accent)' : 'var(--line)'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleQ2Toggle(opt.val)}
                            style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                          />
                          <span>{opt.label}</span>
                        </label>
                        {opt.val === 'otro' && isChecked && (
                          <input
                            type="text"
                            placeholder="Especifica qué otro problema te ha ayudado a resolver..."
                            value={answers.q2_problemOther || ''}
                            onChange={(e) => setAnswers({ ...answers, q2_problemOther: e.target.value })}
                            style={{
                              marginLeft: '24px',
                              padding: '8px 10px',
                              fontSize: '0.88rem',
                              borderRadius: '6px',
                              border: '1px solid var(--line)',
                              background: 'var(--surface)',
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pregunta 3 */}
              <div className="f">
                <label htmlFor="q3-valued" style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px', display: 'block' }}>
                  3. ¿Qué es lo que más valoras de PresuFollow?{' '}
                  <span className="muted" style={{ fontWeight: 400, fontSize: '0.84rem' }}>
                    (Opcional)
                  </span>
                </label>
                <textarea
                  id="q3-valued"
                  rows={3}
                  value={answers.q3_mostValued || ''}
                  onChange={(e) => setAnswers({ ...answers, q3_mostValued: e.target.value })}
                  placeholder="Por ejemplo: la claridad de la lista, los mensajes directos para WhatsApp, la sencillez..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Pregunta 4 */}
              <div className="f">
                <label htmlFor="q4-difficulties" style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px', display: 'block' }}>
                  4. ¿Qué es lo que menos te gusta o qué dificultad has encontrado?{' '}
                  <span className="muted" style={{ fontWeight: 400, fontSize: '0.84rem' }}>
                    (Opcional)
                  </span>
                </label>
                <textarea
                  id="q4-difficulties"
                  rows={3}
                  value={answers.q4_leastLiked || ''}
                  onChange={(e) => setAnswers({ ...answers, q4_leastLiked: e.target.value })}
                  placeholder="Explícanos cualquier fricción, duda o cosa que te haya resultado incómoda..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Pregunta 5 */}
              <div className="f">
                <label style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '8px', display: 'block' }}>
                  5. Si PresuFollow dejara de ser gratuito y pasara a tener una cuota mensual, ¿qué harías?
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { val: 'contrataria', label: 'Lo contrataría.' },
                    { val: 'probablemente', label: 'Probablemente lo contrataría.' },
                    { val: 'dependeria', label: 'Dependería de las funcionalidades y del precio.' },
                    { val: 'probablemente_no', label: 'Probablemente dejaría de utilizarlo.' },
                    { val: 'no_pagaria', label: 'No pagaría por esta herramienta.' },
                    { val: 'no_valoro', label: 'Todavía no puedo valorarlo.' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        background: answers.q5_willingnessToPay === opt.val ? 'var(--accent-soft)' : 'var(--surface)',
                        border: `1px solid ${answers.q5_willingnessToPay === opt.val ? 'var(--accent)' : 'var(--line)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      <input
                        type="radio"
                        name="q5_willingnessToPay"
                        value={opt.val}
                        checked={answers.q5_willingnessToPay === opt.val}
                        onChange={(e) => setAnswers({ ...answers, q5_willingnessToPay: e.target.value })}
                        style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pregunta 5b: Precio mensual aceptado */}
              <div className="f">
                <label style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '8px', display: 'block' }}>
                  5b. ¿Cuánto estarías dispuesto a pagar al mes por PresuFollow si se adapta a tu negocio?{' '}
                  <span className="muted" style={{ fontWeight: 400, fontSize: '0.84rem' }}>
                    (Opcional)
                  </span>
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {[
                    { val: 'menos_6', label: 'Menos de 6 €/mes' },
                    { val: '6_10', label: '6 € – 10 €/mes' },
                    { val: '10_15', label: '10 € – 15 €/mes' },
                    { val: '15_20', label: '15 € – 20 €/mes' },
                    { val: 'mas_20', label: 'Más de 20 €/mes' },
                    { val: 'no_pagaria', label: 'No pagaría' },
                    { val: 'no_se', label: 'No lo sé' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 10px',
                        background: answers.q5b_monthlyPrice === opt.val ? 'var(--accent-soft)' : 'var(--surface)',
                        border: `1px solid ${answers.q5b_monthlyPrice === opt.val ? 'var(--accent)' : 'var(--line)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.86rem',
                      }}
                    >
                      <input
                        type="radio"
                        name="q5b_monthlyPrice"
                        value={opt.val}
                        checked={answers.q5b_monthlyPrice === opt.val}
                        onChange={(e) => setAnswers({ ...answers, q5b_monthlyPrice: e.target.value })}
                        style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pregunta 6 */}
              <div className="f">
                <label htmlFor="q6-features" style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px', display: 'block' }}>
                  6. ¿Qué funcionalidad te gustaría que incorporásemos?{' '}
                  <span className="muted" style={{ fontWeight: 400, fontSize: '0.84rem' }}>
                    (Opcional)
                  </span>
                </label>
                <textarea
                  id="q6-features"
                  rows={3}
                  value={answers.q6_requestedFeatures || ''}
                  onChange={(e) => setAnswers({ ...answers, q6_requestedFeatures: e.target.value })}
                  placeholder="Por ejemplo: exportación a PDF profesional, firma digital de clientes, avisos por email automáticos..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Pregunta 7: Escala 0 a 10 */}
              <div className="f">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                    7. ¿Recomendarías PresuFollow a otro autónomo?
                  </label>
                  {answers.q7_recommendScore !== null && (
                    <button
                      type="button"
                      className="btn-quiet sm"
                      onClick={() => setAnswers({ ...answers, q7_recommendScore: null })}
                      style={{ fontSize: '0.78rem', padding: '2px 6px' }}
                    >
                      Omitir pregunta
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    justifyContent: 'space-between',
                  }}
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                    const isSelected = answers.q7_recommendScore === score;
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleScoreSelect(score)}
                        style={{
                          flex: '1 0 32px',
                          minWidth: '32px',
                          height: '38px',
                          borderRadius: '8px',
                          border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--line)'}`,
                          background: isSelected ? 'var(--accent)' : 'var(--surface)',
                          color: isSelected ? '#FFFFFF' : 'var(--ink)',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {score}
                      </button>
                    );
                  })}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '6px',
                    fontSize: '0.78rem',
                    color: 'var(--muted)',
                  }}
                >
                  <span>0: En absoluto</span>
                  <span>10: Sin ninguna duda</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--line)',
                  marginTop: '10px',
                }}
              >
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Responder más tarde
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px' }}
                >
                  <Send size={16} />
                  <span>{isSubmitting ? 'Enviando...' : 'Enviar encuesta'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
