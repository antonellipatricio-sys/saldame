/**
 * Parser de resúmenes de tarjeta de crédito Mercado Pago en PDF.
 *
 * Estructura del PDF:
 *   - Header: "¡Hola, [Nombre]! Este es tu resumen de [mes]"
 *   - Consolidado (totales)
 *   - Composición del saldo del periodo anterior → IGNORAR
 *   - Consumos → PARSEAR transacciones
 *     Sub-sección: "Con tarjeta virtual" / "Con tarjeta física"
 *     Columnas: Fecha | Descripción | Cuota | Operación | Pesos | Dólares
 *     Fechas: "DD/mes" (ene, feb, mar, abr, may, jun, jul, ago, sep, oct, nov, dic)
 *   - Impuestos e intereses → IGNORAR
 *   - Pagos anticipados → IGNORAR
 *   - Ajustes y reembolsos → IGNORAR
 *   - Información adicional → IGNORAR
 */

import type { ParsedTransaction } from './pdfParser';

// ── Helpers ────────────────────────────────────────────────────────────────────

const MESES_CORTOS: Record<string, string> = {
    ene: '01', feb: '02', mar: '03', abr: '04',
    may: '05', jun: '06', jul: '07', ago: '08',
    sep: '09', oct: '10', nov: '11', dic: '12',
};

const MESES_LARGO: Record<string, number> = {
    enero: 1, febrero: 2, marzo: 3, abril: 4,
    mayo: 5, junio: 6, julio: 7, agosto: 8,
    septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

/** Detecta si el texto extraído del PDF es de Mercado Pago */
export function isMercadoPago(text: string): boolean {
    return /mercado\s*pago/i.test(text) && /resumen de \w+/i.test(text);
}

/** Metadata de la tarjeta de crédito Mercado Pago extraída del PDF */
export interface MPCardInfo {
    cardholder: string;    // Nombre extraído del saludo
    cardLast4: string;     // Identificador: "MPVT" (virtual) o "MPFS" (física)
    cardType: string;      // "virtual" | "física"
}

/** Extrae info de la tarjeta del texto del PDF de Mercado Pago */
export function extractMPCardInfo(text: string): MPCardInfo {
    // Extraer titular del saludo: "¡Hola, Patricio Hernan!" o "Hola, Patricio Hernan!"
    let cardholder = 'Mercado Pago';
    const nameMatch = text.match(/[¡!]?\s*hola,?\s+(.+?)!/i);
    if (nameMatch) {
        cardholder = nameMatch[1].trim();
    }

    // Detectar tipo de tarjeta
    const isVirtual = /con tarjeta virtual/i.test(text);
    const isFisica = /con tarjeta f[ií]sica/i.test(text);
    const cardType = isFisica ? 'física' : 'virtual';
    // MPVT = Mercado Pago Virtual, MPFS = Mercado Pago Física
    const cardLast4 = isFisica && !isVirtual ? 'MPFS' : 'MPVT';

    return { cardholder, cardLast4, cardType };
}

/** Extrae el mes/año del cierre del resumen a partir del header */
function extractStatementPeriod(text: string): { year: number; month: number } {
    const currentYear = new Date().getFullYear();

    // "Este es tu resumen de abril"
    const m = text.match(/resumen de (\w+)/i);
    if (m) {
        const monthName = m[1].toLowerCase();
        const month = MESES_LARGO[monthName];
        if (month) return { year: currentYear, month };
    }

    return { year: currentYear, month: new Date().getMonth() + 1 };
}

/** Parsea la fecha corta DD/mes → YYYY-MM-DD, infiriendo el año del contexto del resumen */
function parseMPDate(raw: string, stmtYear: number, stmtMonth: number): string | null {
    const m = raw.match(/^(\d{1,2})\/(\w{3})/);
    if (!m) return null;

    const day = m[1].padStart(2, '0');
    const monthStr = m[2].toLowerCase();
    const month = MESES_CORTOS[monthStr];
    if (!month) return null;

    // Si el mes de la transacción es posterior al mes del cierre → año anterior
    // Ej: cierre en abril (4), transacción en nov (11) → año anterior
    const monthNum = parseInt(month);
    let year = stmtYear;
    if (monthNum > stmtMonth) {
        year = stmtYear - 1;
    }

    return `${year}-${month}-${day}`;
}

/** Parsea monto argentino de Mercado Pago: "$ 71.075,33" / "-$ 200.000,00" / "US$ 3,19" */
function parseMPAmount(raw: string): number | null {
    if (!raw) return null;
    let s = raw.trim();
    const isNeg = s.includes('-');
    // Quitar $, US$, U$S, espacios, guión
    s = s.replace(/[-\s]/g, '').replace(/U?S?\$S?/gi, '').trim();
    if (!s) return null;
    const normalized = s.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(normalized);
    if (isNaN(n)) return null;
    return isNeg ? -n : n;
}

// ── Filtros de secciones y líneas ──────────────────────────────────────────────

/** Secciones que al detectarlas debemos dejar de parsear consumos */
const STOP_SECTIONS = [
    /impuestos e intereses/i,
    /pagos anticipados/i,
    /ajustes y reembolsos/i,
    /informaci[oó]n adicional/i,
    /ciclo de facturaci[oó]n/i,
    /l[ií]mite$/i,
    /^pagos$/i,
    /tasas e intereses/i,
    /legales$/i,
    /cuestionar resumen/i,
    /compras internacionales/i,
];

/** Sección que debemos ignorar completamente (tiene fechas pero no son consumos) */
const SALDO_ANTERIOR_RE = /composici[oó]n del saldo/i;

/** Líneas individuales que debemos saltar */
const SKIP_LINES_RE: RegExp[] = [
    /^fecha\s+descripci[oó]n/i,       // cabecera de tabla
    /^subtotal/i,
    /^total a pagar/i,
    /saldo del periodo anterior/i,
    /pago de tarjeta/i,                // pagos → no son gastos
    /con tarjeta (virtual|f[ií]sica)/i,// sub-header
    /^consolidado/i,
    /^consumos$/i,
    /^hola,?\s/i,
    /^este es tu resumen/i,
    /mercado\s*pago/i,
    /fecha de cierre/i,
    /fecha de vencimiento/i,
    /m[ií]nimo a pagar/i,
    /^pesos$/i,
    /^d[oó]lares$/i,
    /^cuota$/i,
    /^operaci[oó]n$/i,
    /^saldo\b/i,
    /no ten[eé]s/i,
    /no realizaste/i,
];

// ── Parser principal ───────────────────────────────────────────────────────────

export function parseMercadoPagoTransactions(text: string): ParsedTransaction[] {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
    const { year, month } = extractStatementPeriod(text);
    const transactions: ParsedTransaction[] = [];

    let inConsumos = false;
    let inSaldoAnterior = false;

    for (const line of lines) {
        // ── Detectar sección "Consumos" ──────────────────────────────
        if (/^consumos$/i.test(line)) {
            inConsumos = true;
            inSaldoAnterior = false;
            continue;
        }

        // ── Detectar sub-sección "Con tarjeta virtual/física" → confirma consumos
        if (/con tarjeta (virtual|f[ií]sica)/i.test(line)) {
            inConsumos = true;
            inSaldoAnterior = false;
            continue;
        }

        // ── Detectar "Composición del saldo" → ignorar ───────────────
        if (SALDO_ANTERIOR_RE.test(line)) {
            inSaldoAnterior = true;
            inConsumos = false;
            continue;
        }

        // ── Detectar secciones que cortan los consumos ────────────────
        if (STOP_SECTIONS.some(rx => rx.test(line))) {
            inConsumos = false;
            inSaldoAnterior = false;
            continue;
        }

        // Solo parsear dentro de Consumos
        if (!inConsumos || inSaldoAnterior) continue;
        if (SKIP_LINES_RE.some(rx => rx.test(line))) continue;

        // ── Intentar parsear como fila de transacción ────────────────
        // Debe empezar con fecha DD/mes
        const dateMatch = line.match(/^(\d{1,2}\/\w{3})\b/);
        if (!dateMatch) continue;

        const date = parseMPDate(dateMatch[1], year, month);
        if (!date) continue;

        // Extraer montos: buscar patrones "$XX.XXX,XX" o "US$XX,XX"
        const amountMatches = [...line.matchAll(/-?\s*(?:US?\$S?|\$)\s*[\d]+(?:\.[\d]{3})*,\d{2}/gi)];
        if (amountMatches.length === 0) continue;

        // Determinar ARS vs USD
        let amountARS: number | null = null;
        let amountUSD: number | null = null;

        for (const am of amountMatches) {
            const raw = am[0];
            const val = parseMPAmount(raw);
            if (val === null) continue;
            if (/US/i.test(raw)) {
                amountUSD = val;
            } else {
                amountARS = val;
            }
        }

        // Descartar pagos/devoluciones (montos negativos)
        const arsVal = amountARS ?? 0;
        const usdVal = amountUSD ?? 0;
        if (arsVal <= 0 && usdVal <= 0) continue;

        const currency: 'ARS' | 'USD' = (usdVal > 0 && arsVal === 0) ? 'USD' : 'ARS';
        const amount = currency === 'USD' ? Math.abs(usdVal) : Math.abs(arsVal);
        if (amount === 0) continue;

        // ── Extraer descripción ──────────────────────────────────────
        // Tomar todo entre la fecha y el final, luego limpiar
        let desc = line.substring(dateMatch[0].length).trim();

        // Quitar montos
        for (const am of amountMatches) {
            desc = desc.replace(am[0], '');
        }

        // Quitar número de operación (5-7 dígitos sueltos)
        desc = desc.replace(/\b\d{5,7}\b/g, '');

        // Extraer y quitar cuotas ("5 de 6", "1 de 9")
        desc = desc.replace(/\b\d+\s+de\s+\d+\b/g, '');

        // Limpiar espacios y caracteres sobrantes
        desc = desc.replace(/\s{2,}/g, ' ').trim();

        if (!desc || desc.length < 3) continue;

        transactions.push({
            id: crypto.randomUUID(),
            description: desc,
            amount,
            currency,
            date,
            rawLine: line,
        });
    }

    // Deduplicar por fecha + descripción + monto
    const seen = new Set<string>();
    return transactions.filter(t => {
        const key = `${t.date}|${t.description}|${t.amount}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
