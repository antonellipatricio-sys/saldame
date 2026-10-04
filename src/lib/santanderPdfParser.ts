/**
 * Parser del resumen de tarjeta Santander (Visa) en PDF.
 *
 * Trabaja sobre las líneas que arma extractTextFromPDF (agrupadas por Y).
 * Ojo: no usar el orden "crudo" del PDF; los montos vienen dibujados en
 * otra secuencia y solo coinciden con su fila por coordenada.
 *
 * Estructura:
 *   - Encabezado con fechas: "Cierre anterior | Vto anterior | Cierre actual | Vto actual | Próx. cierre | Próx. vto"
 *   - "Pago anterior y devoluciones" → se ignora
 *   - "Movimientos de <Nombre>" + "Visa crédito terminada en XXXX" + filas hasta "Subtotal de ..."
 *       [DD/MM/YY] Descripción [N de M] Comprobante(6 dígitos) $ 1.234,56 | U$S 1,99
 *     (sin fecha = misma fecha que la fila anterior; las cuotas traen la fecha de la compra original)
 *   - "Impuestos, intereses y percepciones" → se cargan en la tarjeta del titular
 */
import type { Responsable } from '@/types';
import { resolveCardholder } from '@/lib/resolveCardholder';
import type { SantanderTransaction } from '@/lib/santanderParser';

export interface SantanderPdfResult {
  transactions: SantanderTransaction[];
  /** 'YYYY-MM-DD' */
  cierre?: string;
  /** 'YYYY-MM-DD' */
  vencimiento?: string;
}

export function isSantanderPdf(text: string): boolean {
  return /Resumen Visa/i.test(text) && /Movimientos de /i.test(text) && /terminada en \d{4}/i.test(text);
}

function toISO(ddmmyy: string): string {
  const [d, m, y] = ddmmyy.split('/');
  return `${y.length === 2 ? '20' + y : y}-${m}-${d}`;
}

function toNumber(s: string): number {
  return parseFloat(s.replace(/\./g, '').replace(',', '.'));
}

const DATE = String.raw`(\d{2}/\d{2}/\d{2,4})`;
const AMOUNT = String.raw`(-?)\s*(\$|U\$S)\s*([\d.]+,\d{2})`;
// [fecha] descripción [N de M] comprobante monto
const MOV_RE = new RegExp(String.raw`^(?:${DATE}\s+)?(.+?)\s+(?:(\d{1,2} de \d{1,2})\s+)?(\d{6})\s+${AMOUNT}$`);
// [fecha] descripción monto   (impuestos)
const IMP_RE = new RegExp(String.raw`^(?:${DATE}\s+)?(.+?)\s+${AMOUNT}$`);

export function parseSantanderPdfText(text: string, responsables?: Responsable[]): SantanderPdfResult {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result: SantanderPdfResult = { transactions: [] };

  // Fechas del período: la línea con 6 fechas seguidas
  for (const l of lines) {
    const fechas = l.match(/\d{2}\/\d{2}\/\d{2}/g);
    if (fechas && fechas.length === 6 && /^[\d/\s]+$/.test(l)) {
      result.cierre = toISO(fechas[2]);
      result.vencimiento = toISO(fechas[3]);
      break;
    }
  }

  type Seccion = 'nada' | 'movimientos' | 'impuestos';
  let seccion: Seccion = 'nada';
  let cardholder = '';
  let last4 = '';
  let titular: { cardholder: string; last4: string } | null = null;
  let lastDate: string | null = null;

  const push = (t: Omit<SantanderTransaction, 'id' | 'responsable' | 'isAdditional' | 'amountARS' | 'amountUSD'>) => {
    result.transactions.push({
      ...t,
      id: crypto.randomUUID(),
      amountARS: t.currency === 'ARS' ? t.amount : null,
      amountUSD: t.currency === 'USD' ? t.amount : null,
      responsable: (responsables && resolveCardholder(t.cardholder, responsables)) || t.cardholder,
      isAdditional: !!titular && t.cardLast4 !== titular.last4,
    });
  };

  for (const line of lines) {
    const mov = line.match(/^Movimientos de (.+)$/i);
    if (mov) {
      cardholder = mov[1].trim();
      seccion = 'nada'; // se activa al leer "terminada en"
      continue;
    }
    const card = line.match(/terminada en (\d{4})$/i);
    if (card && cardholder) {
      last4 = card[1];
      if (!titular) titular = { cardholder, last4 };
      seccion = 'movimientos';
      lastDate = null;
      continue;
    }
    if (/^Impuestos, intereses y percepciones/i.test(line)) {
      seccion = titular ? 'impuestos' : 'nada';
      if (titular) { cardholder = titular.cardholder; last4 = titular.last4; }
      lastDate = null;
      continue;
    }
    if (/^Subtotal de /i.test(line) || /^Total a pagar/i.test(line) || /^Pago anterior/i.test(line)) {
      seccion = 'nada';
      continue;
    }
    if (seccion === 'nada') continue;

    const m = seccion === 'movimientos' ? line.match(MOV_RE) : line.match(IMP_RE);
    if (!m) continue; // encabezados, pie de página, líneas de referencia

    let date: string | undefined, description: string, cuotas = '', comprobante = '', neg: string, cur: string, num: string;
    if (seccion === 'movimientos') {
      [, date, description, cuotas = '', comprobante, neg, cur, num] = m as unknown as string[];
    } else {
      [, date, description, neg, cur, num] = m as unknown as string[];
      description = description.replace(/\s*\$$/, '').trim(); // "Intereses financiacion $"
    }
    if (date) lastDate = toISO(date);
    const fecha = lastDate ?? result.cierre;
    if (!fecha) continue;

    const amount = toNumber(num);
    if (!amount) continue;
    push({
      date: fecha,
      description: description.trim(),
      cuotas: cuotas ?? '',
      comprobante: comprobante ?? '',
      currency: cur === '$' ? 'ARS' : 'USD',
      amount,
      cardholder,
      cardLast4: last4,
      isRefund: neg === '-',
      rawRow: line,
    });
  }

  return result;
}
