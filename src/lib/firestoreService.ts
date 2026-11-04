import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Quote, Settings, SurveyResponse, UserSubscriptionProfile } from '../types';
import { calculateTrialDates } from '../utils/trial';
import { auth, db } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.warn('Firestore Warning/Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Subscribe to real-time quotes of a specific user
export function subscribeToUserQuotes(
  userId: string,
  onUpdate: (quotes: Quote[]) => void,
  onError?: (err: FirestoreErrorInfo) => void
) {
  const path = `users/${userId}/quotes`;
  const quotesRef = collection(db, 'users', userId, 'quotes');

  return onSnapshot(
    quotesRef,
    (snapshot) => {
      const list: Quote[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Quote);
      });
      list.sort((a, b) => (a.emision < b.emision ? 1 : -1));
      onUpdate(list);
    },
    (error) => {
      const info = handleFirestoreError(error, OperationType.LIST, path);
      onError?.(info);
    }
  );
}

// Subscribe to user settings
export function subscribeToUserSettings(
  userId: string,
  onUpdate: (settings: Settings | null) => void,
  onError?: (err: FirestoreErrorInfo) => void
) {
  const path = `users/${userId}/settings/config`;
  const settingsRef = doc(db, 'users', userId, 'settings', 'config');

  return onSnapshot(
    settingsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as Settings);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      const info = handleFirestoreError(error, OperationType.GET, path);
      onError?.(info);
    }
  );
}

// Save or update a single quote in Firestore
export async function saveUserQuote(userId: string, quote: Quote): Promise<boolean> {
  const path = `users/${userId}/quotes/${quote.id}`;
  try {
    const quoteRef = doc(db, 'users', userId, 'quotes', quote.id);
    await setDoc(quoteRef, quote, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

// Delete a single quote from Firestore
export async function deleteUserQuote(userId: string, quoteId: string): Promise<boolean> {
  const path = `users/${userId}/quotes/${quoteId}`;
  try {
    const quoteRef = doc(db, 'users', userId, 'quotes', quoteId);
    await deleteDoc(quoteRef);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

// Save user settings in Firestore
export async function saveUserSettings(userId: string, settings: Settings): Promise<boolean> {
  const path = `users/${userId}/settings/config`;
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'config');
    await setDoc(settingsRef, settings, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

// Batch save initial demo quotes for a user if requested
export async function seedUserQuotes(userId: string, quotes: Quote[]): Promise<boolean> {
  const path = `users/${userId}/quotes`;
  try {
    const batch = writeBatch(db);
    quotes.forEach((q) => {
      const qRef = doc(db, 'users', userId, 'quotes', q.id);
      batch.set(qRef, q);
    });
    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

// Delete all demo quotes for a user
export async function clearUserExampleQuotes(userId: string, exampleQuoteIds: string[]): Promise<boolean> {
  const path = `users/${userId}/quotes`;
  try {
    const batch = writeBatch(db);
    exampleQuoteIds.forEach((id) => {
      const qRef = doc(db, 'users', userId, 'quotes', id);
      batch.delete(qRef);
    });
    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

/**
 * Normalizes document data into a UserSubscriptionProfile
 */
export function parseSubscriptionProfileDoc(data: Record<string, unknown>, userId: string): UserSubscriptionProfile {
  let trialStartedAtIso = new Date().toISOString();
  if (data.trialStartedAt instanceof Timestamp) {
    trialStartedAtIso = data.trialStartedAt.toDate().toISOString();
  } else if (typeof data.trialStartedAtIso === 'string') {
    trialStartedAtIso = data.trialStartedAtIso;
  } else if (typeof data.trialStartedAt === 'string') {
    trialStartedAtIso = data.trialStartedAt;
  }

  let trialEndsAtIso = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
  if (data.trialEndsAt instanceof Timestamp) {
    trialEndsAtIso = data.trialEndsAt.toDate().toISOString();
  } else if (typeof data.trialEndsAtIso === 'string') {
    trialEndsAtIso = data.trialEndsAtIso;
  } else if (typeof data.trialEndsAt === 'string') {
    trialEndsAtIso = data.trialEndsAt;
  }

  const subscriptionStatus = (data.subscriptionStatus as string) || 'none';
  const isExpired = subscriptionStatus === 'canceled' || subscriptionStatus === 'past_due';

  return {
    userId,
    email: (data.email as string) || null,
    displayName: (data.displayName as string) || null,
    createdAt: (data.createdAt as string) || trialStartedAtIso,
    trialStartedAt: trialStartedAtIso,
    trialEndsAt: trialEndsAtIso,
    trialStatus: isExpired ? 'expired' : 'active',
    subscriptionStatus: subscriptionStatus as UserSubscriptionProfile['subscriptionStatus'],
    planId: (data.planId as string) || null,
  };
}

/**
 * Ensures a user subscription profile document exists at /users/{userId}.
 * If it already exists, it is loaded without modifying any dates.
 * If it does not exist, a new limited-time trial is registered using the authoritative
 * account creation time, preventing unauthorized resets.
 */
export async function ensureUserSubscriptionProfile(user: User): Promise<UserSubscriptionProfile | null> {
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      return parseSubscriptionProfileDoc(snap.data() as Record<string, unknown>, user.uid);
    }

    // Account creation date from Firebase Auth metadata
    const { createdAt, trialStartedAt, trialEndsAt } = calculateTrialDates(
      user.metadata.creationTime,
      new Date()
    );

    const isExpired = false;

    const profileData = {
      userId: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      createdAt,
      trialStartedAt: Timestamp.fromDate(new Date(trialStartedAt)),
      trialStartedAtIso: trialStartedAt,
      trialEndsAt: Timestamp.fromDate(new Date(trialEndsAt)),
      trialEndsAtIso: trialEndsAt,
      trialStatus: 'active' as const,
      subscriptionStatus: 'none' as const,
      planId: null,
    };

    // Use { merge: false } to guarantee idempotency and avoid resetting existing fields
    await setDoc(userDocRef, profileData, { merge: false });

    return {
      userId: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      createdAt,
      trialStartedAt,
      trialEndsAt,
      trialStatus: isExpired ? 'expired' : 'active',
      subscriptionStatus: 'none',
      planId: null,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
}

/**
 * Subscribes in real time to the user profile and subscription document /users/{userId}
 */
export function subscribeToUserSubscription(
  userId: string,
  onUpdate: (profile: UserSubscriptionProfile | null) => void,
  onError?: (err: FirestoreErrorInfo) => void
) {
  const path = `users/${userId}`;
  const userDocRef = doc(db, 'users', userId);

  return onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const profile = parseSubscriptionProfileDoc(snapshot.data() as Record<string, unknown>, userId);
        onUpdate(profile);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      const info = handleFirestoreError(error, OperationType.GET, path);
      onError?.(info);
    }
  );
}

/**
 * Saves a 21-day survey response to /survey_responses/{userId}.
 * Re-attempts and merges securely to avoid duplicate survey records.
 */
export async function saveSurveyResponse(response: SurveyResponse): Promise<boolean> {
  const path = `survey_responses/${response.userId}`;
  try {
    const surveyDocRef = doc(db, 'survey_responses', response.userId);
    await setDoc(surveyDocRef, response, { merge: true });
    try {
      localStorage.setItem(`presufollow.survey_submitted.${response.userId}`, 'true');
    } catch {
      // Local storage handled quietly
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Checks if the user has already submitted a survey response.
 */
export async function getSurveyResponse(userId: string): Promise<SurveyResponse | null> {
  const path = `survey_responses/${userId}`;
  try {
    const surveyDocRef = doc(db, 'survey_responses', userId);
    const snap = await getDoc(surveyDocRef);
    if (snap.exists()) {
      return snap.data() as SurveyResponse;
    }
    return null;
  } catch (error) {
    // If the doc doesn't exist or transient network warning
    console.warn(`Could not check survey response for ${userId}:`, error);
    return null;
  }
}

/**
 * Checks whether an authenticated user is an authorized administrator.
 * Verification order:
 * 1. Primary owner email (jausisan@gmail.com) verified with provider
 * 2. Dedicated Firestore document exists at /admins/{userId}
 */
export async function checkIsUserAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;

  // 1. Owner email check (with provider verification)
  const isOwnerEmail = user.email?.toLowerCase() === 'jausisan@gmail.com';
  const isVerified = user.emailVerified || user.providerData.some((p) => p.providerId === 'google.com');
  if (isOwnerEmail && isVerified) {
    return true;
  }

  // 2. Check if a role document exists in /admins/{uid}
  try {
    const adminDocRef = doc(db, 'admins', user.uid);
    const snap = await getDoc(adminDocRef);
    return snap.exists();
  } catch {
    return false;
  }
}

/**
 * Fetches all registered user profiles and all survey responses for the private admin panel.
 * Only callable by authorized administrators (rejected by Firestore security rules for others).
 */
export async function fetchAdminSurveyData(): Promise<{
  users: UserSubscriptionProfile[];
  responses: SurveyResponse[];
}> {
  const usersPath = 'users';
  const responsesPath = 'survey_responses';

  try {
    // 1. Fetch all user profile docs to count registered accounts and 21-day eligibility
    const usersColRef = collection(db, usersPath);
    const usersSnap = await getDocs(usersColRef);
    const usersList: UserSubscriptionProfile[] = [];
    usersSnap.forEach((d) => {
      usersList.push(parseSubscriptionProfileDoc(d.data() as Record<string, unknown>, d.id));
    });

    // 2. Fetch all survey response docs
    const responsesColRef = collection(db, responsesPath);
    const responsesSnap = await getDocs(responsesColRef);
    const responsesList: SurveyResponse[] = [];
    responsesSnap.forEach((d) => {
      responsesList.push(d.data() as SurveyResponse);
    });

    // Sort responses by submission date descending (newest first)
    responsesList.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));

    return {
      users: usersList,
      responses: responsesList,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `${usersPath} & ${responsesPath}`);
    throw error;
  }
}


