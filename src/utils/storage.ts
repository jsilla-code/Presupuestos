import { AppState, LineItem, Quote, QuoteStatus } from '../types';
import { nextNum, uid } from './calc';
import { addDays, today } from './date';

export const STORAGE_KEY = 'presufollow.v0';

function L(desc: string, qty: number | string, price: number | string, disc?: number | string, iva?: number | string): LineItem {
  return {
    desc,
    qty: String(qty),
    price: String(price),
    disc: disc != null ? String(disc) : '',
    iva: String(iva == null ? 21 : iva),
  };
}

interface SeedQuoteInput {
  cliente: string;
  tel?: string;
  email?: string;
  titulo: string;
  estado: QuoteStatus;
  sentAgo?: number;
  valid?: number;
  fu?: number;
  res?: number;
  motivo?: string;
  lineas: LineItem[];
}

export function seed(): AppState {
  const t = today();
  const ago = (n: number) => addDays(t, -n);

  const s: AppState = {
    v: 1,
    settings: {
      negocio: 'Instalaciones Demo',
      telefono: '',
      iva: 21,
      dias: [3, 7, 14],
      condiciones: 'Forma de pago: 50 % al aceptar y 50 % al terminar el trabajo.',
    },
    quotes: [],
  };

  function add(o: SeedQuoteInput) {
    const sent = o.sentAgo != null;
    const q: Quote = {
      id: uid(),
      num: nextNum(s.quotes),
      example: true,
      pausa: false,
      resuelto: null,
      motivo: '',
      nota: '',
      notas: '',
      condiciones: s.settings.condiciones,
      cliente: o.cliente,
      telefono: o.tel || '',
      email: o.email || '',
      titulo: o.titulo,
      lineas: o.lineas,
      estado: o.estado,
      emision: sent ? ago(o.sentAgo!) : t,
      validez: addDays(sent ? ago(o.sentAgo!) : t, o.valid || 30),
      enviado: sent ? ago(o.sentAgo!) : null,
      seg: [],
      hist: [],
    };

    if (sent) {
      q.hist.push({ f: q.enviado + 'T09:00', t: 'Presupuesto marcado como enviado' });
      q.seg = s.settings.dias.map((d, i) => {
        const done = i < (o.fu || 0) ? addDays(q.enviado!, d) : null;
        if (done) q.hist.push({ f: done + 'T10:00', t: 'Recordatorio ' + (i + 1) + ' enviado' });
        return { dia: d, hecho: done };
      });
    } else {
      q.hist.push({ f: t + 'T09:00', t: 'Borrador creado' });
    }

    if (o.res) {
      q.resuelto = ago(o.res);
      q.motivo = o.motivo || '';
      q.hist.push({
        f: q.resuelto + 'T12:00',
        t:
          o.estado === 'aceptado'
            ? 'El cliente aceptó el presupuesto'
            : 'El cliente rechazó el presupuesto' + (o.motivo ? ' (' + o.motivo + ')' : ''),
      });
    }

    q.hist.sort((a, b) => (a.f < b.f ? -1 : 1));
    s.quotes.unshift(q);
  }

  add({
    cliente: 'Ona Bosch',
    tel: '600 100 200',
    titulo: 'Reparación de tejado',
    estado: 'rechazado',
    sentAgo: 25,
    fu: 2,
    res: 18,
    motivo: 'Precio',
    lineas: [
      L('Retirada de tejas rotas', 1, 380),
      L('Impermeabilización de 40 m²', 40, 38),
      L('Tejas nuevas y colocación', 1, 640),
    ],
  });

  add({
    cliente: 'Marc Vila',
    tel: '600 100 300',
    titulo: 'Instalación de toldo en terraza',
    estado: 'enviado',
    sentAgo: 16,
    valid: 30,
    fu: 3,
    lineas: [
      L('Toldo de brazos extensibles 4 × 3 m', 1, 1480),
      L('Motor y mando a distancia', 1, 260),
      L('Instalación', 1, 190),
    ],
  });

  add({
    cliente: 'Carles Puig',
    tel: '600 100 400',
    titulo: 'Persianas y mosquiteras',
    estado: 'enviado',
    sentAgo: 20,
    valid: 15,
    fu: 3,
    lineas: [
      L('Persiana de aluminio', 4, 185),
      L('Mosquitera enrollable', 4, 92, 5),
    ],
  });

  add({
    cliente: 'Joan Mas',
    tel: '600 100 500',
    titulo: 'Cambio de caldera de gas',
    estado: 'aceptado',
    sentAgo: 12,
    fu: 1,
    res: 6,
    lineas: [
      L('Caldera de condensación 24 kW', 1, 1650, 5),
      L('Desmontaje y retirada de la anterior', 1, 120),
      L('Instalación y puesta en marcha', 1, 340),
    ],
  });

  add({
    cliente: 'Laura Vidal',
    tel: '600 100 600',
    titulo: 'Pintura de piso de 90 m²',
    estado: 'enviado',
    sentAgo: 1,
    fu: 0,
    lineas: [
      L('Pintura plástica en paredes y techos (m²)', 240, 6.5),
      L('Protección de suelos y muebles', 1, 150),
      L('Reparación de grietas y lijado', 1, 210),
    ],
  });

  add({
    cliente: 'Pau Ribas',
    tel: '600 100 700',
    titulo: 'Instalación eléctrica de garaje',
    estado: 'enviado',
    sentAgo: 8,
    fu: 1,
    lineas: [
      L('Cuadro eléctrico con 6 circuitos', 1, 420),
      L('Cableado y canalización (m)', 45, 9.5),
      L('Puntos de luz y enchufes', 8, 38),
      L('Legalización y boletín', 1, 180),
    ],
  });

  add({
    cliente: 'Marta Soler',
    tel: '600 100 800',
    email: 'marta@ejemplo.es',
    titulo: 'Reforma completa de baño',
    estado: 'enviado',
    sentAgo: 3,
    fu: 0,
    lineas: [
      L('Demolición y retirada de escombros', 1, 480),
      L('Alicatado de paredes (m²)', 18, 42),
      L('Plato de ducha y mampara', 1, 690, 5),
      L('Fontanería y desagües', 1, 520),
    ],
  });

  add({
    cliente: 'Núria Pons',
    tel: '600 100 900',
    titulo: 'Aire acondicionado en salón',
    estado: 'borrador',
    lineas: [
      L('Equipo split 3.000 frigorías', 1, 780),
      L('Instalación con 4 m de tubería', 1, 260),
    ],
  });

  return s;
}

export function loadState(): { state: AppState; saveErr: boolean } {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    if (r) {
      const s = JSON.parse(r) as AppState;
      if (s && s.quotes && s.settings) {
        return { state: s, saveErr: false };
      }
    }
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
  }
  const initial = seed();
  return { state: initial, saveErr: false };
}

export function saveState(state: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
    return false;
  }
}
