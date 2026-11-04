import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getFriendlyErrorMessage: (errorOrCode: unknown) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Process redirect result if returning from a redirect auth flow
    getRedirectResult(auth)
      .then((cred) => {
        if (cred?.user) {
          console.info('[PresuFollow Auth] Sesión obtenida mediante redirección para:', cred.user.email);
        }
      })
      .catch((err) => {
        console.error('[PresuFollow Auth] Error al procesar getRedirectResult:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim();
    console.info('[PresuFollow Auth] Intentando inicio de sesión con correo:', cleanEmail);
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
      console.info('[PresuFollow Auth] Inicio de sesión con correo exitoso');
    } catch (err) {
      console.error('[PresuFollow Auth] Error en signInWithEmailAndPassword:', err);
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name?: string) => {
    const cleanEmail = email.trim();
    console.info('[PresuFollow Auth] Intentando registro de nuevo usuario:', cleanEmail);
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (name && name.trim() && cred.user) {
        await updateProfile(cred.user, { displayName: name.trim() });
        setUser({ ...cred.user, displayName: name.trim() } as User);
      }
      console.info('[PresuFollow Auth] Registro de usuario exitoso:', cred.user.uid);
    } catch (err) {
      console.error('[PresuFollow Auth] Error en createUserWithEmailAndPassword:', err);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' });

    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'desconocido';
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

    console.info('[PresuFollow Auth] Iniciando autenticación con Google...', {
      host: currentHost,
      enIframe: isInIframe,
    });

    try {
      const cred = await signInWithPopup(auth, provider);
      console.info('[PresuFollow Auth] Autenticación con Google completada con éxito:', cred.user.email);
    } catch (err: unknown) {
      console.error('[PresuFollow Auth] Error detallado en autenticación con Google:', err);

      const code = (err as { code?: string })?.code || '';

      // Si la ventana emergente fue bloqueada y la ventana es de nivel superior (no iframe), intentar redirección
      if (
        (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') &&
        !isInIframe
      ) {
        console.info('[PresuFollow Auth] Ventana emergente no disponible, ejecutando signInWithRedirect...');
        await signInWithRedirect(auth, provider);
        return;
      }

      throw err;
    }
  };

  const logout = async () => {
    console.info('[PresuFollow Auth] Cerrando sesión');
    try {
      await firebaseSignOut(auth);
      console.info('[PresuFollow Auth] Sesión cerrada correctamente');
    } catch (err) {
      console.error('[PresuFollow Auth] Error al cerrar sesión:', err);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim();
    console.info('[PresuFollow Auth] Solicitando restablecimiento de contraseña para:', cleanEmail);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      console.info('[PresuFollow Auth] Correo de restablecimiento enviado');
    } catch (err) {
      console.error('[PresuFollow Auth] Error en sendPasswordResetEmail:', err);
      throw err;
    }
  };

  const getFriendlyErrorMessage = (errorOrCode: unknown): string => {
    let errorCode = '';
    let rawMessage = '';

    if (typeof errorOrCode === 'string') {
      errorCode = errorOrCode;
    } else if (errorOrCode && typeof errorOrCode === 'object') {
      errorCode = (errorOrCode as { code?: string }).code || '';
      rawMessage = (errorOrCode as { message?: string }).message || '';
    }

    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'este dominio';
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

    console.error('[PresuFollow Auth Diagnóstico]', {
      code: errorCode,
      rawMessage,
      host: currentHost,
      enIframe: isInIframe,
    });

    switch (errorCode) {
      case 'auth/unauthorized-domain':
        return `Dominio no autorizado en Firebase: "${currentHost}" no está en la lista de dominios autorizados de tu proyecto Firebase. Para solucionarlo: entra en Firebase Console > Authentication > Settings (Ajustes) > Authorized domains (Dominios autorizados) y añade "${currentHost}".`;
      case 'auth/operation-not-allowed':
        return 'El proveedor Google no está habilitado en Firebase Authentication. Ve a Firebase Console > Authentication > Sign-in method (Métodos de inicio de sesión) y activa el proveedor Google.';
      case 'auth/popup-blocked':
        return isInIframe
          ? 'El navegador o el entorno en visor bloqueó la ventana emergente de Google. Por favor, abre la aplicación en una pestaña independiente para autenticarte.'
          : 'El navegador bloqueó la ventana emergente de Google. Por favor, permite las ventanas emergentes para este sitio e inténtalo de nuevo.';
      case 'auth/popup-closed-by-user':
        return 'Se cerró la ventana de Google antes de completar la autenticación. Por favor, inténtalo de nuevo.';
      case 'auth/cancelled-popup-request':
        return 'La solicitud de inicio de sesión fue cancelada por otra acción simultánea. Inténtalo de nuevo.';
      case 'auth/account-exists-with-different-credential':
        return 'Ya existe una cuenta con este correo electrónico registrada con otro método (correo y contraseña). Inicia sesión con tus credenciales habituales.';
      case 'auth/credential-already-in-use':
        return 'Esta credencial ya está asociada a otra cuenta de usuario.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'El correo o la contraseña no son correctos.';
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta registrada con este correo electrónico. Por favor, inicia sesión.';
      case 'auth/invalid-email':
        return 'El formato del correo electrónico no es válido.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Por seguridad, inténtalo de nuevo en unos minutos.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Comprueba tu conexión a internet o desactiva extensiones bloqueadoras de rastreo.';
      case 'auth/internal-error':
        return 'Error interno en la autenticación de Firebase. Por favor, inténtalo de nuevo o abre la aplicación en una ventana de incógnito.';
      case 'auth/user-disabled':
        return 'Esta cuenta de usuario ha sido inhabilitada por un administrador.';
      default:
        if (errorCode) {
          return `Error en la autenticación (${errorCode}). Por favor, inténtalo de nuevo.`;
        }
        if (rawMessage) {
          return `Error en la autenticación: ${rawMessage}`;
        }
        return 'Ha ocurrido un error en la autenticación. Por favor inténtalo de nuevo.';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        getFriendlyErrorMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
