import React, { useEffect, useMemo, useState } from 'react';
import { AjustesView } from './components/AjustesView';
import { AuthModal } from './components/AuthModal';
import { AuthScreen } from './components/AuthScreen';
import { Banner } from './components/Banner';
import { DetalleView } from './components/DetalleView';
import { EditFormData, EditView, createNewEditData } from './components/EditView';
import { EstadisticasView } from './components/EstadisticasView';
import { Header } from './components/Header';
import { HoyView } from './components/HoyView';
import { LandingPage } from './components/LandingPage';
import { ListaView } from './components/ListaView';
import { SubscriptionModal } from './components/SubscriptionModal';
import { Toast } from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  clearUserExampleQuotes,
  deleteUserQuote,
  ensureUserSubscriptionProfile,
  saveUserQuote,
  saveUserSettings,
  seedUserQuotes,
  subscribeToUserQuotes,
  subscribeToUserSettings,
  subscribeToUserSubscription,
} from './lib/firestoreService';
import { AppState, ListFilter, Quote, Settings, TabView, TrialStateInfo, UserSubscriptionProfile } from './types';
import { nextNum, uid } from './utils/calc';
import { addDays, isVencido, nextFu, pad, today } from './utils/date';
import { seed } from './utils/storage';
import { computeTrialState } from './utils/trial';

const defaultFallbackSettings: Settings = {
  negocio: 'Mi Negocio',
  telefono: '',
  iva: 21,
  dias: [3, 7, 14],
  condiciones: 'Forma de pago: 50 % al aceptar y 50 % al terminar el trabajo.',
};

const MainApp: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // URL Path-based SPA Navigation without page reloads
  const getInitialRoute = (): string => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/app' || path === '/app/') return '/app';
    if (path === '/login' || path === '/login/') return '/login';
    if (path === '/register' || path === '/register/') return '/register';
    return '/';
  };

  const [route, setRoute] = useState<string>(getInitialRoute);

  const navigateRoute = (newRoute: string) => {
    if (window.location.pathname !== newRoute) {
      window.history.pushState({}, '', newRoute);
    }
    setRoute(newRoute);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const onPopState = () => {
      setRoute(getInitialRoute());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultFallbackSettings);
  const [dataLoading, setDataLoading] = useState(false);
  const [firestoreErr, setFirestoreErr] = useState(false);

  const [currentTab, setCurrentTab] = useState<TabView>('hoy');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);

  const [listFilter, setListFilter] = useState<ListFilter>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Free trial and subscription state
  const [subscriptionProfile, setSubscriptionProfile] = useState<UserSubscriptionProfile | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionModalReason, setSubscriptionModalReason] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState<Date>(() => new Date());

  // Periodically refresh nowTick (every 60s) for live trial countdown
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTick(new Date());
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  // Compute authoritative trial state from persistent profile
  const trialState: TrialStateInfo | null = useMemo(() => {
    if (!subscriptionProfile) return null;
    return computeTrialState(subscriptionProfile, nowTick);
  }, [subscriptionProfile, nowTick]);

  // Central access control gate for write operations
  const ensureActiveAccess = (actionDescription: string): boolean => {
    if (trialState && trialState.isExpired) {
      setSubscriptionModalReason(
        `Tu prueba gratuita de 14 días ha finalizado. Para ${actionDescription}, activa tu suscripción al Plan Profesional.`
      );
      setIsSubscriptionModalOpen(true);
      return false;
    }
    return true;
  };

  // Helper to persist user-scoped local fallback cache
  const saveUserLocalCache = (userId: string, userQuotes: Quote[], userSettings?: Settings) => {
    try {
      localStorage.setItem(`presufollow.user.${userId}.quotes`, JSON.stringify(userQuotes));
      if (userSettings) {
        localStorage.setItem(`presufollow.user.${userId}.settings`, JSON.stringify(userSettings));
      }
    } catch {
      // LocalStorage error handled quietly
    }
  };

  // Subscribe to account-specific Firestore data when user is logged in
  useEffect(() => {
    if (!user) {
      setQuotes([]);
      setSettings(defaultFallbackSettings);
      setSubscriptionProfile(null);
      setIsSubscriptionModalOpen(false);
      setSubscriptionModalReason(null);
      return;
    }

    // 1. Initial quick load from local cache for instant UI rendering
    try {
      const cachedQuotes = localStorage.getItem(`presufollow.user.${user.uid}.quotes`);
      if (cachedQuotes) {
        const parsed = JSON.parse(cachedQuotes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuotes(parsed);
        }
      }
      const cachedSettings = localStorage.getItem(`presufollow.user.${user.uid}.settings`);
      if (cachedSettings) {
        const parsedSettings = JSON.parse(cachedSettings);
        if (parsedSettings && parsedSettings.negocio) {
          setSettings(parsedSettings);
        }
      }
      const cachedSub = localStorage.getItem(`presufollow.user.${user.uid}.subscription`);
      if (cachedSub) {
        const parsedSub = JSON.parse(cachedSub);
        if (parsedSub && parsedSub.trialEndsAt) {
          setSubscriptionProfile(parsedSub);
        }
      }
    } catch {
      // Continue to Firestore
    }

    setDataLoading(true);
    setFirestoreErr(false);

    // 2. Subscribe to real-time subscription profile /users/{userId}
    const unsubSub = subscribeToUserSubscription(
      user.uid,
      (fetchedProfile) => {
        if (fetchedProfile) {
          setSubscriptionProfile(fetchedProfile);
          try {
            localStorage.setItem(`presufollow.user.${user.uid}.subscription`, JSON.stringify(fetchedProfile));
          } catch {}
        }
      }
    );

    // 3. Ensure user profile exists in Firestore (idempotent, derives from user.metadata.creationTime)
    ensureUserSubscriptionProfile(user).then((initializedProfile) => {
      if (initializedProfile) {
        setSubscriptionProfile(initializedProfile);
        try {
          localStorage.setItem(`presufollow.user.${user.uid}.subscription`, JSON.stringify(initializedProfile));
        } catch {}
      }
    });

    // 4. Subscribe to Firestore quotes subcollection for this user
    const unsubQuotes = subscribeToUserQuotes(
      user.uid,
      (fetchedQuotes) => {
        setQuotes(fetchedQuotes);
        saveUserLocalCache(user.uid, fetchedQuotes);
        setDataLoading(false);
        setFirestoreErr(false);
      },
      () => {
        setFirestoreErr(true);
        setDataLoading(false);
      }
    );

    // 5. Subscribe to Firestore settings document for this user
    const unsubSettings = subscribeToUserSettings(
      user.uid,
      (fetchedSettings) => {
        if (fetchedSettings) {
          setSettings(fetchedSettings);
          saveUserLocalCache(user.uid, quotes, fetchedSettings);
        } else {
          // Initialize default configuration for this new user in Firestore
          const initialSettings: Settings = {
            negocio: user.displayName || 'Mi Negocio',
            telefono: '',
            iva: 21,
            dias: [3, 7, 14],
            condiciones: 'Forma de pago: 50 % al aceptar y 50 % al terminar el trabajo.',
          };
          setSettings(initialSettings);
          saveUserLocalCache(user.uid, quotes, initialSettings);
          saveUserSettings(user.uid, initialSettings).catch(() => {});
        }
      },
      () => {
        // Settings listener warning handled quietly
      }
    );

    return () => {
      unsubSub();
      unsubQuotes();
      unsubSettings();
    };
  }, [user]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.clearTimeout((showToast as unknown as { timeoutId?: number }).timeoutId);
    (showToast as unknown as { timeoutId?: number }).timeoutId = window.setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  };

  const copyText = (text: string, msg = 'Copiado') => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast(msg))
        .catch(() => {
          showToast('No se pudo copiar automáticamente.');
        });
    } else {
      showToast('Portapapeles no disponible.');
    }
  };

  const addHistory = (q: Quote, text: string) => {
    const now = new Date();
    const timeStr = `${today()}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    q.hist.push({ f: timeStr, t: text });
  };

  const navigateTo = (tab: TabView, id: string | null = null) => {
    setCurrentTab(tab);
    setSelectedQuoteId(id);
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Sesión cerrada');
      setCurrentTab('hoy');
      setSelectedQuoteId(null);
      setEditFormData(null);
      navigateRoute('/');
    } catch {
      showToast('Error al cerrar sesión');
    }
  };

  // Follow-ups due today count for badge
  const t = today();
  const dueCount = quotes.filter((q) => {
    if (q.estado !== 'enviado' || q.pausa || isVencido(q)) return false;
    const n = nextFu(q);
    return n && n.due <= t;
  }).length;

  const handleNewQuote = () => {
    if (!ensureActiveAccess('crear un nuevo presupuesto')) return;
    setEditFormData(createNewEditData(settings));
    navigateTo('edit');
  };

  const handleEditDraft = (q: Quote) => {
    if (!ensureActiveAccess('editar este borrador')) return;
    setEditFormData({
      id: q.id,
      cliente: q.cliente,
      telefono: q.telefono,
      email: q.email,
      titulo: q.titulo,
      emision: q.emision,
      validez: q.validez,
      lineas: q.lineas.map((l) => ({ ...l })),
      condiciones: q.condiciones,
      notas: q.notas,
    });
    navigateTo('edit', q.id);
  };

  // Optimistic Save: Updates state & local cache immediately, then syncs to Firestore in background
  const handleSaveEdit = (data: EditFormData, andSend: boolean) => {
    if (!user) return;
    if (!ensureActiveAccess('guardar cambios en el presupuesto')) return;
    let targetQuoteId = data.id;
    let quoteToSave: Quote;

    if (data.id) {
      // Edit existing draft
      const existing = quotes.find((q) => q.id === data.id);
      const updated: Quote = {
        ...(existing || {
          id: data.id,
          num: 'PF-0001',
          pausa: false,
          enviado: null,
          seg: [],
          resuelto: null,
          motivo: '',
          nota: '',
          estado: 'borrador',
          hist: [],
        }),
        cliente: data.cliente,
        telefono: data.telefono,
        email: data.email,
        titulo: data.titulo,
        emision: data.emision,
        validez: data.validez,
        condiciones: data.condiciones,
        notas: data.notas,
        lineas: data.lineas,
      };
      addHistory(updated, 'Borrador editado');
      quoteToSave = updated;

      setQuotes((prev) => {
        const next = prev.map((q) => (q.id === data.id ? updated : q));
        saveUserLocalCache(user.uid, next);
        return next;
      });
    } else {
      // Create new draft
      const newQ: Quote = {
        id: uid(),
        num: nextNum(quotes),
        example: false,
        estado: 'borrador',
        pausa: false,
        enviado: null,
        seg: [],
        resuelto: null,
        motivo: '',
        nota: '',
        notas: data.notas,
        cliente: data.cliente,
        telefono: data.telefono,
        email: data.email,
        titulo: data.titulo,
        emision: data.emision,
        validez: data.validez,
        condiciones: data.condiciones,
        lineas: data.lineas,
        hist: [],
      };
      addHistory(newQ, 'Borrador creado');
      targetQuoteId = newQ.id;
      quoteToSave = newQ;

      setQuotes((prev) => {
        const next = [newQ, ...prev];
        saveUserLocalCache(user.uid, next);
        return next;
      });
    }

    // Immediately dismiss editor and navigate
    setEditFormData(null);
    showToast('Borrador guardado');
    navigateTo(andSend ? 'det' : 'lista', andSend ? targetQuoteId : null);

    // Asynchronously sync to Firestore without blocking the UI
    saveUserQuote(user.uid, quoteToSave).then((ok) => {
      if (!ok) {
        setFirestoreErr(true);
      }
    });
  };

  const handleDuplicateQuote = (q: Quote) => {
    if (!user) return;
    if (!ensureActiveAccess('duplicar este presupuesto')) return;
    const dup: Quote = {
      id: uid(),
      num: nextNum(quotes),
      example: false,
      estado: 'borrador',
      pausa: false,
      enviado: null,
      seg: [],
      resuelto: null,
      motivo: '',
      nota: '',
      notas: q.notas,
      cliente: q.cliente,
      telefono: q.telefono,
      email: q.email,
      titulo: q.titulo,
      emision: today(),
      validez: addDays(today(), 30),
      condiciones: q.condiciones,
      lineas: q.lineas.map((l) => ({ ...l })),
      hist: [],
    };
    addHistory(dup, `Duplicado de ${q.num}`);

    setQuotes((prev) => {
      const next = [dup, ...prev];
      saveUserLocalCache(user.uid, next);
      return next;
    });

    setEditFormData({
      id: dup.id,
      cliente: dup.cliente,
      telefono: dup.telefono,
      email: dup.email,
      titulo: dup.titulo,
      emision: dup.emision,
      validez: dup.validez,
      lineas: dup.lineas.map((l) => ({ ...l })),
      condiciones: dup.condiciones,
      notas: dup.notas,
    });

    showToast('Duplicado como borrador');
    navigateTo('edit', dup.id);

    saveUserQuote(user.uid, dup).then((ok) => {
      if (!ok) setFirestoreErr(true);
    });
  };

  const handleMarkSent = (quoteId: string) => {
    if (!user) return;
    if (!ensureActiveAccess('marcar este presupuesto como enviado')) return;
    const q = quotes.find((x) => x.id === quoteId);
    if (!q) return;

    const updated: Quote = {
      ...q,
      estado: 'enviado',
      enviado: today(),
      seg: settings.dias.map((d) => ({ dia: d, hecho: null })),
    };
    addHistory(updated, 'Presupuesto marcado como enviado');

    setQuotes((prev) => {
      const next = prev.map((item) => (item.id === quoteId ? updated : item));
      saveUserLocalCache(user.uid, next);
      return next;
    });
    showToast('Marcado como enviado. Te avisaré de los seguimientos.');

    saveUserQuote(user.uid, updated).then((ok) => {
      if (!ok) setFirestoreErr(true);
    });
  };

  const handleFollowUpDone = (quoteId: string, stepIndex: number) => {
    if (!user) return;
    if (!ensureActiveAccess('registrar este seguimiento')) return;
    const q = quotes.find((x) => x.id === quoteId);
    if (!q) return;

    const nextSeg = [...q.seg];
    nextSeg[stepIndex] = {
      ...nextSeg[stepIndex],
      hecho: today(),
    };

    const updated: Quote = {
      ...q,
      seg: nextSeg,
    };
    addHistory(updated, `Recordatorio ${stepIndex + 1} enviado`);

    setQuotes((prev) => {
      const next = prev.map((item) => (item.id === quoteId ? updated : item));
      saveUserLocalCache(user.uid, next);
      return next;
    });
    showToast('Recordatorio registrado');

    saveUserQuote(user.uid, updated).then((ok) => {
      if (!ok) setFirestoreErr(true);
    });
  };

  const handlePauseResume = (quoteId: string, pause: boolean) => {
    if (!user) return;
    if (!ensureActiveAccess('pausar o reanudar seguimientos')) return;
    const q = quotes.find((x) => x.id === quoteId);
    if (!q) return;

    const updated: Quote = {
      ...q,
      pausa: pause,
    };
    addHistory(updated, pause ? 'Seguimientos pausados' : 'Seguimientos reanudados');

    setQuotes((prev) => {
      const next = prev.map((item) => (item.id === quoteId ? updated : item));
      saveUserLocalCache(user.uid, next);
      return next;
    });

    saveUserQuote(user.uid, updated).then((ok) => {
      if (!ok) setFirestoreErr(true);
    });
  };

  const handleResolve = (
    quoteId: string,
    status: 'aceptado' | 'rechazado',
    motivo?: string,
    nota?: string
  ) => {
    if (!user) return;
    if (!ensureActiveAccess('actualizar el estado de este presupuesto')) return;
    const q = quotes.find((x) => x.id === quoteId);
    if (!q) return;

    const updated: Quote = {
      ...q,
      estado: status,
      resuelto: today(),
      motivo: status === 'rechazado' ? motivo || '' : '',
      nota: nota ? nota.trim() : '',
    };
    addHistory(
      updated,
      status === 'aceptado'
        ? 'El cliente aceptó el presupuesto'
        : `El cliente rechazó el presupuesto${motivo ? ` (${motivo})` : ''}`
    );

    setQuotes((prev) => {
      const next = prev.map((item) => (item.id === quoteId ? updated : item));
      saveUserLocalCache(user.uid, next);
      return next;
    });
    showToast(status === 'aceptado' ? 'Presupuesto aceptado' : 'Presupuesto rechazado');

    saveUserQuote(user.uid, updated).then((ok) => {
      if (!ok) setFirestoreErr(true);
    });
  };

  const handleCancelQuote = (quoteId: string) => {
    if (!user) return;
    if (!ensureActiveAccess('cancelar este presupuesto')) return;
    const q = quotes.find((x) => x.id === quoteId);
    if (!q) return;

    const updated: Quote = {
      ...q,
      estado: 'cancelado',
    };
    addHistory(updated, 'Presupuesto cancelado');

    setQuotes((prev) => {
      const next = prev.map((item) => (item.id === quoteId ? updated : item));
      saveUserLocalCache(user.uid, next);
      return next;
    });
    showToast('Presupuesto cancelado');

    saveUserQuote(user.uid, updated).then((ok) => {
      if (!ok) setFirestoreErr(true);
    });
  };

  const handleDeleteDraft = (quoteId: string) => {
    if (!user) return;
    if (!ensureActiveAccess('eliminar este borrador')) return;
    setQuotes((prev) => {
      const next = prev.filter((q) => q.id !== quoteId);
      saveUserLocalCache(user.uid, next);
      return next;
    });
    showToast('Borrador eliminado');
    navigateTo('lista');

    deleteUserQuote(user.uid, quoteId).then((ok) => {
      if (!ok) setFirestoreErr(true);
    });
  };

  const handleClearExamples = () => {
    if (!user) return;
    const exampleIds = quotes.filter((q) => q.example).map((q) => q.id);
    setQuotes((prev) => {
      const next = prev.filter((q) => !q.example);
      saveUserLocalCache(user.uid, next);
      return next;
    });
    showToast('Ejemplos borrados');
    if (currentTab === 'det' && selectedQuoteId) {
      const exists = quotes.some((q) => q.id === selectedQuoteId && !q.example);
      if (!exists) navigateTo('hoy');
    }

    clearUserExampleQuotes(user.uid, exampleIds).then((ok) => {
      if (!ok) setFirestoreErr(true);
    });
  };

  const handleLoadExamples = () => {
    if (!user) return;
    if (!ensureActiveAccess('cargar presupuestos de ejemplo')) return;
    const demo = seed();
    setQuotes(demo.quotes);
    saveUserLocalCache(user.uid, demo.quotes);
    showToast('Presupuestos de ejemplo cargados');

    seedUserQuotes(user.uid, demo.quotes).then((ok) => {
      if (!ok) setFirestoreErr(true);
    });
  };

  const handleRestoreBackup = (restoredState: AppState) => {
    if (!user) return;
    if (!ensureActiveAccess('restaurar una copia de seguridad')) return;
    setQuotes(restoredState.quotes);
    setSettings(restoredState.settings);
    saveUserLocalCache(user.uid, restoredState.quotes, restoredState.settings);
    showToast('Copia restaurada');
    navigateTo('hoy');

    seedUserQuotes(user.uid, restoredState.quotes).catch(() => {});
    saveUserSettings(user.uid, restoredState.settings).catch(() => {});
  };

  const handleUpdateSettings = (newSettings: Settings) => {
    if (!user) return;
    if (!ensureActiveAccess('guardar cambios en los ajustes')) return;
    setSettings(newSettings);
    saveUserLocalCache(user.uid, quotes, newSettings);

    saveUserSettings(user.uid, newSettings).then((ok) => {
      if (!ok) setFirestoreErr(true);
    });
  };

  // If Firebase Auth is still determining auth state
  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <div className="brand" style={{ fontSize: '2rem' }}>
          Presu<span>Follow</span>
        </div>
        <p className="hint">Iniciando aplicación...</p>
      </div>
    );
  }

  // ROUTE 1: Landing Page (Commercial presentation at "/")
  if (route === '/') {
    return (
      <>
        <LandingPage
          onNavigate={navigateRoute}
          isAuthenticated={!!user}
          userEmail={user?.email || user?.displayName}
        />
        <Toast message={toastMsg} />
      </>
    );
  }

  // ROUTE 2: Explicit Auth Routes ("/login" or "/register")
  if (route === '/login' || route === '/register') {
    if (user) {
      return (
        <div
          className="wrap"
          style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '430px',
              width: '100%',
              textAlign: 'center',
              padding: '30px 24px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            }}
          >
            <div className="brand" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
              Presu<span>Follow</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>Sesión activa</h2>
            <p className="muted" style={{ marginBottom: '20px', fontSize: '0.92rem' }}>
              Ya has iniciado sesión como <strong>{user.email || user.displayName}</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px' }}
                onClick={() => navigateRoute('/app')}
              >
                Entrar a la aplicación
              </button>
              <button
                type="button"
                className="btn"
                style={{ width: '100%', padding: '10px' }}
                onClick={() => navigateRoute('/')}
              >
                Volver a la portada comercial
              </button>
              <button
                type="button"
                className="btn btn-quiet sm"
                style={{ marginTop: '6px' }}
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
          <Toast message={toastMsg} />
        </div>
      );
    }

    return (
      <div className="wrap">
        <AuthScreen
          initialMode={route === '/register' ? 'register' : 'login'}
          onSuccessToast={showToast}
          onNavigateLanding={() => navigateRoute('/')}
          onSuccessAuth={() => navigateRoute('/app')}
          onModeChange={(m) => navigateRoute(m === 'register' ? '/register' : '/login')}
        />
        <Toast message={toastMsg} />
      </div>
    );
  }

  // ROUTE 3: Application Route ("/app" or any fallback when user is not authenticated)
  if (!user) {
    return (
      <div className="wrap">
        <div style={{ maxWidth: '430px', margin: '20px auto 0', padding: '0 16px' }}>
          <div className="banner" style={{ marginBottom: 0 }}>
            <span>
              Acceso a PresuFollow: Inicia sesión o crea tu cuenta gratuita para acceder a tus presupuestos.
            </span>
          </div>
        </div>
        <AuthScreen
          initialMode="login"
          onSuccessToast={showToast}
          onNavigateLanding={() => navigateRoute('/')}
          onSuccessAuth={() => navigateRoute('/app')}
          onModeChange={(m) => navigateRoute(m === 'register' ? '/register' : '/login')}
        />
        <Toast message={toastMsg} />
      </div>
    );
  }

  // Once authenticated on /app, build AppState view representation
  const appState: AppState = {
    v: 1,
    settings,
    quotes,
  };

  const hasExamples = quotes.some((q) => q.example);
  const selectedQuote = selectedQuoteId ? quotes.find((q) => q.id === selectedQuoteId) : null;

  return (
    <div className="wrap">
      <Header
        currentTab={currentTab}
        dueCount={dueCount}
        user={user}
        trialState={trialState}
        onSelectTab={(tab) => navigateTo(tab)}
        onNewQuote={handleNewQuote}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onNavigateLanding={() => navigateRoute('/')}
        onOpenSubscription={() => {
          setSubscriptionModalReason(null);
          setIsSubscriptionModalOpen(true);
        }}
      />

      <Banner
        hasExamples={hasExamples}
        saveErr={firestoreErr}
        quotesCount={quotes.length}
        trialState={trialState}
        onClearExamples={handleClearExamples}
        onLoadExamples={handleLoadExamples}
        onOpenSubscription={() => {
          setSubscriptionModalReason(null);
          setIsSubscriptionModalOpen(true);
        }}
      />

      {dataLoading && quotes.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <p className="hint">Cargando tus datos de Firebase...</p>
        </div>
      ) : (
        <main>
          {currentTab === 'hoy' && (
            <HoyView
              quotes={quotes}
              settings={settings}
              onOpenQuote={(id) => navigateTo('det', id)}
              onNewQuote={handleNewQuote}
              onCopyText={copyText}
              onFollowUpDone={handleFollowUpDone}
            />
          )}

          {currentTab === 'lista' && (
            <ListaView
              quotes={quotes}
              currentFilter={listFilter}
              searchQuery={searchQuery}
              onSelectFilter={setListFilter}
              onSearchChange={setSearchQuery}
              onOpenQuote={(id) => navigateTo('det', id)}
            />
          )}

          {currentTab === 'stats' && <EstadisticasView quotes={quotes} />}

          {currentTab === 'ajustes' && (
            <AjustesView
              appState={appState}
              user={user}
              trialState={trialState}
              onUpdateSettings={handleUpdateSettings}
              onRestoreBackup={handleRestoreBackup}
              onCopyText={copyText}
              onShowToast={showToast}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onLogout={handleLogout}
              onOpenSubscription={(reason) => {
                setSubscriptionModalReason(reason || null);
                setIsSubscriptionModalOpen(true);
              }}
            />
          )}

          {currentTab === 'edit' && editFormData && (
            <EditView
              initialData={editFormData}
              existingQuotes={quotes}
              settings={settings}
              onSave={handleSaveEdit}
              onCancel={() =>
                navigateTo(selectedQuoteId ? 'det' : 'lista', selectedQuoteId)
              }
            />
          )}

          {currentTab === 'det' && (
            selectedQuote ? (
              <DetalleView
                quote={selectedQuote}
                settings={settings}
                onBack={() => navigateTo('lista')}
                onEditDraft={handleEditDraft}
                onDuplicate={handleDuplicateQuote}
                onDeleteDraft={handleDeleteDraft}
                onCancelQuote={handleCancelQuote}
                onPauseResume={handlePauseResume}
                onResolve={handleResolve}
                onMarkSent={handleMarkSent}
                onFollowUpDone={handleFollowUpDone}
                onCopyText={copyText}
              />
            ) : (
              <div className="empty">
                <p>No se encuentra este presupuesto.</p>
                <button
                  type="button"
                  className="btn btn-quiet sm"
                  style={{ marginTop: '10px' }}
                  onClick={() => navigateTo('lista')}
                >
                  ← Volver a presupuestos
                </button>
              </div>
            )
          )}
        </main>
      )}

      <footer className="foot">
        Conectado como <strong>{user.email || user.displayName}</strong>.
      </footer>

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => {
          setIsSubscriptionModalOpen(false);
          setSubscriptionModalReason(null);
        }}
        trialState={trialState}
        reason={subscriptionModalReason}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessToast={showToast}
      />

      <Toast message={toastMsg} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
