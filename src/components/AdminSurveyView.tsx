import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Download,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { SurveyResponse, UserSubscriptionProfile } from '../types';
import { fetchAdminSurveyData } from '../lib/firestoreService';
import {
  exportSurveyResponsesToCSV,
  SURVEY_ELIGIBILITY_DAYS,
  SURVEY_ELIGIBILITY_MS,
  SURVEY_LABELS,
} from '../utils/survey';

interface AdminSurveyViewProps {
  onBackToApp: () => void;
  currentUserEmail?: string | null;
}

export const AdminSurveyView: React.FC<AdminSurveyViewProps> = ({
  onBackToApp,
  currentUserEmail,
}) => {
  const [users, setUsers] = useState<UserSubscriptionProfile[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search in Responses list
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedResponseId, setExpandedResponseId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminSurveyData();
      setUsers(data.users);
      setResponses(data.responses);
    } catch (err: unknown) {
      console.error('Error fetching admin survey data:', err);
      setError(
        'Acceso restringido: Solo los administradores verificados en Firebase pueden consultar este panel o las reglas de Firestore han bloqueado la lectura.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute metrics from real Firestore documents
  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const now = Date.now();

    // Users with >= 21 days
    const eligibleUsers = users.filter((u) => {
      const regTime = new Date(u.createdAt || u.trialStartedAt).getTime();
      return !isNaN(regTime) && now - regTime >= SURVEY_ELIGIBILITY_MS;
    });
    const eligibleCount = eligibleUsers.length;

    const submittedCount = responses.length;
    const responseRate = eligibleCount > 0 ? ((submittedCount / eligibleCount) * 100).toFixed(1) : '0';

    // Disposición a pagar (Q5)
    const q5Counts: Record<string, number> = {
      contrataria: 0,
      probablemente: 0,
      dependeria: 0,
      probablemente_no: 0,
      no_pagaria: 0,
      no_valoro: 0,
      sin_respuesta: 0,
    };

    // Precios mensuales aceptados (Q5b)
    const q5bCounts: Record<string, number> = {
      menos_6: 0,
      '6_10': 0,
      '10_15': 0,
      '15_20': 0,
      mas_20: 0,
      no_pagaria: 0,
      no_se: 0,
      sin_respuesta: 0,
    };

    // Recomendación (Q7)
    let totalScore = 0;
    let scoredCount = 0;
    const scoreBuckets: Record<number, number> = {};
    for (let i = 0; i <= 10; i++) scoreBuckets[i] = 0;

    let promoters = 0; // 9-10
    let passives = 0; // 7-8
    let detractors = 0; // 0-6

    // Problemas resueltos (Q2)
    const problemCounts: Record<string, number> = {
      seguimiento: 0,
      recordar_contacto: 0,
      organizacion: 0,
      ahorro_tiempo: 0,
      ninguno: 0,
      otro: 0,
    };

    // Uso de PresuFollow (Q1)
    const q1Counts: Record<string, number> = {
      habitualmente: 0,
      algunas_veces: 0,
      apenas: 0,
      no_suficiente: 0,
      sin_respuesta: 0,
    };

    responses.forEach((r) => {
      const a = r.answers || {};

      // Q1
      if (a.q1_usage && q1Counts[a.q1_usage] !== undefined) {
        q1Counts[a.q1_usage]++;
      } else {
        q1Counts.sin_respuesta++;
      }

      // Q2
      if (Array.isArray(a.q2_problems)) {
        a.q2_problems.forEach((p) => {
          if (problemCounts[p] !== undefined) problemCounts[p]++;
        });
      }

      // Q5
      if (a.q5_willingnessToPay && q5Counts[a.q5_willingnessToPay] !== undefined) {
        q5Counts[a.q5_willingnessToPay]++;
      } else {
        q5Counts.sin_respuesta++;
      }

      // Q5b
      if (a.q5b_monthlyPrice && q5bCounts[a.q5b_monthlyPrice] !== undefined) {
        q5bCounts[a.q5b_monthlyPrice]++;
      } else {
        q5bCounts.sin_respuesta++;
      }

      // Q7 Score
      if (a.q7_recommendScore !== null && a.q7_recommendScore !== undefined) {
        const sc = a.q7_recommendScore;
        totalScore += sc;
        scoredCount++;
        if (scoreBuckets[sc] !== undefined) scoreBuckets[sc]++;
        if (sc >= 9) promoters++;
        else if (sc >= 7) passives++;
        else detractors++;
      }
    });

    const averageScore = scoredCount > 0 ? (totalScore / scoredCount).toFixed(1) : null;
    const nps =
      scoredCount > 0
        ? Math.round(((promoters - detractors) / scoredCount) * 100)
        : null;

    return {
      totalUsers,
      eligibleCount,
      submittedCount,
      responseRate,
      q1Counts,
      problemCounts,
      q5Counts,
      q5bCounts,
      scoreBuckets,
      averageScore,
      scoredCount,
      nps,
      promoters,
      passives,
      detractors,
    };
  }, [users, responses]);

  // Filtered responses for individual list
  const filteredResponses = useMemo(() => {
    if (!searchFilter.trim()) return responses;
    const term = searchFilter.toLowerCase();
    return responses.filter((r) => {
      const email = (r.userEmail || '').toLowerCase();
      const id = r.userId.toLowerCase();
      const mostValued = (r.answers?.q3_mostValued || '').toLowerCase();
      const leastLiked = (r.answers?.q4_leastLiked || '').toLowerCase();
      const requested = (r.answers?.q6_requestedFeatures || '').toLowerCase();
      const otherProb = (r.answers?.q2_problemOther || '').toLowerCase();
      return (
        email.includes(term) ||
        id.includes(term) ||
        mostValued.includes(term) ||
        leastLiked.includes(term) ||
        requested.includes(term) ||
        otherProb.includes(term)
      );
    });
  }, [responses, searchFilter]);

  const toggleExpand = (id: string) => {
    setExpandedResponseId(expandedResponseId === id ? null : id);
  };

  const handleExportCSV = () => {
    if (!responses.length) return;
    exportSurveyResponsesToCSV(responses);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header with Back Button and Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-quiet sm"
            onClick={onBackToApp}
            title="Volver a Presupuestos"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} />
            <span>Volver a la app</span>
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Panel de Encuestas (21 días)</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span className="chip chip-aceptado" style={{ fontSize: '0.74rem' }}>
                <ShieldCheck size={12} style={{ display: 'inline', marginRight: '3px' }} />
                Administrador verificado
              </span>
              {currentUserEmail && (
                <span className="muted" style={{ fontSize: '0.82rem' }}>
                  {currentUserEmail}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn sm"
            onClick={loadData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Recargar datos de Firestore"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            className="btn btn-primary sm"
            onClick={handleExportCSV}
            disabled={responses.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {error ? (
        <div
          className="banner"
          style={{
            background: 'var(--bad-soft)',
            color: 'var(--bad)',
            borderColor: 'var(--bad)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <AlertTriangle size={18} />
            <span>Aviso de seguridad</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{error}</p>
          <button
            type="button"
            className="btn sm"
            onClick={loadData}
            style={{ marginTop: '4px' }}
          >
            Reintentar
          </button>
        </div>
      ) : loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <div className="brand" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
            Presu<span>Follow</span>
          </div>
          <p className="hint">Consultando datos reales de Firebase Firestore...</p>
        </div>
      ) : (
        <>
          {/* 1. KPI Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            {/* Total registered users */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '0.86rem' }}>
                <Users size={16} />
                <span>Usuarios registrados</span>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 700, margin: '6px 0 2px' }}>
                {metrics.totalUsers}
              </div>
              <span className="sub muted" style={{ fontSize: '0.8rem' }}>
                Cuentas totales en Firestore
              </span>
            </div>

            {/* Eligible users (>= 21 days) */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '0.86rem' }}>
                <Calendar size={16} />
                <span>Usuarios con +21 días</span>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 700, margin: '6px 0 2px' }}>
                {metrics.eligibleCount}
              </div>
              <span className="sub muted" style={{ fontSize: '0.8rem' }}>
                Elegibles para recibir la encuesta
              </span>
            </div>

            {/* Total surveys submitted */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '0.86rem' }}>
                <CheckCircle2 size={16} color="var(--ok)" />
                <span>Encuestas respondidas</span>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 700, margin: '6px 0 2px', color: 'var(--ok)' }}>
                {metrics.submittedCount}
              </div>
              <span className="sub muted" style={{ fontSize: '0.8rem' }}>
                Respuestas registradas
              </span>
            </div>

            {/* Response Rate */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '0.86rem' }}>
                <TrendingUp size={16} color="var(--accent)" />
                <span>Tasa de respuesta</span>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 700, margin: '6px 0 2px', color: 'var(--accent)' }}>
                {metrics.responseRate} %
              </div>
              <span className="sub muted" style={{ fontSize: '0.8rem' }}>
                Sobre usuarios elegibles (+21d)
              </span>
            </div>
          </div>

          {/* 2. Charts & Distributions Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Chart: Disposición a pagar cuota mensual (Q5) */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '14px' }}>
                Disposición a contratar cuota mensual (P5)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { key: 'contrataria', label: 'Lo contrataría', color: 'var(--ok, #10B981)' },
                  { key: 'probablemente', label: 'Probablemente lo contrataría', color: 'var(--accent, #0B6E5D)' },
                  { key: 'dependeria', label: 'Dependería de funciones y precio', color: 'var(--pending, #C26700)' },
                  { key: 'probablemente_no', label: 'Probablemente dejaría de usarlo', color: 'var(--warn, #B45309)' },
                  { key: 'no_pagaria', label: 'No pagaría por esta herramienta', color: 'var(--bad, #A3302A)' },
                  { key: 'no_valoro', label: 'Todavía no puedo valorarlo', color: 'var(--muted, #6B7280)' },
                ].map((item) => {
                  const count = metrics.q5Counts[item.key] || 0;
                  const total = metrics.submittedCount || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                        <span>{item.label}</span>
                        <span style={{ fontWeight: 600 }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: '8px',
                          background: 'var(--surface-2)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid var(--line)',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: item.color,
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart: Precios mensuales aceptados (Q5b) */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '14px' }}>
                Precios mensuales aceptados (P5b)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { key: 'menos_6', label: 'Menos de 6 €/mes' },
                  { key: '6_10', label: '6 € – 10 €/mes' },
                  { key: '10_15', label: '10 € – 15 €/mes' },
                  { key: '15_20', label: '15 € – 20 €/mes' },
                  { key: 'mas_20', label: 'Más de 20 €/mes' },
                  { key: 'no_pagaria', label: 'No pagaría' },
                  { key: 'no_se', label: 'No lo sé / Indiferente' },
                ].map((item) => {
                  const count = metrics.q5bCounts[item.key] || 0;
                  const total = metrics.submittedCount || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                        <span>{item.label}</span>
                        <span style={{ fontWeight: 600 }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: '8px',
                          background: 'var(--surface-2)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid var(--line)',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: 'var(--accent)',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart: Puntuación de recomendación (NPS) */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Recomendación a otros autónomos (P7)</h3>
                {metrics.averageScore && (
                  <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--ink)' }}>
                    {metrics.averageScore} <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 400 }}>/ 10</span>
                  </span>
                )}
              </div>

              {/* NPS breakdown */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '14px',
                  background: 'var(--surface-2)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  justifyContent: 'space-around',
                }}
              >
                <div>
                  <span style={{ color: 'var(--ok)', fontWeight: 700 }}>Promotores (9-10):</span>{' '}
                  {metrics.promoters}
                </div>
                <div>
                  <span style={{ color: 'var(--pending)', fontWeight: 700 }}>Pasivos (7-8):</span>{' '}
                  {metrics.passives}
                </div>
                <div>
                  <span style={{ color: 'var(--bad)', fontWeight: 700 }}>Detractores (0-6):</span>{' '}
                  {metrics.detractors}
                </div>
              </div>

              {/* Score distribution histogram (0 to 10) */}
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '100px', gap: '4px', padding: '0 4px' }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sc) => {
                  const count = metrics.scoreBuckets[sc] || 0;
                  const maxCount = Math.max(1, ...Object.values(metrics.scoreBuckets));
                  const heightPct = Math.round((count / maxCount) * 100);
                  const color = sc >= 9 ? 'var(--ok)' : sc >= 7 ? 'var(--pending)' : 'var(--bad)';

                  return (
                    <div
                      key={sc}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                        {count > 0 ? count : ''}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          height: `${Math.max(4, heightPct)}%`,
                          background: count > 0 ? color : 'var(--line)',
                          borderRadius: '2px 2px 0 0',
                          transition: 'height 0.3s ease',
                        }}
                        title={`Puntuación ${sc}: ${count} respuestas`}
                      />
                      <span style={{ fontSize: '0.74rem', fontWeight: 600 }}>{sc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart: Problemas que ha ayudado a resolver (Q2) */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '14px' }}>
                Problemas resueltos con PresuFollow (P2)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { key: 'seguimiento', label: 'Seguimiento de presupuestos enviados' },
                  { key: 'recordar_contacto', label: 'Recordar cuándo contactar al cliente' },
                  { key: 'organizacion', label: 'Presupuestos mejor organizados' },
                  { key: 'ahorro_tiempo', label: 'Ahorro de tiempo administrativo' },
                  { key: 'ninguno', label: 'Ninguno por ahora' },
                  { key: 'otro', label: 'Otro problema especificado' },
                ].map((item) => {
                  const count = metrics.problemCounts[item.key] || 0;
                  const total = metrics.submittedCount || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                        <span>{item.label}</span>
                        <span style={{ fontWeight: 600 }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: '8px',
                          background: 'var(--surface-2)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid var(--line)',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: 'var(--ok)',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Individual Responses Table with Free Text Review */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  Listado de respuestas individuales ({filteredResponses.length})
                </h3>
                <span className="sub muted" style={{ fontSize: '0.82rem' }}>
                  Pulsa en cualquier respuesta para leer los comentarios de texto libre
                </span>
              </div>

              {/* Search filter */}
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Buscar en comentarios o emails..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 32px',
                    fontSize: '0.86rem',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface-2)',
                  }}
                />
              </div>
            </div>

            {filteredResponses.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                No hay respuestas que coincidan con el filtro actual.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Fecha y Hora</th>
                      <th style={{ padding: '10px 14px' }}>Usuario</th>
                      <th style={{ padding: '10px 14px' }}>Uso</th>
                      <th style={{ padding: '10px 14px' }}>Pagaría cuota</th>
                      <th style={{ padding: '10px 14px' }}>Precio aceptado</th>
                      <th style={{ padding: '10px 14px' }}>Recomendación</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Comentarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResponses.map((r) => {
                      const a = r.answers || {};
                      const isExpanded = expandedResponseId === r.id;
                      const hasComments =
                        a.q3_mostValued ||
                        a.q4_leastLiked ||
                        a.q6_requestedFeatures ||
                        a.q2_problemOther;

                      const formattedDate = new Date(r.submittedAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <React.Fragment key={r.id}>
                          <tr
                            style={{
                              borderBottom: '1px solid var(--line)',
                              cursor: 'pointer',
                              background: isExpanded ? 'var(--surface-2)' : 'transparent',
                            }}
                            onClick={() => toggleExpand(r.id)}
                          >
                            <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                              {formattedDate}
                            </td>
                            <td style={{ padding: '10px 14px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <span style={{ fontWeight: 600 }}>
                                {r.userEmail || `ID: ${r.userId.slice(0, 8)}...`}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span className="chip" style={{ fontSize: '0.78rem', padding: '2px 6px' }}>
                                {SURVEY_LABELS.q1[a.q1_usage] || a.q1_usage || '—'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span
                                className={`chip ${
                                  a.q5_willingnessToPay === 'contrataria' || a.q5_willingnessToPay === 'probablemente'
                                    ? 'chip-aceptado'
                                    : a.q5_willingnessToPay === 'no_pagaria'
                                    ? 'chip-rechazado'
                                    : 'chip-pausa'
                                }`}
                                style={{ fontSize: '0.78rem', padding: '2px 6px' }}
                              >
                                {SURVEY_LABELS.q5[a.q5_willingnessToPay] || a.q5_willingnessToPay || '—'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              {SURVEY_LABELS.q5b[a.q5b_monthlyPrice || ''] || a.q5b_monthlyPrice || '—'}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                              {a.q7_recommendScore !== null && a.q7_recommendScore !== undefined ? (
                                <span
                                  style={{
                                    color:
                                      a.q7_recommendScore >= 9
                                        ? 'var(--ok)'
                                        : a.q7_recommendScore >= 7
                                        ? 'var(--pending)'
                                        : 'var(--bad)',
                                  }}
                                >
                                  {a.q7_recommendScore} / 10
                                </span>
                              ) : (
                                <span className="muted">Omitida</span>
                              )}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn-quiet sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <span>{hasComments ? 'Ver detalle' : 'Sin texto'}</span>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Comments Panel */}
                          {isExpanded && (
                            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                              <td colSpan={7} style={{ padding: '14px 20px' }}>
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                    gap: '14px',
                                    background: 'var(--surface)',
                                    padding: '14px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--line)',
                                  }}
                                >
                                  {/* P3 */}
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--accent)', marginBottom: '4px' }}>
                                      P3. Lo que más valora:
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.88rem', fontStyle: a.q3_mostValued ? 'normal' : 'italic', color: a.q3_mostValued ? 'var(--ink)' : 'var(--muted)' }}>
                                      {a.q3_mostValued || 'No especificó comentarios.'}
                                    </p>
                                  </div>

                                  {/* P4 */}
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--bad)', marginBottom: '4px' }}>
                                      P4. Menos gusta o dificultades:
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.88rem', fontStyle: a.q4_leastLiked ? 'normal' : 'italic', color: a.q4_leastLiked ? 'var(--ink)' : 'var(--muted)' }}>
                                      {a.q4_leastLiked || 'No especificó dificultades.'}
                                    </p>
                                  </div>

                                  {/* P6 */}
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--ok)', marginBottom: '4px' }}>
                                      P6. Funcionalidades pedidas:
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.88rem', fontStyle: a.q6_requestedFeatures ? 'normal' : 'italic', color: a.q6_requestedFeatures ? 'var(--ink)' : 'var(--muted)' }}>
                                      {a.q6_requestedFeatures || 'No solicitó nuevas funciones.'}
                                    </p>
                                  </div>

                                  {/* P2 Problems and Other detail */}
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--ink)', marginBottom: '4px' }}>
                                      P2. Problemas marcados:
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--muted)' }}>
                                      {Array.isArray(a.q2_problems) && a.q2_problems.length > 0
                                        ? a.q2_problems.map((p) => SURVEY_LABELS.q2[p] || p).join(', ')
                                        : 'Ninguno marcado.'}
                                      {a.q2_problemOther ? ` (Detalle otro: "${a.q2_problemOther}")` : ''}
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
