import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Expense } from '@/types';

export function exportExpensesToExcel(expenses: Expense[], filename?: string) {
  const rows = expenses.map((exp) => ({
    Fecha: format(new Date(exp.date), 'dd/MM/yyyy', { locale: es }),
    Descripción: exp.description,
    Monto: exp.amount,
    Moneda: exp.currency,
    Categoría: exp.category,
    Etiquetas: exp.tags?.join(', ') ?? '',
    Tarjeta: exp.cardLast4 ?? '',
    Titular: exp.cardholder ?? '',
    Notas: exp.notes ?? '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Ajustar ancho de columnas
  worksheet['!cols'] = [
    { wch: 12 }, // Fecha
    { wch: 35 }, // Descripción
    { wch: 12 }, // Monto
    { wch: 8 },  // Moneda
    { wch: 22 }, // Categoría
    { wch: 20 }, // Etiquetas
    { wch: 8 },  // Tarjeta
    { wch: 20 }, // Titular
    { wch: 30 }, // Notas
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos');

  const name = filename ?? `gastos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, name);
}
