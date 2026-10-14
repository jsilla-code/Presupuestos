import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { Quote, Settings } from '../types';
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
