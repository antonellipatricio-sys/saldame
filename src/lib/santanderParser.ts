/**
 * Parser de resúmenes de tarjeta Santander en formato Excel (.xlsx).
 *
 * Estructura real del archivo:
 *   - Encabezado general (fechas, totales, tarjetas incluidas)
 *   - Sección "Pago de tarjeta y devoluciones" → ignorar
 *   - Secciones por tarjeta: "Tarjeta de [Nombre] - Visa Crédito terminada en XXXX"
 *     Columnas: Fecha | Descripción | Cuotas | Comprobante | Monto en pesos | Monto en dólares
 *     Filas de transacciones (fecha en col0 o vacío = hereda última fecha vista)
 */
import * as XLSX from 'xlsx';

export interface SantanderTransaction {
  id: string;
  date: string;
  description: string;
  cuotas: string;
  amountARS: number | null;
  amountUSD: number | null;
  currency: 'ARS' | 'USD';
  amount: number;
cardholder: string;     // nombre completo del portador de la tarjeta
  cardLast4: string;      // últimos 4 dígitos de la tarjeta
  isAdditional: boolean;  // true si es adicional
  isRefund: boolean;       // true si es devolución/descuento (monto negativo)
  rawRow: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** DD/MM/YYYY o DD/MM/YY → 'YYYY-MM-DD', null si no es fecha */
function parseDate(raw: string): string | null {
  const m = String(raw).trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (!m) return null;
  const d = m[1].padStart(2, '0');
  const mo = m[2].padStart(2, '0');
  const y = m[3].length === 2 ? `20${m[3]}` : m[3];
  if (+mo > 12 || +d > 31) return null;
  return `${y}-${mo}-${d}`;
}

/**
 * Parsea montos en formato argentino con prefijo de moneda.
 * "$1.234,56" → 1234.56 | "U$S-102,53" → -102.53
 * Devuelve null si vacío/inválido.
 */
function parseAmount(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'number') return raw;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/U\$S?|US\$|\$/gi, '').trim();
  if (!s) return null;
  const normalized = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(normalized);
  return isNaN(n) ? null : n;
}

/**
 * Detecta si col0 es el inicio de una sección de tarjeta.
 * Titular:  "Tarjeta de Patricio Hernan Antonelli - Visa Crédito terminada en 1204"
 * Adicional: "Adicional de Micaela Belen Boggio Diaz - Visa Crédito terminada en 8337"
 */
function detectCardSection(col0: string): { name: string; last4: string; isAdditional: boolean } | null {
  // Matchea tanto "Tarjeta de ..." como "Adicional de ..."
  const m = col0.match(/^(Tarjeta|Adicional) de\s+(.+?)\s*[-–]\s*.*terminada en\s+(\d{4})/i);
  if (!m) return null;
  const isAdditional = m[1].toLowerCase() === 'adicional';
  const name = m[2].trim();
  const last4 = m[3];
  return { name, last4, isAdditional };
}

// Patrones de descripción que deben ignorarse (no son transacciones de compra)
const SKIP_DESC_RE: RegExp[] = [
  /^fecha$/i,
  /^descripci[oó]n$/i,
  /^cuotas$/i,
  /^comprobante$/i,
  /^monto/i,
  /^total/i,
  /^subtotal/i,
  /^saldo/i,
  /^movimientos/i,
  /tarjetas\s+incluidas/i,
  /cierres\s+y\s+venc/i,
  /resumen\s+actual/i,
  /pago\s+de\s+tarjeta/i,
  /^tarjeta\s+(visa|master|de\s)/i,
  /^visa\s+cr[eé]dito/i,
  /pr[oó]ximo\s+resumen/i,
  /^cierre:/i,
  /^vencimiento:/i,
];

function shouldSkipDesc(desc: string): boolean {
  const s = desc.trim();
  if (!s || s.length < 3) return true;
  return SKIP_DESC_RE.some(rx => rx.test(s));
}

// ── Parser principal ───────────────────────────────────────────────────────────

export function parseSantanderRows(rows: any[][]): SantanderTransaction[] {
  // Paso 1: construir mapa last4 → isAdditional desde la tabla "Tarjetas incluidas"
  // Esa tabla tiene filas como: ["Visa Crédito terminada en 1204", "Patricio... (Titular)", ...]
  const additionalMap: Record<string, boolean> = {};
  for (const row of rows) {
    const c0 = String(row[0] ?? '').trim();
    const c1 = String(row[1] ?? '').trim();
    const m = c0.match(/terminada en\s+(\d{4})/i);
    if (m) {
      const last4 = m[1];
      additionalMap[last4] = /adicional/i.test(c1);
    }
  }
  const transactions: SantanderTransaction[] = [];

  let lastDate: string | null = null;
  let currentCardholder = '';
  let currentLast4 = '';
  let currentIsAdditional = false;
  let inPaymentsSection = false;

  for (const row of rows) {
    if (!row || row.length < 2) continue;

    const col0 = String(row[0] ?? '').trim();
    const col1 = String(row[1] ?? '').trim();

    // ── Detectar sección "Pago de tarjeta y devoluciones" → ignorar ──────
    if (/pago de tarjeta y devoluciones/i.test(col0)) {
      inPaymentsSection = true;
      lastDate = null;
      currentCardholder = '';
      continue;
    }

    // ── Detectar inicio de sección de tarjeta ─────────────────────────────
    const cardSection = detectCardSection(col0);
    if (cardSection) {
      inPaymentsSection = false;
      currentCardholder = cardSection.name;
      currentLast4 = cardSection.last4;
      currentIsAdditional = additionalMap[cardSection.last4] ?? false;
      lastDate = null;
      continue;
    }

    if (inPaymentsSection) continue;
    if (!currentCardholder) continue; // aún en encabezado general

    // ── Fecha flotante ─────────────────────────────────────────────────────
    const parsedDate = parseDate(col0);
    if (parsedDate) lastDate = parsedDate;
    if (!lastDate) continue;

    // ── Descripción ────────────────────────────────────────────────────────
    if (shouldSkipDesc(col1)) continue;
    const description = col1.trim();

    // ── Montos ─────────────────────────────────────────────────────────────
    const cuotas = String(row[2] ?? '').trim();
    const amountARS = parseAmount(row[4]);
    const amountUSD = parseAmount(row[5]);

    if (amountARS === null && amountUSD === null) continue;

    const arsVal = amountARS ?? 0;
    const usdVal = amountUSD ?? 0;

    // Ambos en cero → no es transacción
    if (arsVal === 0 && usdVal === 0) continue;

    // Determinar si es devolución (monto negativo)
    const isRefund = arsVal < 0 || (arsVal === 0 && usdVal < 0);

    // Para la moneda usamos el valor absoluto
    const absARS = Math.abs(arsVal);
    const absUSD = Math.abs(usdVal);
    const currency: 'ARS' | 'USD' = absUSD > 0 && absARS === 0 ? 'USD' : 'ARS';
    const amount = currency === 'USD' ? absUSD : absARS;
    if (amount === 0) continue;

    transactions.push({
      id: crypto.randomUUID(),
      date: lastDate,
      description,
      cuotas,
      amountARS: arsVal !== 0 ? absARS : null,
      amountUSD: usdVal !== 0 ? absUSD : null,
      currency,
      amount,
      cardholder: currentCardholder,
      cardLast4: currentLast4,
      isAdditional: currentIsAdditional,
      isRefund,
      rawRow: row.map(c => String(c ?? '')).join(' | '),
    });
  }

  // Deduplicar por fecha + descripción + monto + tarjeta
  const seen = new Set<string>();
  return transactions.filter(t => {
    const key = `${t.date}|${t.description}|${t.amount}|${t.cardLast4}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Lee un File (.xlsx/.xls) de Santander y devuelve todas las transacciones.
 */
export async function parseSantanderExcel(file: File): Promise<SantanderTransaction[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });

  const allTransactions: SantanderTransaction[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: '',
    });
    allTransactions.push(...parseSantanderRows(rows));
  }

  // Deduplicar entre hojas
  const seen = new Set<string>();
  return allTransactions.filter(t => {
    const key = `${t.date}|${t.description}|${t.amount}|${t.cardLast4}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
