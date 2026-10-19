import {
  SubscriptionStatus,
  TrialBadgeType,
  TrialStateInfo,
  TrialStatus,
  UserSubscriptionProfile,
} from '../types';

/**
 * Standard duration of the free trial during validation phase (limited time).
 */
export const TRIAL_DURATION_DAYS = 180;
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Calculates start and end dates for a limited-time trial.
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
  // In this product validation phase, users enjoy a free trial for a limited time without counter restrictions
  const isExplicitlyExpired = profile.subscriptionStatus === 'canceled' || profile.subscriptionStatus === 'past_due';
  const isExpired = isExplicitlyExpired;
  const isTrialActive = !hasSubscription && !isExpired;
  const isActive = hasSubscription || isTrialActive;

  const msRemaining = Math.max(0, endsAt.getTime() - now.getTime());
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const hoursRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60)));

  let badgeType: TrialBadgeType;
  let message: string;

  if (hasSubscription) {
    badgeType = 'subscribed';
    message = 'Plan Profesional activo';
  } else if (isExpired) {
    badgeType = 'trial_expired';
    message = 'Tu prueba gratuita por tiempo limitado ha finalizado. Contrata un plan para recuperar las funciones de pago.';
  } else {
    badgeType = 'trial_active';
    message = 'Prueba gratuita por tiempo limitado activa';
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
