import { SurveyAnswers, SurveyEligibility, SurveyResponse } from '../types';

export const SURVEY_ELIGIBILITY_DAYS = 21;
export const SURVEY_ELIGIBILITY_MS = SURVEY_ELIGIBILITY_DAYS * 24 * 60 * 60 * 1000;
export const SURVEY_SESSION_DISMISSED_KEY = 'presufollow_survey_dismissed_session';

/**
 * Calculates whether a user has reached the 21-day mark since account creation.
 * Returns eligibility details, days elapsed, and human-readable reason.
 */
export function calculateSurveyEligibility(
  createdAtStr?: string | null,
  authCreationTime?: string | null,
  hasSubmitted = false,
  now: Date = new Date()
): SurveyEligibility {
  if (hasSubmitted) {
    return {
      isEligible: false,
      daysSinceRegistration: 0,
      hasSubmitted: true,
      dismissedInSession: false,
      reason: 'Encuesta ya respondida',
    };
  }

  const dateToUse = createdAtStr || authCreationTime;
  if (!dateToUse) {
    return {
      isEligible: false,
      daysSinceRegistration: 0,
      hasSubmitted: false,
      dismissedInSession: false,
      reason: 'Fecha de registro no disponible',
    };
  }

  const regDate = new Date(dateToUse);
  if (isNaN(regDate.getTime())) {
    return {
      isEligible: false,
      daysSinceRegistration: 0,
      hasSubmitted: false,
      dismissedInSession: false,
      reason: 'Fecha de registro inválida',
    };
  }

  const elapsedMs = now.getTime() - regDate.getTime();
  const daysSinceRegistration = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));
  const isEligible = elapsedMs >= SURVEY_ELIGIBILITY_MS;

  let dismissedInSession = false;
  try {
    dismissedInSession = sessionStorage.getItem(SURVEY_SESSION_DISMISSED_KEY) === 'true';
  } catch {
    dismissedInSession = false;
  }

  return {
    isEligible,
    daysSinceRegistration,
    hasSubmitted: false,
    dismissedInSession,
    reason: isEligible
      ? `Usuario con ${daysSinceRegistration} días (elegible)`
      : `Faltan ${SURVEY_ELIGIBILITY_DAYS - daysSinceRegistration} días para los 21`,
  };
}

/**
 * Marks survey as dismissed for the active browser session so it doesn't repeatedly interrupt.
 */
export function markSurveyDismissedInSession(): void {
  try {
    sessionStorage.setItem(SURVEY_SESSION_DISMISSED_KEY, 'true');
  } catch {
    // SessionStorage error handled quietly
  }
}

/**
 * Labels mapping for displaying survey questions in UI and CSV
 */
export const SURVEY_LABELS = {
  q1: {
    habitualmente: 'Sí, habitualmente',
    algunas_veces: 'Sí, algunas veces',
    apenas: 'Apenas lo he utilizado',
    no_suficiente: 'Todavía no he podido probarlo lo suficiente',
  } as Record<string, string>,
  q2: {
    seguimiento: 'Hacer seguimiento de presupuestos enviados',
    recordar_contacto: 'Recordar cuándo contactar con un cliente',
    organizacion: 'Tener los presupuestos mejor organizados',
    ahorro_tiempo: 'Ahorrar tiempo en tareas administrativas',
    ninguno: 'Ninguno por ahora',
    otro: 'Otro problema',
  } as Record<string, string>,
  q5: {
    contrataria: 'Lo contrataría',
    probablemente: 'Probablemente lo contrataría',
    dependeria: 'Dependería de las funcionalidades y del precio',
    probablemente_no: 'Probablemente dejaría de utilizarlo',
    no_pagaria: 'No pagaría por esta herramienta',
    no_valoro: 'Todavía no puedo valorarlo',
  } as Record<string, string>,
  q5b: {
    menos_6: 'Menos de 6 €/mes',
    '6_10': '6 € – 10 €/mes',
    '10_15': '10 € – 15 €/mes',
    '15_20': '15 € – 20 €/mes',
    mas_20: 'Más de 20 €/mes',
    no_pagaria: 'No pagaría por esta herramienta',
    no_se: 'Todavía no lo sé',
  } as Record<string, string>,
};

/**
 * Exports an array of survey responses to a UTF-8 encoded CSV with BOM.
 * Compatible with Microsoft Excel, Google Sheets, and LibreOffice.
 */
export function exportSurveyResponsesToCSV(responses: SurveyResponse[]): void {
  const headers = [
    'ID Usuario',
    'Email Usuario',
    'Fecha Registro',
    'Fecha Envio Encuesta',
    'P1: Uso PresuFollow',
    'P2: Problemas Resueltos',
    'P2: Otro Problema (Detalle)',
    'P3: Lo mas valorado',
    'P4: Lo que menos gusta / Dificultades',
    'P5: Disposicion a pagar mensual',
    'P5b: Rango precio mensual',
    'P6: Funcionalidades solicitadas',
    'P7: Puntuacion recomendacion (0-10)',
  ];

  const escapeCell = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = responses.map((r) => {
    const a: SurveyAnswers = r.answers || ({} as SurveyAnswers);

    const q1Text = a.q1_usage ? (SURVEY_LABELS.q1[a.q1_usage] || a.q1_usage) : '';
    const q2ProblemsText = Array.isArray(a.q2_problems)
      ? a.q2_problems.map((p) => SURVEY_LABELS.q2[p] || p).join('; ')
      : '';
    const q5Text = a.q5_willingnessToPay ? (SURVEY_LABELS.q5[a.q5_willingnessToPay] || a.q5_willingnessToPay) : '';
    const q5bText = a.q5b_monthlyPrice ? (SURVEY_LABELS.q5b[a.q5b_monthlyPrice] || a.q5b_monthlyPrice) : '';
    const q7Text = a.q7_recommendScore !== null && a.q7_recommendScore !== undefined ? String(a.q7_recommendScore) : 'Omitida';

    return [
      escapeCell(r.userId),
      escapeCell(r.userEmail || ''),
      escapeCell(r.userCreatedAt || ''),
      escapeCell(r.submittedAt),
      escapeCell(q1Text),
      escapeCell(q2ProblemsText),
      escapeCell(a.q2_problemOther || ''),
      escapeCell(a.q3_mostValued || ''),
      escapeCell(a.q4_leastLiked || ''),
      escapeCell(q5Text),
      escapeCell(q5bText),
      escapeCell(a.q6_requestedFeatures || ''),
      escapeCell(q7Text),
    ].join(',');
  });

  // UTF-8 BOM prefix (\uFEFF) to guarantee correct rendering of accents in Excel
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `presufollow_encuestas_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
