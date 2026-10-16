import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Quote, Settings, UserSubscriptionProfile } from '../types';
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

  let trialEndsAtIso = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  if (data.trialEndsAt instanceof Timestamp) {
    trialEndsAtIso = data.trialEndsAt.toDate().toISOString();
  } else if (typeof data.trialEndsAtIso === 'string') {
    trialEndsAtIso = data.trialEndsAtIso;
  } else if (typeof data.trialEndsAt === 'string') {
    trialEndsAtIso = data.trialEndsAt;
  }

  const subscriptionStatus = (data.subscriptionStatus as string) || 'none';
  const isExpired = Date.now() >= new Date(trialEndsAtIso).getTime();

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
 * If it does not exist, a new 14-day trial is registered using the authoritative
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

    const isExpired = Date.now() >= new Date(trialEndsAt).getTime();

    const profileData = {
      userId: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      createdAt,
      trialStartedAt: Timestamp.fromDate(new Date(trialStartedAt)),
      trialStartedAtIso: trialStartedAt,
      trialEndsAt: Timestamp.fromDate(new Date(trialEndsAt)),
      trialEndsAtIso: trialEndsAt,
      trialStatus: isExpired ? 'expired' : 'active',
      subscriptionStatus: 'none',
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

