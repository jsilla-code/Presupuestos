import React, { useEffect, useState } from 'react';
import { AjustesView } from './components/AjustesView';
import { Banner } from './components/Banner';
import { DetalleView } from './components/DetalleView';
import { EditFormData, EditView, createNewEditData } from './components/EditView';
import { EstadisticasView } from './components/EstadisticasView';
import { Header } from './components/Header';
import { HoyView } from './components/HoyView';
import { ListaView } from './components/ListaView';
import { Toast } from './components/Toast';
import { AppState, ListFilter, Quote, Settings, TabView } from './types';
import { nextNum, uid } from './utils/calc';
import { addDays, isVencido, nextFu, pad, today } from './utils/date';
import { loadState, saveState } from './utils/storage';

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(() => {
    const { state } = loadState();
    return state;
  });

  const [saveErr, setSaveErr] = useState<boolean>(() => {
    const { saveErr } = loadState();
    return saveErr;
  });

  const [currentTab, setCurrentTab] = useState<TabView>('hoy');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);

  const [listFilter, setListFilter] = useState<ListFilter>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Auto-save to localStorage whenever appState changes
  useEffect(() => {
    const ok = saveState(appState);
    if (!ok && !saveErr) {
      setSaveErr(true);
    }
  }, [appState, saveErr]);

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

  // Follow-ups due today count for badge
  const t = today();
  const dueCount = appState.quotes.filter((q) => {
    if (q.estado !== 'enviado' || q.pausa || isVencido(q)) return false;
    const n = nextFu(q);
    return n && n.due <= t;
  }).length;

  const handleNewQuote = () => {
    setEditFormData(createNewEditData(appState.settings));
    navigateTo('edit');
  };

  const handleEditDraft = (q: Quote) => {
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

  const handleSaveEdit = (data: EditFormData, andSend: boolean) => {
    let targetQuoteId = data.id;

    setAppState((prev) => {
      const nextQuotes = [...prev.quotes];

      if (data.id) {
        // Edit existing draft
        const idx = nextQuotes.findIndex((q) => q.id === data.id);
        if (idx >= 0) {
          const q = { ...nextQuotes[idx] };
          addHistory(q, 'Borrador editado');
          q.cliente = data.cliente;
          q.telefono = data.telefono;
          q.email = data.email;
          q.titulo = data.titulo;
          q.emision = data.emision;
          q.validez = data.validez;
          q.condiciones = data.condiciones;
          q.notas = data.notas;
          q.lineas = data.lineas;
          nextQuotes[idx] = q;
        }
      } else {
        // Create new draft
        const newQ: Quote = {
          id: uid(),
          num: nextNum(prev.quotes),
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
        nextQuotes.unshift(newQ);
        targetQuoteId = newQ.id;
      }

      return { ...prev, quotes: nextQuotes };
    });

    setEditFormData(null);
    showToast('Borrador guardado');
    navigateTo(andSend ? 'det' : 'lista', andSend ? targetQuoteId : null);
  };

  const handleDuplicateQuote = (q: Quote) => {
    let duplicatedId = '';
    setAppState((prev) => {
      const dup: Quote = {
        id: uid(),
        num: nextNum(prev.quotes),
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
      duplicatedId = dup.id;

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

      return {
        ...prev,
        quotes: [dup, ...prev.quotes],
      };
    });

    showToast('Duplicado como borrador');
    navigateTo('edit', duplicatedId);
  };

  const handleMarkSent = (quoteId: string) => {
    setAppState((prev) => {
      const nextQuotes = prev.quotes.map((q) => {
        if (q.id === quoteId) {
          const updated = { ...q };
          updated.estado = 'enviado';
          updated.enviado = today();
          updated.seg = prev.settings.dias.map((d) => ({ dia: d, hecho: null }));
          addHistory(updated, 'Presupuesto marcado como enviado');
          return updated;
        }
        return q;
      });
      return { ...prev, quotes: nextQuotes };
    });
    showToast('Marcado como enviado. Te avisaré de los seguimientos.');
  };

  const handleFollowUpDone = (quoteId: string, stepIndex: number) => {
    setAppState((prev) => {
      const nextQuotes = prev.quotes.map((q) => {
        if (q.id === quoteId) {
          const updated = { ...q, seg: [...q.seg] };
          updated.seg[stepIndex] = {
            ...updated.seg[stepIndex],
            hecho: today(),
          };
          addHistory(updated, `Recordatorio ${stepIndex + 1} enviado`);
          return updated;
        }
        return q;
      });
      return { ...prev, quotes: nextQuotes };
    });
    showToast('Recordatorio registrado');
  };

  const handlePauseResume = (quoteId: string, pause: boolean) => {
    setAppState((prev) => {
      const nextQuotes = prev.quotes.map((q) => {
        if (q.id === quoteId) {
          const updated = { ...q, pausa: pause };
          addHistory(updated, pause ? 'Seguimientos pausados' : 'Seguimientos reanudados');
          return updated;
        }
        return q;
      });
      return { ...prev, quotes: nextQuotes };
    });
  };

  const handleResolve = (
    quoteId: string,
    status: 'aceptado' | 'rechazado',
    motivo?: string,
    nota?: string
  ) => {
    setAppState((prev) => {
      const nextQuotes = prev.quotes.map((q) => {
        if (q.id === quoteId) {
          const updated = { ...q };
          updated.estado = status;
          updated.resuelto = today();
          updated.motivo = status === 'rechazado' ? motivo || '' : '';
          updated.nota = nota ? nota.trim() : '';
          addHistory(
            updated,
            status === 'aceptado'
              ? 'El cliente aceptó el presupuesto'
              : `El cliente rechazó el presupuesto${motivo ? ` (${motivo})` : ''}`
          );
          return updated;
        }
        return q;
      });
      return { ...prev, quotes: nextQuotes };
    });
    showToast(status === 'aceptado' ? 'Presupuesto aceptado' : 'Presupuesto rechazado');
  };

  const handleCancelQuote = (quoteId: string) => {
    setAppState((prev) => {
      const nextQuotes = prev.quotes.map((q) => {
        if (q.id === quoteId) {
          const updated = { ...q, estado: 'cancelado' as const };
          addHistory(updated, 'Presupuesto cancelado');
          return updated;
        }
        return q;
      });
      return { ...prev, quotes: nextQuotes };
    });
    showToast('Presupuesto cancelado');
  };

  const handleDeleteDraft = (quoteId: string) => {
    setAppState((prev) => ({
      ...prev,
      quotes: prev.quotes.filter((q) => q.id !== quoteId),
    }));
    showToast('Borrador eliminado');
    navigateTo('lista');
  };

  const handleClearExamples = () => {
    setAppState((prev) => ({
      ...prev,
      quotes: prev.quotes.filter((q) => !q.example),
    }));
    showToast('Ejemplos borrados');
    if (currentTab === 'det' && selectedQuoteId) {
      const exists = appState.quotes.some((q) => q.id === selectedQuoteId && !q.example);
      if (!exists) navigateTo('hoy');
    }
  };

  const handleRestoreBackup = (restoredState: AppState) => {
    setAppState(restoredState);
    showToast('Copia restaurada');
    navigateTo('hoy');
  };

  const handleUpdateSettings = (newSettings: Settings) => {
    setAppState((prev) => ({ ...prev, settings: newSettings }));
  };

  const hasExamples = appState.quotes.some((q) => q.example);
  const selectedQuote = selectedQuoteId
    ? appState.quotes.find((q) => q.id === selectedQuoteId)
    : null;

  return (
    <div className="wrap">
      <Header
        currentTab={currentTab}
        dueCount={dueCount}
        onSelectTab={(tab) => navigateTo(tab)}
        onNewQuote={handleNewQuote}
      />

      <Banner
        hasExamples={hasExamples}
        saveErr={saveErr}
        onClearExamples={handleClearExamples}
      />

      <main>
        {currentTab === 'hoy' && (
          <HoyView
            quotes={appState.quotes}
            settings={appState.settings}
            onOpenQuote={(id) => navigateTo('det', id)}
            onNewQuote={handleNewQuote}
            onCopyText={copyText}
            onFollowUpDone={handleFollowUpDone}
          />
        )}

        {currentTab === 'lista' && (
          <ListaView
            quotes={appState.quotes}
            currentFilter={listFilter}
            searchQuery={searchQuery}
            onSelectFilter={setListFilter}
            onSearchChange={setSearchQuery}
            onOpenQuote={(id) => navigateTo('det', id)}
          />
        )}

        {currentTab === 'stats' && <EstadisticasView quotes={appState.quotes} />}

        {currentTab === 'ajustes' && (
          <AjustesView
            appState={appState}
            onUpdateSettings={handleUpdateSettings}
            onRestoreBackup={handleRestoreBackup}
            onCopyText={copyText}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'edit' && editFormData && (
          <EditView
            initialData={editFormData}
            existingQuotes={appState.quotes}
            settings={appState.settings}
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
              settings={appState.settings}
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

      <footer className="foot">
        Los datos se guardan solo en este navegador. Haz una copia de seguridad en Ajustes antes de cambiar de dispositivo o borrar los datos del navegador.
      </footer>

      <Toast message={toastMsg} />
    </div>
  );
};
export default App;
