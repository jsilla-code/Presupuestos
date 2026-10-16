import {
  SubscriptionStatus,
  TrialBadgeType,
  TrialStateInfo,
  TrialStatus,
  UserSubscriptionProfile,
} from '../types';

/**
 * Standard duration of the free trial in milliseconds (14 natural days).
 * 14 days * 24 hours * 60 minutes * 60 seconds * 1000 ms = 1,209,600,000 ms.
 */
export const TRIAL_DURATION_DAYS = 14;
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Calculates start and end dates for a 14-day trial.
 * If an existing accountCreationTime is provided (from Firebase Auth metadata),
 * it uses that authoritative timestamp so existing accounts do not receive
 * an unauthorized trial extension.
 */
export function calculateTrialDates(
  accountCreationTime?: string | null,
  referenceNow: Date = new Date()
): { trialStartedAt: string; trialEndsAt: string; createdAt: string } {
  let startDate: Date;

  if (accountCreationTime) {
    const parsed = new Date(accountCreationTime);
    if (!isNaN(parsed.getTime())) {
      startDate = parsed;
    } else {
      startDate = referenceNow;
    }
  } else {
    startDate = referenceNow;
  }

  const endDate = new Date(startDate.getTime() + TRIAL_DURATION_MS);

  return {
    createdAt: startDate.toISOString(),
    trialStartedAt: startDate.toISOString(),
    trialEndsAt: endDate.toISOString(),
  };
}

/**
 * Authoritatively computes the current trial and subscription state.
 * All checks use absolute UTC timestamps (getTime()) to ensure consistency
 * across timezones, daylight saving transitions, and device clock formats.
 */
export function computeTrialState(
  profile: Pick<UserSubscriptionProfile, 'trialStartedAt' | 'trialEndsAt' | 'subscriptionStatus' | 'planId'>,
  referenceNow: Date = new Date()
): TrialStateInfo {
  const startedAt = new Date(profile.trialStartedAt);
  const endsAt = new Date(profile.trialEndsAt);
  const now = referenceNow;

  const hasSubscription = profile.subscriptionStatus === 'active';
  const msRemaining = endsAt.getTime() - now.getTime();
  const isTrialActive = !hasSubscription && msRemaining > 0;
  const isExpired = !hasSubscription && msRemaining <= 0;
  const isActive = hasSubscription || isTrialActive;

  // Days remaining derived strictly from trialEndsAt (never from a mutable local timer)
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const hoursRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60)));

  let badgeType: TrialBadgeType;
  let message: string;

  if (hasSubscription) {
    badgeType = 'subscribed';
    message = 'Plan Profesional activo';
  } else if (isExpired) {
    badgeType = 'trial_expired';
    message = 'Tu prueba gratuita ha terminado. Contrata un plan para recuperar las funciones de pago.';
  } else if (msRemaining <= 24 * 60 * 60 * 1000) {
    badgeType = 'trial_last_day';
    message = `Último día de prueba gratuita (${hoursRemaining} h restantes). Elige un plan para seguir disfrutando de todas las funciones.`;
  } else if (daysRemaining <= 3) {
    badgeType = 'trial_ending_soon';
    message = `Tu prueba gratuita termina pronto (${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}). Elige un plan para seguir disfrutando de todas las funciones.`;
  } else {
    badgeType = 'trial_active';
    message = `Te quedan ${daysRemaining} días de prueba gratuita`;
  }

  const trialStatus: TrialStatus = isExpired ? 'expired' : 'active';

  return {
    trialStartedAt: startedAt,
    trialEndsAt: endsAt,
    trialStatus,
    subscriptionStatus: profile.subscriptionStatus,
    planId: profile.planId || null,
    isActive,
    hasSubscription,
    isTrialing: isTrialActive,
    isExpired,
    daysRemaining,
    hoursRemaining,
    badgeType,
    message,
  };
}

/**
 * Formats a date into Spanish locale for display (e.g., "24 oct 2026, 12:00")
 */
export function formatTrialDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a date into Spanish locale for display (e.g., "24 de octubre de 2026")
 */
export function formatTrialDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
