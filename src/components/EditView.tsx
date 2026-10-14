import React, { useState } from 'react';
import { LineItem, Quote, Settings } from '../types';
import { IVAS, calc, fmt, lineTotal, num } from '../utils/calc';
import { addDays, today } from '../utils/date';

export interface EditFormData {
  id: string | null;
  cliente: string;
  telefono: string;
  email: string;
  titulo: string;
  emision: string;
  validez: string;
  lineas: LineItem[];
  condiciones: string;
  notas: string;
}

export function createBlankLine(defaultIva: number): LineItem {
  return {
    desc: '',
    qty: '1',
    price: '',
    disc: '',
    iva: String(defaultIva),
  };
}

export function createNewEditData(settings: Settings): EditFormData {
  const t = today();
  return {
    id: null,
    cliente: '',
    telefono: '',
    email: '',
    titulo: '',
    emision: t,
    validez: addDays(t, 30),
    lineas: [createBlankLine(settings.iva)],
    condiciones: settings.condiciones || '',
    notas: '',
  };
}

interface EditViewProps {
  initialData: EditFormData;
  existingQuotes: Quote[];
  settings: Settings;
  onSave: (data: EditFormData, andSend: boolean) => void;
  onCancel: () => void;
}

export const EditView: React.FC<EditViewProps> = ({
  initialData,
  existingQuotes,
  settings,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<EditFormData>(initialData);
  const [errors, setErrors] = useState<string[]>([]);

  // Unique client names for suggestions
  const clientNames = Array.from(new Set(existingQuotes.map((q) => q.cliente).filter(Boolean)));

  const handleClientChange = (val: string) => {
    const updated = { ...formData, cliente: val };
    const match = existingQuotes.find(
      (q) => q.cliente.trim().toLowerCase() === val.trim().toLowerCase()
    );
    if (match) {
      if (!updated.telefono && match.telefono) {
        updated.telefono = match.telefono;
      }
      if (!updated.email && match.email) {
        updated.email = match.email;
      }
    }
    setFormData(updated);
  };

  const handleFieldChange = (key: keyof EditFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleLineChange = (index: number, key: keyof LineItem, value: string) => {
    setFormData((prev) => {
      const nextLines = [...prev.lineas];
      nextLines[index] = { ...nextLines[index], [key]: value };
      return { ...prev, lineas: nextLines };
    });
  };

  const handleAddLine = () => {
    setFormData((prev) => ({
      ...prev,
      lineas: [...prev.lineas, createBlankLine(settings.iva)],
    }));
  };

  const handleDuplicateLine = (index: number) => {
    setFormData((prev) => {
      const nextLines = [...prev.lineas];
      const dup = { ...nextLines[index] };
      nextLines.splice(index + 1, 0, dup);
      return { ...prev, lineas: nextLines };
    });
  };

  const handleRemoveLine = (index: number) => {
    setFormData((prev) => {
      if (prev.lineas.length > 1) {
        const nextLines = [...prev.lineas];
        nextLines.splice(index, 1);
        return { ...prev, lineas: nextLines };
      }
      return { ...prev, lineas: [createBlankLine(settings.iva)] };
    });
  };

  const handleSubmit = (andSend: boolean) => {
    const errs: string[] = [];
    if (!formData.cliente.trim()) {
      errs.push('Escribe el nombre del cliente.');
    }
    if (!formData.titulo.trim()) {
      errs.push('Describe el trabajo en una línea.');
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.push('El correo no parece válido.');
    }

    const validLines = formData.lineas.filter((l) => l.desc.trim());
    if (!validLines.some((l) => num(l.price) > 0)) {
      errs.push('Añade al menos un concepto con descripción y precio.');
    }
    if (formData.validez && formData.emision && formData.validez < formData.emision) {
      errs.push('La fecha de validez es anterior a la de emisión.');
    }

    if (errs.length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors([]);
    onSave(
      {
        ...formData,
        cliente: formData.cliente.trim(),
        telefono: formData.telefono.trim(),
        email: formData.email.trim(),
        titulo: formData.titulo.trim(),
        condiciones: formData.condiciones.trim(),
        notas: formData.notas.trim(),
        lineas: validLines,
      },
      andSend
    );
  };

  const c = calc(formData.lineas);

  return (
    <div>
      <div className="back">
        <button
          type="button"
          className="btn btn-quiet sm"
          onClick={onCancel}
        >
          ← Volver
        </button>
      </div>

      <div className="sec-h">
        <h2>{formData.id ? 'Editar borrador' : 'Nuevo presupuesto'}</h2>
      </div>

      {errors.length > 0 && (
        <div className="errs" role="alert">
          {errors.map((err, idx) => (
            <p key={idx}>{err}</p>
          ))}
        </div>
      )}

      <div className="stack">
        {/* Cliente y trabajo */}
        <section className="card">
          <h3>Cliente y trabajo</h3>
          <div className="grid-fields">
            <div className="f">
              <label htmlFor="f-cliente">Cliente</label>
              <input
                id="f-cliente"
                list="clientes"
                autoComplete="off"
                placeholder="Nombre o empresa"
                value={formData.cliente}
                onChange={(e) => handleClientChange(e.target.value)}
              />
              <datalist id="clientes">
                {clientNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div className="f">
              <label htmlFor="f-telefono">Teléfono (WhatsApp)</label>
              <input
                id="f-telefono"
                inputMode="tel"
                placeholder="600 000 000"
                value={formData.telefono}
                onChange={(e) => handleFieldChange('telefono', e.target.value)}
              />
            </div>

            <div className="f">
              <label htmlFor="f-email">Correo (opcional)</label>
              <input
                id="f-email"
                inputMode="email"
                placeholder="cliente@correo.es"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
              />
            </div>

            <div className="f full">
              <label htmlFor="f-titulo">Trabajo a realizar</label>
              <input
                id="f-titulo"
                placeholder="Ej.: Reforma de baño"
                value={formData.titulo}
                onChange={(e) => handleFieldChange('titulo', e.target.value)}
              />
            </div>

            <div className="f">
              <label htmlFor="f-emision">Fecha de emisión</label>
              <input
                id="f-emision"
                type="date"
                value={formData.emision}
                onChange={(e) => handleFieldChange('emision', e.target.value)}
              />
            </div>

            <div className="f">
              <label htmlFor="f-validez">Válido hasta</label>
              <input
                id="f-validez"
                type="date"
                value={formData.validez}
                onChange={(e) => handleFieldChange('validez', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Conceptos */}
        <section className="card">
          <h3>Conceptos</h3>
          <div id="lines">
            {formData.lineas.map((l, i) => (
              <div key={i} className="line">
                <div className="f full">
                  <label htmlFor={`l-desc-${i}`}>Concepto</label>
                  <input
                    id={`l-desc-${i}`}
                    placeholder="Ej.: Instalación de punto de luz"
                    value={l.desc}
                    onChange={(e) => handleLineChange(i, 'desc', e.target.value)}
                  />
                </div>

                <div className="f">
                  <label htmlFor={`l-qty-${i}`}>Cantidad</label>
                  <input
                    id={`l-qty-${i}`}
                    inputMode="decimal"
                    value={l.qty}
                    onChange={(e) => handleLineChange(i, 'qty', e.target.value)}
                  />
                </div>

                <div className="f">
                  <label htmlFor={`l-price-${i}`}>Precio ud. (€)</label>
                  <input
                    id={`l-price-${i}`}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={l.price}
                    onChange={(e) => handleLineChange(i, 'price', e.target.value)}
                  />
                </div>

                <div className="f">
                  <label htmlFor={`l-disc-${i}`}>Dto. %</label>
                  <input
                    id={`l-disc-${i}`}
                    inputMode="decimal"
                    value={l.disc}
                    onChange={(e) => handleLineChange(i, 'disc', e.target.value)}
                  />
                </div>

                <div className="f">
                  <label htmlFor={`l-iva-${i}`}>IVA</label>
                  <select
                    id={`l-iva-${i}`}
                    value={l.iva}
                    onChange={(e) => handleLineChange(i, 'iva', e.target.value)}
                  >
                    {IVAS.map((r) => (
                      <option key={r} value={String(r)}>
                        {r} %
                      </option>
                    ))}
                  </select>
                </div>

                <div className="f tot">
                  <span className="lab">Importe</span>
                  <output id={`lt-${i}`}>{fmt(lineTotal(l))}</output>
                </div>

                <div className="lactions">
                  <button
                    type="button"
                    className="btn btn-quiet sm"
                    onClick={() => handleDuplicateLine(i)}
                  >
                    Duplicar
                  </button>
                  <button
                    type="button"
                    className="btn btn-quiet sm"
                    onClick={() => handleRemoveLine(i)}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '10px' }}>
            <button
              type="button"
              className="btn sm"
              onClick={handleAddLine}
            >
              + Añadir línea
            </button>
          </div>

          <div className="totals">
            <div>
              <span>Importe bruto</span>
              <span>{fmt(c.bruto)}</span>
            </div>
            {c.desc > 0 && (
              <div>
                <span>Descuentos</span>
                <span>−{fmt(c.desc)}</span>
              </div>
            )}
            <div>
              <span>Base imponible</span>
              <span>{fmt(c.base)}</span>
            </div>
            {c.ivas.map((x) => (
              <div key={x.rate}>
                <span>IVA {x.rate} % sobre {fmt(x.base)}</span>
                <span>{fmt(x.cuota)}</span>
              </div>
            ))}
            <div className="grand">
              <span>Total</span>
              <span>{fmt(c.total)}</span>
            </div>
          </div>
        </section>

        {/* Condiciones y notas */}
        <section className="card">
          <h3>Condiciones y notas</h3>
          <div className="grid-fields">
            <div className="f full">
              <label htmlFor="f-condiciones">Condiciones que verá el cliente</label>
              <textarea
                id="f-condiciones"
                rows={3}
                value={formData.condiciones}
                onChange={(e) => handleFieldChange('condiciones', e.target.value)}
              />
            </div>

            <div className="f full">
              <label htmlFor="f-notas">Notas internas (el cliente no las ve)</label>
              <textarea
                id="f-notas"
                rows={2}
                value={formData.notas}
                onChange={(e) => handleFieldChange('notas', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="sticky-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSubmit(true)}
          >
            Guardar y preparar envío
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => handleSubmit(false)}
          >
            Guardar borrador
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
