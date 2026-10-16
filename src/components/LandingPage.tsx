import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Send,
  TrendingUp,
  Calendar,
  Users,
  FileText,
  ChevronDown,
  Menu,
  X,
  MessageSquare,
  Mail,
  Zap,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (route: string) => void;
  isAuthenticated: boolean;
  userEmail?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  isAuthenticated,
  userEmail,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [legalModal, setLegalModal] = useState<string | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: '¿Qué es PresuFollow?',
      a: 'PresuFollow es una herramienta web pensada para autónomos y pequeñas empresas que necesitan elaborar presupuestos comerciales, saber en todo momento cuáles siguen pendientes de respuesta y organizar sus contactos de seguimiento para no perder ventas.',
    },
    {
      q: '¿Para quién está pensado?',
      a: 'Para profesionales de reformas, instaladores, técnicos, diseñadores, asesores y cualquier pequeño negocio que cotiza servicios y quiere dejar de perder clientes por falta de seguimiento comercial.',
    },
    {
      q: '¿Cómo puedo empezar?',
      a: 'Solo tienes que pulsar en «Probar gratis», registrarte con tu correo o cuenta de Google y podrás crear y enviar tu primer presupuesto en menos de dos minutos.',
    },
    {
      q: '¿Necesito instalar algún programa?',
      a: 'No. PresuFollow es una aplicación web responsive. Funciona directamente en cualquier navegador moderno desde tu ordenador, tableta o teléfono móvil.',
    },
    {
      q: '¿Cómo puedo acceder a mis datos?',
      a: 'Tus presupuestos y ajustes se sincronizan de forma privada y segura con tu cuenta en Firebase Firestore. Además, desde el panel de Ajustes puedes exportar una copia de seguridad completa en formato JSON cuando lo desees.',
    },
    {
      q: '¿Cuánto cuesta?',
      a: 'El precio previsto es de 12 €/mes sin permanencia. Durante esta fase de lanzamiento, dispones de una prueba gratuita completa de 14 días para evaluar el producto sin coste.',
    },
    {
      q: '¿Cómo funciona la prueba gratuita?',
      a: 'Tienes acceso total e inmediato a todas las funciones durante 14 días. No solicitamos datos de tarjeta bancaria al registrarte ni existen cargos automáticos sorpresa.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. CABECERA */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          className="wrap"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={() => onNavigate('/')}
          >
            <div className="brand" style={{ fontSize: '1.45rem', userSelect: 'none' }}>
              Presu<span>Follow</span>
            </div>
            <span
              className="chip chip-enviado"
              style={{ fontSize: '0.72rem', padding: '1px 7px' }}
            >
              Comercial
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '24px',
            }}
            className="desktop-nav"
          >
            <button
              type="button"
              className="btn-quiet"
              style={{ fontSize: '0.92rem', cursor: 'pointer' }}
              onClick={() => scrollToSection('como-funciona')}
            >
              Cómo funciona
            </button>
            <button
              type="button"
              className="btn-quiet"
              style={{ fontSize: '0.92rem', cursor: 'pointer' }}
              onClick={() => scrollToSection('funcionalidades')}
            >
              Funcionalidades
            </button>
            <button
              type="button"
              className="btn-quiet"
              style={{ fontSize: '0.92rem', cursor: 'pointer' }}
              onClick={() => scrollToSection('precios')}
            >
              Precios
            </button>
            <button
              type="button"
              className="btn-quiet"
              style={{ fontSize: '0.92rem', cursor: 'pointer' }}
              onClick={() => scrollToSection('faq')}
            >
              Preguntas
            </button>
          </nav>

          {/* Desktop Action Buttons */}
          <div
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '10px',
            }}
            className="desktop-actions"
          >
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onNavigate('/app')}
                >
                  Ir a mi aplicación <ArrowRight size={15} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn"
                  onClick={() => onNavigate('/login')}
                  style={{ fontSize: '0.9rem' }}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onNavigate('/register')}
                  style={{ fontSize: '0.9rem' }}
                >
                  Probar gratis
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="btn btn-quiet mobile-menu-btn"
            style={{ padding: '6px' }}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              background: 'var(--surface)',
              borderBottom: '1px solid var(--line)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <button
              type="button"
              className="btn btn-quiet"
              style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              onClick={() => scrollToSection('como-funciona')}
            >
              Cómo funciona
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              onClick={() => scrollToSection('funcionalidades')}
            >
              Funcionalidades
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              onClick={() => scrollToSection('precios')}
            >
              Precios
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              onClick={() => scrollToSection('faq')}
            >
              Preguntas frecuentes
            </button>

            <div
              style={{
                borderTop: '1px solid var(--line)',
                paddingTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {isAuthenticated ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('/app');
                  }}
                >
                  Ir a mi aplicación <ArrowRight size={16} />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn"
                    style={{ width: '100%' }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('/login');
                    }}
                  >
                    Iniciar sesión
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('/register');
                    }}
                  >
                    Probar gratis 14 días
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. PORTADA PRINCIPAL (HERO) */}
      <section
        style={{
          padding: '48px 16px 36px',
          background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div className="wrap">
          <div
            style={{
              display: 'grid',
              gap: '36px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              alignItems: 'center',
            }}
          >
            {/* Hero Copy */}
            <div>
              <div
                className="chip chip-enviado"
                style={{
                  marginBottom: '16px',
                  padding: '4px 10px',
                  fontSize: '0.82rem',
                }}
              >
                Seguimiento comercial para autónomos y micropymes
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2.1rem, 4.2vw, 3.2rem)',
                  lineHeight: 1.12,
                  letterSpacing: '-0.025em',
                  marginBottom: '18px',
                }}
              >
                No dejes tus presupuestos en el olvido.
              </h1>

              <p
                className="muted"
                style={{
                  fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
                  lineHeight: 1.48,
                  marginBottom: '26px',
                }}
              >
                Envía presupuestos, controla cuáles siguen pendientes y organiza su seguimiento
                desde un solo lugar.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      padding: '12px 22px',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      boxShadow: '0 4px 14px rgba(11,110,93,0.25)',
                    }}
                    onClick={() => onNavigate(isAuthenticated ? '/app' : '/register')}
                  >
                    {isAuthenticated ? 'Abrir PresuFollow' : 'Probar gratis 14 días'}
                    <ArrowRight size={18} />
                  </button>

                  {!isAuthenticated && (
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '12px 18px', fontSize: '0.98rem' }}
                      onClick={() => onNavigate('/login')}
                    >
                      Iniciar sesión
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    fontSize: '0.86rem',
                    color: 'var(--muted)',
                    marginTop: '4px',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldCheck size={16} color="var(--ok)" /> Sin tarjeta bancaria
                  </span>
                  <span>•</span>
                  <span>Configuración en 1 minuto</span>
                </div>
              </div>
            </div>

            {/* Hero Real UI Mockup / Visual Composition */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 12px 36px rgba(0,0,0,0.08)',
                position: 'relative',
              }}
            >
              {/* Mockup Topbar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--line)',
                  paddingBottom: '12px',
                  marginBottom: '16px',
                }}
              >
                <div className="brand" style={{ fontSize: '1.1rem' }}>
                  Presu<span>Follow</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className="chip chip-enviado">2 Pendientes</span>
                  <span className="badge">1 hoy</span>
                </div>
              </div>

              {/* Mockup Strip Card */}
              <div
                className="strip"
                style={{ marginBottom: '14px', gridTemplateColumns: '1fr 1fr' }}
              >
                <div>
                  <div className="k">Pendientes de respuesta</div>
                  <div className="v num">2</div>
                  <div className="s num">5.747,50 € presupuestados</div>
                </div>
                <div>
                  <div className="k">Para contactar hoy</div>
                  <div className="v num" style={{ color: 'var(--pending)' }}>
                    1
                  </div>
                  <div className="s">Toca 2º seguimiento</div>
                </div>
              </div>

              {/* Mockup Item with Follow-up Action */}
              <div
                className="card"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>Cristina Morales</div>
                    <div className="sub" style={{ fontSize: '0.85rem' }}>
                      PF-0004 · Reforma de baño principal
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="num" style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                      4.235,00 €
                    </div>
                    <span className="chip chip-enviado">Pendiente de respuesta</span>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--pending-soft)',
                    color: 'var(--pending)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '0.84rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>🔔 Toca hoy · Seguimiento a los 7 días</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span
                      style={{
                        background: 'var(--surface)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      WhatsApp
                    </span>
                    <span
                      style={{
                        background: 'var(--surface)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      Email
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                  fontSize: '0.82rem',
                  color: 'var(--muted)',
                }}
              >
                <span>Sincronizado en tiempo real con Firebase</span>
                <span className="chip chip-aceptado">Aceptado 78 %</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEMA Y SOLUCIÓN */}
      <section style={{ padding: '64px 16px', background: 'var(--surface)' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 44px' }}>
            <h2 style={{ fontSize: '1.9rem', marginBottom: '12px' }}>
              El reto diario al enviar presupuestos
            </h2>
            <p className="muted" style={{ fontSize: '1.05rem', lineHeight: 1.5 }}>
              Muchos presupuestos se pierden no por el precio ni por la calidad del trabajo, sino por
              no contactar a tiempo con el cliente antes de que tome otra decisión.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '20px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            }}
          >
            <div
              className="card"
              style={{
                padding: '22px',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'var(--bad-soft)',
                  color: 'var(--bad)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={20} />
              </div>
              <h3 style={{ fontSize: '1.15rem' }}>Perder de vista presupuestos enviados</h3>
              <p className="muted" style={{ fontSize: '0.92rem' }}>
                Con el ajetreo diario es fácil olvidar a quién se le envió presupuesto la semana
                pasada.
              </p>
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--line)',
                  fontSize: '0.86rem',
                  color: 'var(--accent)',
                  fontWeight: 600,
                }}
              >
                Solución PresuFollow: Panel de «Hoy» con avisos automáticos según los días
                configurados.
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: '22px',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'var(--pending-soft)',
                  color: 'var(--pending)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={20} />
              </div>
              <h3 style={{ fontSize: '1.15rem' }}>Olvidar cuáles siguen pendientes</h3>
              <p className="muted" style={{ fontSize: '0.92rem' }}>
                Hojas de cálculo desactualizadas o notas en papel impiden saber qué dinero está en el
                aire.
              </p>
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--line)',
                  fontSize: '0.86rem',
                  color: 'var(--accent)',
                  fontWeight: 600,
                }}
              >
                Solución PresuFollow: Filtros por estado (Pendientes, Vencidos, Aceptados y
                Rechazados).
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: '22px',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageSquare size={20} />
              </div>
              <h3 style={{ fontSize: '1.15rem' }}>Dedicar tiempo a redactar mensajes</h3>
              <p className="muted" style={{ fontSize: '0.92rem' }}>
                Pensar qué decir o buscar el número de teléfono retrasa el momento de hacer la
                llamada.
              </p>
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--line)',
                  fontSize: '0.86rem',
                  color: 'var(--accent)',
                  fontWeight: 600,
                }}
              >
                Solución PresuFollow: Mensajes preconfigurados en un clic para WhatsApp y correo.
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: '22px',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'var(--ok-soft)',
                  color: 'var(--ok)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={20} />
              </div>
              <h3 style={{ fontSize: '1.15rem' }}>Información dispersa de clientes</h3>
              <p className="muted" style={{ fontSize: '0.92rem' }}>
                Teléfonos en la agenda personal, condiciones en mensajes sueltos y detalles
                incompletos.
              </p>
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--line)',
                  fontSize: '0.86rem',
                  color: 'var(--accent)',
                  fontWeight: 600,
                }}
              >
                Solución PresuFollow: Ficha de cliente, historial de llamadas y notas internas en un
                solo lugar.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FUNCIONALIDADES (EXCLUSIVAMENTE LAS IMPLEMENTADAS) */}
      <section
        id="funcionalidades"
        style={{ padding: '64px 16px', background: 'var(--bg)', borderTop: '1px solid var(--line)' }}
      >
        <div className="wrap">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 44px' }}>
            <h2 style={{ fontSize: '1.9rem', marginBottom: '10px' }}>
              Funcionalidades reales y operativas
            </h2>
            <p className="muted" style={{ fontSize: '1.02rem' }}>
              Cada herramienta está diseñada para ahorrar tiempo en la gestión comercial diaria de tu
              actividad.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '20px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            {/* Feature 1 */}
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  <FileText size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem' }}>Crear y editar presupuestos</h3>
              </div>
              <p className="muted" style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
                Desglose rápido de conceptos, cantidades, precios y porcentajes de descuento. Cálculo
                automático de la base imponible y tipos de IVA (21 %, 10 %, 4 % o 0 %).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'var(--ok-soft)',
                    color: 'var(--ok)',
                  }}
                >
                  <Users size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem' }}>Gestión de clientes y autocompletado</h3>
              </div>
              <p className="muted" style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
                Al escribir el nombre de un cliente ya existente, PresuFollow autocompleta su teléfono
                y correo electrónico para que no tengas que buscarlos de nuevo.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  <Send size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem' }}>Envío directo por WhatsApp y Email</h3>
              </div>
              <p className="muted" style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
                Genera mensajes listos para enviar al instante por WhatsApp o cliente de correo con el
                número de presupuesto, trabajo e importe desglosado.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'var(--pending-soft)',
                    color: 'var(--pending)',
                  }}
                >
                  <Calendar size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem' }}>Programación de seguimientos</h3>
              </div>
              <p className="muted" style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
                Elige los días de contacto (por ejemplo, a los 3, 7 y 14 días). El sistema programa
                las alertas y te muestra en «Hoy» a quién debes contactar.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'var(--surface-2)',
                    color: 'var(--ink)',
                  }}
                >
                  <Zap size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem' }}>Control exhaustivo de estados</h3>
              </div>
              <p className="muted" style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
                Chips visuales para distinguir borradores, pendientes de respuesta, vencidos,
                aceptados, rechazados y en pausa, con registro cronológico de eventos.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'var(--ok-soft)',
                    color: 'var(--ok)',
                  }}
                >
                  <TrendingUp size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem' }}>Estadísticas y motivos de rechazo</h3>
              </div>
              <p className="muted" style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
                Gráfico de reparto económico presupuestado, tasa de aceptación, tiempo medio de
                decisión y desglose de motivos por los que un cliente no acepta.
              </p>
            </div>
          </div>

          {/* Honest Note About Future Features */}
          <div
            style={{
              marginTop: '32px',
              padding: '16px 20px',
              background: 'var(--surface)',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              fontSize: '0.88rem',
              color: 'var(--muted)',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <ShieldCheck size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
            <div>
              <strong>Transparencia funcional:</strong> En la versión actual los presupuestos se envían y
              comparten mediante mensaje detallado por WhatsApp y correo electrónico. La generación de
              archivos descargables en PDF y la firma electrónica están previstas para próximas
              actualizaciones.
            </div>
          </div>
        </div>
      </section>

      {/* 5. CÓMO FUNCIONA */}
      <section
        id="como-funciona"
        style={{ padding: '64px 16px', background: 'var(--surface)', borderTop: '1px solid var(--line)' }}
      >
        <div className="wrap">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 44px' }}>
            <h2 style={{ fontSize: '1.9rem', marginBottom: '10px' }}>
              Cómo funciona PresuFollow
            </h2>
            <p className="muted" style={{ fontSize: '1.02rem' }}>
              Un método sencillo en tres pasos para tener el control de cada cotización comercial.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '24px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              position: 'relative',
            }}
          >
            {/* Step 1 */}
            <div
              className="card"
              style={{
                padding: '24px',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'var(--accent-ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  fontFamily: 'var(--f-display)',
                }}
              >
                1
              </div>
              <h3 style={{ fontSize: '1.2rem' }}>Crea y prepara tu presupuesto</h3>
              <p className="muted" style={{ fontSize: '0.94rem', lineHeight: 1.5 }}>
                Indica los datos del cliente, añade las líneas de trabajo y las condiciones de pago.
                PresuFollow calcula subtotales, IVA y total de forma automática.
              </p>
            </div>

            {/* Step 2 */}
            <div
              className="card"
              style={{
                padding: '24px',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'var(--accent-ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  fontFamily: 'var(--f-display)',
                }}
              >
                2
              </div>
              <h3 style={{ fontSize: '1.2rem' }}>Envíalo a tu cliente</h3>
              <p className="muted" style={{ fontSize: '0.94rem', lineHeight: 1.5 }}>
                Utiliza las acciones rápidas para abrir WhatsApp o tu cliente de correo con el texto
                redactado y profesional. El presupuesto pasa a estado «Enviado».
              </p>
            </div>

            {/* Step 3 */}
            <div
              className="card"
              style={{
                padding: '24px',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'var(--accent-ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  fontFamily: 'var(--f-display)',
                }}
              >
                3
              </div>
              <h3 style={{ fontSize: '1.2rem' }}>Controla su estado y seguimiento</h3>
              <p className="muted" style={{ fontSize: '0.94rem', lineHeight: 1.5 }}>
                La aplicación te avisará en la pestaña «Hoy» cuando llegue el día del recordatorio.
                Marca el contacto como realizado o registra la aceptación definitiva.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRECIOS (PROPUESTA CONFIGURABLE) */}
      <section
        id="precios"
        style={{ padding: '64px 16px', background: 'var(--bg)', borderTop: '1px solid var(--line)' }}
      >
        <div className="wrap">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' }}>
            <span
              className="chip chip-enviado"
              style={{ marginBottom: '12px', padding: '3px 10px', fontSize: '0.82rem' }}
            >
              Tarifa prevista
            </span>
            <h2 style={{ fontSize: '1.9rem', marginBottom: '10px' }}>
              Planes claros y sin permanencia
            </h2>
            <p className="muted" style={{ fontSize: '1.02rem' }}>
              Precios propuestos para autónomos y pequeños negocios, pendientes de validación
              comercial.
            </p>
          </div>

          <div style={{ maxWidth: '440px', margin: '0 auto' }}>
            <div
              className="card"
              style={{
                padding: '32px 28px',
                border: '2px solid var(--accent)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '24px',
                  background: 'var(--accent)',
                  color: 'var(--accent-ink)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '3px 12px',
                  borderRadius: '99px',
                }}
              >
                Prueba 14 días gratis
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '4px' }}>Plan Profesional</h3>
                <p className="muted" style={{ fontSize: '0.88rem' }}>
                  Todo lo necesario para organizar tus presupuestos y conseguir más cierres.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span
                  style={{
                    fontFamily: 'var(--f-display)',
                    fontSize: '2.8rem',
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                  className="num"
                >
                  12 €
                </span>
                <span className="muted" style={{ fontSize: '0.95rem' }}>
                  / mes (sin permanencia)
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '0.92rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="var(--ok)" />
                  <span>Presupuestos y clientes ilimitados</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="var(--ok)" />
                  <span>Alertas diarias de seguimiento en «Hoy»</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="var(--ok)" />
                  <span>Plantillas rápidas para WhatsApp y Email</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="var(--ok)" />
                  <span>Estadísticas de aceptación y motivos de rechazo</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="var(--ok)" />
                  <span>Copia de seguridad y exportación JSON</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="var(--ok)" />
                  <span>Sincronización en la nube con Firebase</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  marginTop: '8px',
                }}
                onClick={() => onNavigate(isAuthenticated ? '/app' : '/register')}
              >
                {isAuthenticated ? 'Acceder a mi cuenta' : 'Probar gratis 14 días'}
              </button>

              <div
                style={{
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--muted)',
                  lineHeight: 1.4,
                }}
              >
                Sin tarjeta bancaria requerida en el registro actual. Precio configurable para
                validación de mercado.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PREGUNTAS FRECUENTES (FAQ) */}
      <section
        id="faq"
        style={{ padding: '64px 16px', background: 'var(--surface)', borderTop: '1px solid var(--line)' }}
      >
        <div className="wrap" style={{ maxWidth: '780px' }}>
          <div style={{ textAlign: 'center', marginBottom: '38px' }}>
            <h2 style={{ fontSize: '1.9rem', marginBottom: '8px' }}>Preguntas frecuentes</h2>
            <p className="muted" style={{ fontSize: '1.02rem' }}>
              Respuestas claras a las dudas más habituales sobre PresuFollow.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.98rem',
                      color: 'var(--ink)',
                    }}
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                        marginLeft: '12px',
                        color: 'var(--muted)',
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 18px 16px',
                        fontSize: '0.92rem',
                        lineHeight: 1.55,
                        color: 'var(--muted)',
                        borderTop: '1px solid var(--line)',
                        paddingTop: '12px',
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. LLAMADA A LA ACCIÓN FINAL */}
      <section
        style={{
          padding: '64px 16px',
          background: 'var(--accent-soft)',
          borderTop: '1px solid var(--line)',
          textAlign: 'center',
        }}
      >
        <div className="wrap" style={{ maxWidth: '640px' }}>
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)',
              marginBottom: '14px',
              color: 'var(--accent)',
            }}
          >
            Empieza a gestionar tus presupuestos de forma más organizada.
          </h2>
          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--ink)',
              marginBottom: '26px',
              lineHeight: 1.45,
            }}
          >
            Asegura el seguimiento de cada propuesta y convierte más presupuestos en trabajos
            aceptados.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            style={{
              padding: '13px 28px',
              fontSize: '1.05rem',
              fontWeight: 700,
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(11,110,93,0.3)',
            }}
            onClick={() => onNavigate(isAuthenticated ? '/app' : '/register')}
          >
            {isAuthenticated ? 'Abrir mi aplicación' : 'Probar PresuFollow'}
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* 9. PIE DE PÁGINA */}
      <footer
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--line)',
          padding: '48px 16px 24px',
          marginTop: 'auto',
          fontSize: '0.88rem',
        }}
      >
        <div className="wrap">
          <div
            style={{
              display: 'grid',
              gap: '32px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              marginBottom: '36px',
            }}
          >
            {/* Column 1: Brand */}
            <div>
              <div className="brand" style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
                Presu<span>Follow</span>
              </div>
              <p className="muted" style={{ lineHeight: 1.45, marginBottom: '12px' }}>
                Herramienta de seguimiento de presupuestos y gestión comercial de propuestas para
                autónomos y pequeñas empresas.
              </p>
              <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                Desarrollado con Firebase & TypeScript.
              </div>
            </div>

            {/* Column 2: Navigation */}
            <div>
              <div style={{ fontWeight: 700, marginBottom: '12px' }}>Navegación</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-quiet"
                  style={{ textAlign: 'left', padding: 0 }}
                  onClick={() => scrollToSection('como-funciona')}
                >
                  Cómo funciona
                </button>
                <button
                  type="button"
                  className="btn-quiet"
                  style={{ textAlign: 'left', padding: 0 }}
                  onClick={() => scrollToSection('funcionalidades')}
                >
                  Funcionalidades
                </button>
                <button
                  type="button"
                  className="btn-quiet"
                  style={{ textAlign: 'left', padding: 0 }}
                  onClick={() => scrollToSection('precios')}
                >
                  Precios
                </button>
                <button
                  type="button"
                  className="btn-quiet"
                  style={{ textAlign: 'left', padding: 0 }}
                  onClick={() => scrollToSection('faq')}
                >
                  Preguntas frecuentes
                </button>
                <button
                  type="button"
                  className="btn-quiet"
                  style={{ textAlign: 'left', padding: 0, color: 'var(--accent)', fontWeight: 600 }}
                  onClick={() => onNavigate('/app')}
                >
                  Acceder a la aplicación
                </button>
              </div>
            </div>

            {/* Column 3: Contact and Legal */}
            <div>
              <div style={{ fontWeight: 700, marginBottom: '12px' }}>Legal y Contacto</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-quiet"
                  style={{ textAlign: 'left', padding: 0 }}
                  onClick={() => setLegalModal('contacto')}
                >
                  Contacto comercial
                </button>
                <button
                  type="button"
                  className="btn-quiet"
                  style={{ textAlign: 'left', padding: 0 }}
                  onClick={() => setLegalModal('privacidad')}
                >
                  Política de privacidad
                </button>
                <button
                  type="button"
                  className="btn-quiet"
                  style={{ textAlign: 'left', padding: 0 }}
                  onClick={() => setLegalModal('aviso')}
                >
                  Aviso legal
                </button>
                <button
                  type="button"
                  className="btn-quiet"
                  style={{ textAlign: 'left', padding: 0 }}
                  onClick={() => setLegalModal('condiciones')}
                >
                  Condiciones de contratación
                </button>
                <button
                  type="button"
                  className="btn-quiet"
                  style={{ textAlign: 'left', padding: 0 }}
                  onClick={() => setLegalModal('cookies')}
                >
                  Política de cookies
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--line)',
              paddingTop: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--muted)',
              fontSize: '0.82rem',
            }}
          >
            <div>© {new Date().getFullYear()} PresuFollow. Todos los derechos reservados.</div>
            <div>Estructura legal y datos mercantiles pendientes de completar por el titular.</div>
          </div>
        </div>
      </footer>

      {/* Legal & Contact Modal */}
      {legalModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 60,
          }}
          onClick={() => setLegalModal(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '1.25rem' }}>
                {legalModal === 'contacto' && 'Contacto comercial'}
                {legalModal === 'privacidad' && 'Política de privacidad'}
                {legalModal === 'aviso' && 'Aviso legal'}
                {legalModal === 'condiciones' && 'Condiciones de contratación'}
                {legalModal === 'cookies' && 'Política de cookies'}
              </h3>
              <button
                type="button"
                className="btn btn-quiet sm"
                onClick={() => setLegalModal(null)}
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--ink)' }}>
              {legalModal === 'contacto' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p>
                    Para consultas comerciales, sugerencias o soporte sobre PresuFollow, puedes
                    contactar directamente mediante correo electrónico:
                  </p>
                  <div
                    style={{
                      background: 'var(--surface-2)',
                      padding: '12px',
                      borderRadius: '8px',
                      fontFamily: 'var(--f-mono)',
                      fontSize: '0.9rem',
                    }}
                  >
                    contacto@presufollow.com
                  </div>
                  <p className="hint">
                    Información de atención al cliente pendiente de definir por el titular del
                    servicio.
                  </p>
                </div>
              )}

              {legalModal === 'privacidad' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p>
                    <strong>Responsable del tratamiento:</strong> Pendiente de asignación por el
                    titular de PresuFollow.
                  </p>
                  <p>
                    <strong>Finalidad:</strong> Gestión del alta de usuario, autenticación mediante
                    Firebase y almacenamiento seguro de presupuestos y clientes.
                  </p>
                  <p>
                    <strong>Base jurídica:</strong> Consentimiento del usuario y ejecución de la
                    relación de servicio.
                  </p>
                  <p>
                    <strong>Derechos:</strong> Puedes solicitar acceso, rectificación, supresión y
                    portabilidad de tus datos en cualquier momento a través de la cuenta o por correo
                    electrónico.
                  </p>
                  <p className="hint">
                    Documento de privacidad pendiente de redacción definitiva conforme a RGPD / LOPDGDD.
                  </p>
                </div>
              )}

              {legalModal === 'aviso' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p>
                    <strong>Titular del sitio web:</strong> Razón social o denominación pendiente de
                    definir.
                  </p>
                  <p>
                    <strong>NIF / CIF:</strong> Pendiente de registro comercial.
                  </p>
                  <p>
                    <strong>Domicilio:</strong> Pendiente de especificar por el titular del servicio.
                  </p>
                  <p>
                    El uso de esta plataforma implica la aceptación de los términos de servicio una
                    vez contratado.
                  </p>
                </div>
              )}

              {legalModal === 'condiciones' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p>
                    <strong>Propuesta comercial:</strong> El precio previsto para PresuFollow es de 12
                    €/mes sin permanencia mínima.
                  </p>
                  <p>
                    <strong>Periodo de prueba:</strong> La prueba gratuita es de 14 días a partir del
                    registro sin requerir tarjeta de crédito.
                  </p>
                  <p>
                    <strong>Pagos y facturación:</strong> La pasarela de pago y contratación definitiva
                    se incorporará en una fase posterior.
                  </p>
                </div>
              )}

              {legalModal === 'cookies' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p>
                    PresuFollow utiliza únicamente cookies y almacenamiento local técnico estrictamente
                    necesarios para mantener la sesión autenticada con Firebase y almacenar tus
                    preferencias de usuario (como modo oscuro o borrador activo).
                  </p>
                  <p>
                    No se utilizan cookies publicitarias ni de seguimiento de terceros con fines de
                    perfilado.
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                className="btn sm"
                onClick={() => setLegalModal(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
