import type { Responsable } from '@/types';

/**
 * Dado el nombre completo de un titular (extraído del PDF/Excel), devuelve
 * el nombre canónico del responsable en el store que coincide EXACTAMENTE
 * (case-insensitive) con ese nombre.
 *
 * Si no hay coincidencia exacta, retorna undefined para que el caller
 * auto-cree el responsable con el nombre completo del titular.
 */
export function resolveCardholder(
  cardholderName: string,
  responsables: Responsable[],
): string | undefined {
  const n = cardholderName.toLowerCase().trim();
  if (!n) return undefined;

  for (const r of responsables) {
    if (r.name.toLowerCase() === n) return r.name;
  }

  return undefined;
}
