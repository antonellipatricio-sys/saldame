import { useExpenseStore } from '@/store/useExpenseStore';
import { asignacionPorRegla, modoDe } from '@/lib/quienPaga';
import type { ReglaPago } from '@/store/useReglasStore';

/**
 * Para pantallas con gastos ya guardados: aplica una regla nueva a los gastos
 * que coinciden y todavía son del dueño ("Yo"). No pisa asignaciones hechas a mano.
 * Devuelve a cuántos gastos se aplicó.
 */
export function useAplicarReglaAGuardados() {
  const { responsables, updateExpense } = useExpenseStore();
  return async (regla: ReglaPago) => {
    const { expenses } = useExpenseStore.getState();
    const pendientes = expenses.filter(e =>
      modoDe(e, responsables).tipo === 'yo' && asignacionPorRegla(e, [regla], responsables)
    );
    for (const e of pendientes) {
      await updateExpense(e.id, asignacionPorRegla(e, [regla], responsables)!);
    }
    return pendientes.length;
  };
}
