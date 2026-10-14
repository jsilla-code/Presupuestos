import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthScreenProps {
  onSuccessToast?: (msg: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccessToast }) => {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    resetPassword,
    getFriendlyErrorMessage,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const resetState = () => {
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const handleGoogleLogin = async () => {
    resetState();
    setSubmitting(true);
    try {
      await loginWithGoogle();
      onSuccessToast?.('Sesión iniciada con Google');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      setErrorMsg(getFriendlyErrorMessage(code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    if (!email.trim()) {
      setErrorMsg('Introduce tu correo electrónico.');
      return;
    }

    if (mode !== 'forgot' && !password) {
      setErrorMsg('Introduce tu contraseña.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        onSuccessToast?.('Sesión iniciada correctamente');
      } else if (mode === 'register') {
        await registerWithEmail(email, password, name);
        onSuccessToast?.('Cuenta creada con éxito');
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setInfoMsg('Hemos enviado un enlace de recuperación a tu correo electrónico.');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      setErrorMsg(getFriendlyErrorMessage(code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '28px', maxWidth: '440px' }}>
        <div className="brand" style={{ fontSize: '2.2rem', marginBottom: '6px' }}>
          Presu<span>Follow</span>
        </div>
        <p className="muted" style={{ fontSize: '0.98rem', lineHeight: '1.4' }}>
          Seguimiento de presupuestos y gestión comercial de propuestas para autónomos y empresas.
        </p>
      </div>

      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '430px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          padding: '26px',
        }}
      >
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '4px' }}>
            {mode === 'login' && 'Acceso a tu cuenta'}
            {mode === 'register' && 'Crear nueva cuenta'}
            {mode === 'forgot' && 'Recuperar contraseña'}
          </h2>
          <p className="hint">
            {mode === 'login' && 'Inicia sesión para gestionar y sincronizar tus presupuestos.'}
            {mode === 'register' && 'Regístrate para disponer de tu espacio privado de presupuestos.'}
            {mode === 'forgot' && 'Te enviaremos las instrucciones de restablecimiento.'}
          </p>
        </div>

        {/* Tab switch */}
        {mode !== 'forgot' && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              borderBottom: '1px solid var(--line)',
              marginBottom: '20px',
            }}
          >
            <button
              type="button"
              className="tab"
              aria-current={mode === 'login' ? 'page' : undefined}
              style={{ padding: '8px 14px', fontSize: '0.92rem', flex: 1, justifyContent: 'center' }}
              onClick={() => {
                setMode('login');
                resetState();
              }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className="tab"
              aria-current={mode === 'register' ? 'page' : undefined}
              style={{ padding: '8px 14px', fontSize: '0.92rem', flex: 1, justifyContent: 'center' }}
              onClick={() => {
                setMode('register');
                resetState();
              }}
            >
              Registrarse
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="errs" style={{ marginBottom: '16px' }} role="alert">
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Info message */}
        {infoMsg && (
          <div
            style={{
              background: 'var(--ok-soft)',
              color: 'var(--ok)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '0.9rem',
            }}
          >
            {infoMsg}
          </div>
        )}

        {/* Google sign-in */}
        {mode !== 'forgot' && (
          <>
            <button
              type="button"
              className="btn"
              disabled={submitting}
              onClick={handleGoogleLogin}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '10px 14px',
                fontWeight: 600,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continuar con Google
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: '18px 0',
                color: 'var(--muted)',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
              <span>o con tu correo y contraseña</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
            </div>
          </>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="stack" style={{ gap: '14px' }}>
          {mode === 'register' && (
            <div className="f">
              <label htmlFor="screen-auth-name">Nombre o empresa</label>
              <input
                id="screen-auth-name"
                type="text"
                autoComplete="name"
                placeholder="Ej.: Reformas Integrales S.L."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="f">
            <label htmlFor="screen-auth-email">Correo electrónico</label>
            <input
              id="screen-auth-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="nombre@ejemplo.es"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {mode !== 'forgot' && (
            <div className="f">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label htmlFor="screen-auth-pass">Contraseña</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    className="btn-quiet"
                    style={{ fontSize: '0.8rem', padding: 0 }}
                    onClick={() => {
                      setMode('forgot');
                      resetState();
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <input
                id="screen-auth-pass"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === 'register' && (
                <span className="hint" style={{ fontSize: '0.78rem' }}>
                  Mínimo 6 caracteres
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', marginTop: '6px', padding: '10px 14px' }}
          >
            {submitting ? (
              'Procesando...'
            ) : mode === 'login' ? (
              'Iniciar sesión'
            ) : mode === 'register' ? (
              'Crear mi cuenta'
            ) : (
              'Enviar enlace de recuperación'
            )}
          </button>

          {mode === 'forgot' && (
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-quiet sm"
                onClick={() => {
                  setMode('login');
                  resetState();
                }}
              >
                ← Volver a inicio de sesión
              </button>
            </div>
          )}
        </form>
      </div>

      <div style={{ marginTop: '22px', fontSize: '0.84rem', color: 'var(--muted)', textAlign: 'center' }}>
        Tus presupuestos se almacenan de manera privada y sincronizada con Firebase.
      </div>
    </div>
  );
};
