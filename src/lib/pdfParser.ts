/**
 * Parser de resúmenes de tarjeta de crédito argentina.
 * Soporta el formato Banco Nación / VISA / Mastercard con fechas en español.
 */
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface ParsedTransaction {
  id: string;
  description: string;
  amount: number;
  currency: 'ARS' | 'USD';
  date: string; // 'YYYY-MM-DD'
  rawLine: string;
}

// ── Extracción de texto ────────────────────────────────────────────

/** Extrae texto del PDF reconstruyendo líneas reales por coordenada Y + X */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, verbosity: 0 }).promise;

  const allLines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Agrupar ítems de texto por su coordenada Y (±3px = misma línea)
    const byY: Map<number, { x: number; str: string }[]> = new Map();
    for (const item of content.items as Array<{ str: string; transform: number[] }>) {
      if (!item.str.trim()) continue;
      const y = Math.round(item.transform[5] / 3) * 3;
      const x = item.transform[4];
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y)!.push({ x, str: item.str });
    }

    // Ordenar por Y descendente; dentro de cada línea, por X ascendente
    const sortedY = Array.from(byY.keys()).sort((a, b) => b - a);
    for (const y of sortedY) {
      const items = byY.get(y)!.sort((a, b) => a.x - b.x);
      const line = items.map(it => it.str).join(' ').replace(/\s{2,}/g, ' ').trim();
      if (line) allLines.push(line);
    }
  }

  return allLines.join('\n');
}

// ── Helpers ────────────────────────────────────────────────────────

const MESES: Record<string, string> = {
  enero: '01', febrero: '02', marzo: '03', abril: '04',
  mayo: '05', junio: '06', julio: '07', agosto: '08',
  septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
};

const CURRENT_YEAR = new Date().getFullYear().toString();

/** Parsea fechas en formato "26 Marzo", "DD/MM/YY" o "DD/MM/YYYY"  */
function parseDate(text: string): string | null {
  // Formato DD/MM/YY o DD/MM/YYYY
  const m1 = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (m1) {
    const d = m1[1].padStart(2, '0'), mo = m1[2].padStart(2, '0');
    const y = m1[3].length === 2 ? `20${m1[3]}` : m1[3];
    if (+mo <= 12 && +d <= 31) return `${y}-${mo}-${d}`;
  }
  // Formato "DD Mes" con nombre en español
  const m2 = text.match(/\b(\d{1,2})\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i);
  if (m2) {
    const d = m2[1].padStart(2, '0');
    const mo = MESES[m2[2].toLowerCase()];
    return `${CURRENT_YEAR}-${mo}-${d}`;
  }
  return null;
}

/**
 * Parsea montos en formato argentino: 1.234,56 → 1234.56
 * Retorna el ÚLTIMO monto numérico válido en la línea
 * (en los resúmenes el importe siempre está al final).
 */
function parseAmount(text: string): number | null {
  // Buscar todos los montos con centavos: 26.499,83 / 102,53 / 1.922.306,24
  const all = [...text.matchAll(/\b(\d{1,3}(?:\.\d{3})*,\d{2})\b/g)];
  if (all.length > 0) {
    const last = all[all.length - 1][1];
    return parseFloat(last.replace(/\./g, '').replace(',', '.'));
  }
  return null;
}

// ── Filtros de líneas que no son transacciones ─────────────────────

const SKIP_RE: RegExp[] = [
  /saldo\s+anterior/i,
  /saldo\s+actual/i,
  /pago\s+m[ií]nimo/i,
  /total\s+(a\s+)?pagar/i,
  /su\s+pago\s+en/i,           // "SU PAGO EN PESOS", "SU PAGO EN USD"
  /transferencia\s+deuda/i,
  /cr\.rg\s+\d/i,              // ajuste TC
  /vencimiento/i,
  /\bcierre\b/i,
  /l[ií]mites?:/i,
  /financiaci[oó]n/i,
  /consumidor\s+final/i,
  /\biva:/i,
  /comprobante\s+referencia/i,
  /^\s*fecha\b/i,
  /\bsuc(ursal)?[.:\s]/i,
  /cap\.?\s*federal/i,
  /present[eo]\s+es\s+cop/i,
  /efecto\s+informativo/i,
  /proxim[ao]\s+cierre/i,
  /vto\.?\s+ant/i,
  /clave\s+solicitel/i,
  /acceso\s+a\s+super/i,
  /\bpedernera\b/i,            // dirección específica del usuario
  /\bantonelli\b/i,            // nombre del titular
  /1406\s+capital/i,           // dirección
];

/** Retorna true si la línea debe ignorarse */
function shouldSkip(line: string): boolean {
  if (SKIP_RE.some(rx => rx.test(line))) return true;
  // Líneas de solo mayúsculas/espacios sin dígitos → son cabeceras
  if (/^[A-ZÁÉÍÓÚÑÜ\s:,.\/]+$/.test(line) && !/\d/.test(line)) return true;
  return false;
}

// ── Parser principal ───────────────────────────────────────────────

/**
 * Parsea el texto extraído del PDF y devuelve las transacciones encontradas.
 *
 * Formato típico de resumen argentino:
 *   "07 413775 * MERPAGO*MERCADOLIBRE  C.06/06  15.885,00"
 *   "03 550661 K GOOGLE *Google  USD  19,99"
 *   "05 004131 * SANCOR COOP SE0000010800013-020-000  138.203,00"
 */
export function parseTransactions(text: string): ParsedTransaction[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
  const transactions: ParsedTransaction[] = [];

  // Fecha "flotante": en resúmenes argentinos el mes aparece una vez al inicio
  // del bloque y las transacciones siguientes no repiten la fecha completa.
  let lastDate: string | null = null;

  for (const line of lines) {
    if (shouldSkip(line)) continue;

    const amount = parseAmount(line);
    if (!amount || amount <= 0) continue;

    const dateFound = parseDate(line);
    if (dateFound) lastDate = dateFound;
    const finalDate = lastDate ?? new Date().toISOString().split('T')[0];

    // Detectar moneda
    const isUSD = /\bUSD\b|\bU\$S\b/i.test(line);

    // Construir descripción: eliminar datos estructurales del resumen
    let desc = line
      // Quitar fecha con nombre de mes
      .replace(/\b\d{1,2}\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi, '')
      // Quitar fecha numérica
      .replace(/\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b/g, '')
      // Quitar número de comprobante (5-7 dígitos seguidos de espacio + * o K o C)
      .replace(/\b\d{5,7}\s+[*KkCc]\s+/g, '')
      // Quitar indicador de cuotas C.06/06
      .replace(/\bC\.\d{2}\/\d{2}\b/g, '')
      // Quitar tipo de cambio TC1435,000
      .replace(/\bTC[\d.,]+/g, '')
      // Quitar el monto en formato argentino (ya lo capturamos)
      .replace(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g, '')
      // Quitar etiqueta de moneda
      .replace(/\b(?:ARS|USD|U\$S)\b/gi, '')
      // Comprimir espacios
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Eliminar número de día suelto al inicio ("03 MERPAGO..." → "MERPAGO...")
    desc = desc.replace(/^\d{1,2}\s+/, '').trim();

    // Descartar si la descripción es demasiado corta o es solo números
    if (!desc || desc.length < 4 || /^\d+$/.test(desc)) continue;

    transactions.push({
      id: crypto.randomUUID(),
      description: desc,
      amount,
      currency: isUSD ? 'USD' : 'ARS',
      date: finalDate,
      rawLine: line,
    });
  }

  // Deduplicar
  const seen = new Set<string>();
  return transactions.filter(t => {
    const key = `${t.date}|${t.description}|${t.amount}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}