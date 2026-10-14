import { Quote, Settings } from '../types';
import { calc, fmt, firstName, lineTotal } from './calc';
import { fdate } from './date';

export function neg(settings: Settings): string {
  return settings.negocio || '';
}

export function titleBit(q: Quote): string {
  return q.titulo ? ' para ' + q.titulo : '';
}

export function initSubject(q: Quote, settings: Settings): string {
  const n = neg(settings);
  return 'Presupuesto ' + q.num + (n ? ' — ' + n : '');
}

export function initMsg(q: Quote, settings: Settings): string {
  const c = calc(q.lineas);
  const lines = q.lineas
    .filter((l) => l.desc.trim())
    .map((l) => '• ' + l.desc + ': ' + fmt(lineTotal(l)))
    .join('\n');
  const iv = c.ivas.map((x) => 'IVA ' + x.rate + ' %: ' + fmt(x.cuota)).join('\n');

  return (
    'Hola, ' +
    firstName(q.cliente) +
    '.\n\nTe paso el presupuesto ' +
    q.num +
    titleBit(q) +
    '.\n\n' +
    lines +
    '\n\nBase imponible: ' +
    fmt(c.base) +
    '\n' +
    iv +
    '\nTOTAL: ' +
    fmt(c.total) +
    '\n\nVálido hasta el ' +
    fdate(q.validez) +
    '.' +
    (q.condiciones ? '\n\n' + q.condiciones : '') +
    '\n\nQuedo atento a tu respuesta.\n\nUn saludo,\n' +
    neg(settings)
  );
}

export function fuSubject(q: Quote, i: number): string {
  return [
    'Seguimiento del presupuesto ' + q.num,
    '¿Has podido revisar el presupuesto ' + q.num + '?',
    'Último seguimiento del presupuesto ' + q.num,
  ][Math.min(i, 2)];
}

export function fuMsg(q: Quote, i: number, settings: Settings): string {
  const n = firstName(q.cliente);
  const sig = '\n\nUn saludo,\n' + neg(settings);
  if (i === 0) {
    return (
      'Hola, ' +
      n +
      '.\n\nTe escribo para confirmar que has recibido el presupuesto ' +
      q.num +
      ' que te envié el ' +
      fdate(q.enviado) +
      '.\n\nSi tienes alguna duda o quieres que revisemos algún detalle, dímelo y te ayudo.' +
      sig
    );
  }
  if (i === 1) {
    return (
      'Hola, ' +
      n +
      '.\n\n¿Has podido revisar mi presupuesto' +
      titleBit(q) +
      ' (' +
      q.num +
      ')?\n\nSi necesitas alguna aclaración, respóndeme y te ayudo.' +
      sig
    );
  }
  return (
    'Hola, ' +
    n +
    '.\n\nTe contacto por última vez para saber si sigues interesado en el presupuesto ' +
    q.num +
    '.\n\nSi tus planes han cambiado, no hay ningún problema. Gracias por tu tiempo.' +
    sig
  );
}

export function waUrl(tel: string, msg: string): string {
  let d = String(tel || '').replace(/\D/g, '');
  if (d.length === 9) d = '34' + d;
  return 'https://wa.me/' + d + '?text=' + encodeURIComponent(msg);
}

export function mailUrl(q: Quote, subj: string, msg: string): string {
  return (
    'mailto:' +
    encodeURIComponent(q.email || '') +
    '?subject=' +
    encodeURIComponent(subj) +
    '&body=' +
    encodeURIComponent(msg)
  );
}
