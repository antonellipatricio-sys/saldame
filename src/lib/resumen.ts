/**
 * "Resumen" = mes de vencimiento del resumen de tarjeta en que se cobra un gasto
 * ('yyyy-MM'). Una cuota 4/6 de una compra de mayo cae en el resumen de agosto.
 * Los gastos cargados antes de este campo usan el mes de la fecha de compra.
 */
import { addMonths, format } from 'date-fns';
import type { Expense } from '@/types';

export function mesResumen(e: Pick<Expense, 'date' | 'resumen'>): string {
  return e.resumen ?? format(new Date(e.date), 'yyyy-MM');
}

/** Resumen por defecto al importar: el vencimiento si se conoce, si no el mes siguiente al último consumo. */
export function resumenPorDefecto(fechas: string[], vencimiento?: string): string {
  if (vencimiento) return vencimiento.slice(0, 7);
  const ultima = fechas.filter(Boolean).sort().at(-1);
  return format(addMonths(ultima ? new Date(ultima + 'T12:00:00') : new Date(), 1), 'yyyy-MM');
}
