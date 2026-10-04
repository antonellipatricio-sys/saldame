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
