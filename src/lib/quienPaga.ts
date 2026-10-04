/**
 * quienPaga — única fuente de verdad sobre "¿de quién es este gasto?".
 *
 * Modelo (sin cambios en Firestore):
 *  - `responsable`: dueño del gasto. Vacío = el dueño de la app ("Yo").
 *  - `sharedWith`: partes que pagan otras personas; el dueño se queda con el resto.
 *
 * Todo lo que no es del dueño de la app es plata que le deben.
 * El titular de la tarjeta (`cardholder`) es solo informativo.
 */
import type { Expense, Responsable, SharedParticipant } from '@/types';

const OWNER_ID = 'resp-patricio';
const OWNER_FALLBACK = 'Patricio';

/** Nombre del dueño de la app (el responsable 'resp-patricio', aunque lo hayan renombrado). */
export function ownerName(responsables: Responsable[]): string {
  return responsables.find(r => r.id === OWNER_ID)?.name ?? OWNER_FALLBACK;
}

/**
 * Lleva un nombre suelto (ej. "MARIANA ANTONELLI" del resumen) al responsable
 * del store: coincidencia exacta, alias exacto o alias igual al primer nombre.
 */
export function canonicalName(name: string, responsables: Responsable[]): string {
  const n = name.toLowerCase().trim();
  if (!n) return name;
  const first = n.split(/\s+/)[0];
  // Los responsables con alias son los "canónicos"; los creados solos al
  // importar (ej. "MARIANA ANTONELLI", sin alias) se resuelven hacia ellos.
  const match =
    responsables.find(r => r.aliases?.length && r.name.toLowerCase() === n) ??
    responsables.find(r => r.aliases?.includes(n)) ??
    responsables.find(r => r.aliases?.includes(first)) ??
    responsables.find(r => r.name.toLowerCase() === n);
  return match?.name ?? name.trim();
}

export function isOwner(name: string | undefined, responsables: Responsable[]): boolean {
  if (!name) return true;
  return canonicalName(name, responsables) === ownerName(responsables);
}

export interface Parte {
  persona: string;
  amount: number;
}

/** Cómo se reparte un gasto entre personas (nombres canónicos, montos que suman el total). */
export function reparto(e: Pick<Expense, 'amount' | 'responsable' | 'sharedWith'>, responsables: Responsable[]): Parte[] {
  const dueño = e.responsable ? canonicalName(e.responsable, responsables) : ownerName(responsables);
  const partes = new Map<string, number>();
  let resto = e.amount;
  for (const p of e.sharedWith ?? []) {
    if (!p.responsable || !p.amount) continue;
    const persona = canonicalName(p.responsable, responsables);
    partes.set(persona, (partes.get(persona) ?? 0) + p.amount);
    resto -= p.amount;
  }
  partes.set(dueño, (partes.get(dueño) ?? 0) + resto);
  return [...partes.entries()]
    .filter(([, amount]) => Math.abs(amount) > 0.005)
    .map(([persona, amount]) => ({ persona, amount }));
}

/** Estado simplificado para el selector de un toque. */
export type Modo =
  | { tipo: 'yo' }
  | { tipo: 'todo'; persona: string }
  | { tipo: 'mitad'; persona: string }
  | { tipo: 'custom' };

export function modoDe(e: Pick<Expense, 'amount' | 'responsable' | 'sharedWith'>, responsables: Responsable[]): Modo {
  const owner = ownerName(responsables);
  const partes = reparto(e, responsables);
  const otros = partes.filter(p => p.persona !== owner);
  if (otros.length === 0) return { tipo: 'yo' };
  if (partes.length === 1) return { tipo: 'todo', persona: otros[0].persona };
  if (partes.length === 2 && otros.length === 1 && Math.abs(otros[0].amount - e.amount / 2) < 0.01) {
    return { tipo: 'mitad', persona: otros[0].persona };
  }
  return { tipo: 'custom' };
}

export interface Asignacion {
  responsable?: string;
  sharedWith?: SharedParticipant[];
}

/** Valores a guardar para un modo dado. `undefined` = borrar el campo. */
export function asignar(modo: Exclude<Modo, { tipo: 'custom' }>, amount: number, responsables: Responsable[]): Asignacion {
  const owner = ownerName(responsables);
  switch (modo.tipo) {
    case 'yo':
      return { responsable: owner, sharedWith: undefined };
    case 'todo':
      return { responsable: modo.persona, sharedWith: undefined };
    case 'mitad':
      return {
        responsable: owner,
        sharedWith: [{ responsable: modo.persona, amount: Math.round((amount / 2) * 100) / 100 }],
      };
  }
}

/** Personas a ofrecer en el selector: todas menos el dueño y los duplicados por alias. */
export function personasAsignables(responsables: Responsable[]): Responsable[] {
  const owner = ownerName(responsables);
  return responsables.filter(r => r.name !== owner && canonicalName(r.name, responsables) === r.name);
}

// ── Reglas "Siempre" ─────────────────────────────────────────────────────────

/**
 * Clave estable de una descripción: sin cuotas ni números de cuota, para que
 * "MERPAGO*FRAVEGA C.04/06" y "MERPAGO*FRAVEGA C.05/06" den lo mismo.
 */
export function claveDescripcion(description: string): string {
  return description
    .toLowerCase()
    .replace(/\bc\.\s?\d{1,2}\/\d{1,2}\b/g, ' ')      // C.04/06
    .replace(/\bcuota\s*\d{1,2}\s*\/\s*\d{1,2}\b/g, ' ') // cuota 4/6
    .replace(/\b\d{1,2}\s*de\s*\d{1,2}\b/g, ' ')       // 4 de 6
    .replace(/\b\d{1,2}\/\d{1,2}\b/g, ' ')             // 04/06
    .replace(/\s+/g, ' ')
    .trim();
}

interface ReglaLike {
  patron: string;
  tipo: 'todo' | 'mitad';
  persona: string;
}

/** La regla que aplica a una descripción (el patrón más largo gana). */
export function reglaPara<R extends ReglaLike>(description: string, reglas: R[]): R | undefined {
  const clave = claveDescripcion(description);
  if (!clave) return undefined;
  return reglas
    .filter(r => r.patron && clave.includes(r.patron))
    .sort((a, b) => b.patron.length - a.patron.length)[0];
}

/** Asignación que corresponde a un gasto según las reglas, o undefined si ninguna aplica. */
export function asignacionPorRegla(
  e: { description: string; amount: number },
  reglas: ReglaLike[],
  responsables: Responsable[],
): Asignacion | undefined {
  const r = reglaPara(e.description, reglas);
  if (!r) return undefined;
  return asignar({ tipo: r.tipo, persona: r.persona }, e.amount, responsables);
}
