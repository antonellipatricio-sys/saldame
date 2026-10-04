import type { Responsable } from '@/types';
import { canonicalName } from '@/lib/quienPaga';

/**
 * Dado el nombre completo de un titular (extraído del PDF/Excel), devuelve
 * el nombre canónico del responsable en el store: por nombre exacto o por
 * alias (ej. "MARIANA ANTONELLI" → "Maru" si "mariana" es alias de Maru).
 *
 * Si no hay coincidencia, retorna undefined para que el caller
 * auto-cree el responsable con el nombre completo del titular.
 */
export function resolveCardholder(
  cardholderName: string,
  responsables: Responsable[],
): string | undefined {
  const n = cardholderName.trim();
  if (!n) return undefined;
  const canonical = canonicalName(n, responsables);
  return responsables.some(r => r.name === canonical) ? canonical : undefined;
}
