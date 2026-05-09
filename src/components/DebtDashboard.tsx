/**
 * DebtDashboard — Vista consolidada de deuda real por persona.
 *
 * Dinámico: muestra todos los responsables únicos encontrados en los gastos,
 * excepto 'Patricio' (el titular). Agrupa en:
 *  - Consumos propios: gastos en su tarjeta asignada
 *  - En tarjeta de Patricio: gastos de tarjeta 1204/1884 con responsable === persona
 *  - Gastos compartidos: gastos de otro responsable donde esta persona aparece en sharedWith
 *
 * Para el titular del gasto (quien lo dividió):
 *  - Su total se muestra como NETO (restando lo que van a pagar otros)
 *  - Se muestra sección "💳 Gastos divididos" con el detalle del split
 */
import { useMemo, useState } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Expense } from '@/types';

const PATRICIO_CARDS = ['1204', '1884'];
const CARD_OWNER: Record<string, string> = {}; // sin mapeo automático; se deduce por campo responsable

/** Deduce el responsable si el campo no está seteado en el gasto */
function getResponsable(e: Expense): string {
  if (e.responsable) return e.responsable;
  const owner = CARD_OWNER[e.cardLast4 ?? ''];
  if (owner) return owner;
  if (PATRICIO_CARDS.includes(e.cardLast4 ?? '')) return 'Patricio';
  return e.cardholder ?? 'Patricio';
}

// Paleta de colores para personas dinámicas
const COLOR_PALETTE = [
  { colorClass: 'text-rose-600',    bgClass: 'bg-rose-50'    },
  { colorClass: 'text-violet-600',  bgClass: 'bg-violet-50'  },
  { colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50' },
  { colorClass: 'text-amber-600',   bgClass: 'bg-amber-50'   },
  { colorClass: 'text-sky-600',     bgClass: 'bg-sky-50'     },
  { colorClass: 'text-pink-600',    bgClass: 'bg-pink-50'    },
];

// Orden preferido para mostrar personas conocidas primero
const PREFERRED_ORDER = ['Patricio', 'Maru', 'Bren'];

function sumExpenses(exps: Expense[]) {
  return {
    totalARS: exps.filter(e => e.currency === 'ARS').reduce((s, e) => s + e.amount, 0),
    totalUSD: exps.filter(e => e.currency === 'USD').reduce((s, e) => s + e.amount, 0),
  };
}

/** Porción de un gasto compartido que le corresponde a una persona */
interface SharedEntry {
  expense: Expense;
  amount: number;
  paidBy: string; // responsable del gasto original
}

/** Gasto que este responsable dividió con otros */
interface SplitEntry {
  expense: Expense;
  participants: { responsable: string; amount: number }[];
  netAmount: number; // monto neto del titular (expense.amount - suma de participantes)
}

function sumShared(entries: SharedEntry[], currency: 'ARS' | 'USD') {
  return entries
    .filter(e => e.expense.currency === currency)
    .reduce((s, e) => s + e.amount, 0);
}

interface Props {
  filterMonth?: string;
}

export function DebtDashboard({ filterMonth }: Props) {
  const { expenses } = useExpenseStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    if (!filterMonth) return expenses;
    return expenses.filter(e => format(new Date(e.date), 'yyyy-MM') === filterMonth);
  }, [expenses, filterMonth]);

  const personas = useMemo(() => {
    // Recopilar todos los responsables únicos (de gastos directos + de sharedWith)
    const allResponsables = new Set<string>();
    for (const e of filtered) {
      allResponsables.add(getResponsable(e));
      for (const p of e.sharedWith ?? []) {
        allResponsables.add(p.responsable);
      }
    }

    // Ordenar: conocidos primero en orden preferido, luego el resto
    const sorted = [
      ...PREFERRED_ORDER.filter(p => allResponsables.has(p)),
      ...[...allResponsables].filter(p => !PREFERRED_ORDER.includes(p)).sort(),
    ];

    return sorted.map((persona, idx) => {
      const colors = COLOR_PALETTE[idx % COLOR_PALETTE.length];

      const ownCards = Object.entries(CARD_OWNER)
        .filter(([, owner]) => owner === persona)
        .map(([last4]) => last4);

      const propios = filtered.filter(
        e => ownCards.length > 0 && ownCards.includes(e.cardLast4 ?? '') && getResponsable(e) === persona
      );
      const enPatricio = filtered.filter(
        e => PATRICIO_CARDS.includes(e.cardLast4 ?? '') && getResponsable(e) === persona
      );
      const otrosTitulares = filtered.filter(
        e =>
          !ownCards.includes(e.cardLast4 ?? '') &&
          !PATRICIO_CARDS.includes(e.cardLast4 ?? '') &&
          getResponsable(e) === persona
      );

      // Gastos compartidos con esta persona (de cualquier otro responsable)
      const sharedEntries: SharedEntry[] = [];
      for (const e of filtered) {
        if (getResponsable(e) === persona) continue; // ya contados arriba
        for (const p of e.sharedWith ?? []) {
          if (p.responsable === persona) {
            sharedEntries.push({ expense: e, amount: p.amount, paidBy: getResponsable(e) });
          }
        }
      }

      // Gastos que este responsable dividió con otros (para mostrar desglose neto)
      const splitEntries: SplitEntry[] = filtered
        .filter(e => getResponsable(e) === persona && (e.sharedWith ?? []).length > 0)
        .map(e => {
          const participants = e.sharedWith!;
          const sharedTotal = participants.reduce((s, p) => s + p.amount, 0);
          return { expense: e, participants, netAmount: e.amount - sharedTotal };
        });

      // Calcular cuánto se descuenta del total del titular por gastos que dividió
      const splitDeductionARS = splitEntries
        .filter(s => s.expense.currency === 'ARS')
        .reduce((sum, s) => sum + (s.expense.amount - s.netAmount), 0);
      const splitDeductionUSD = splitEntries
        .filter(s => s.expense.currency === 'USD')
        .reduce((sum, s) => sum + (s.expense.amount - s.netAmount), 0);

      const propiosTotals = sumExpenses(propios);
      const patricioTotals = sumExpenses(enPatricio);
      const otrosTotals = sumExpenses(otrosTitulares);
      const sharedTotals = {
        totalARS: sumShared(sharedEntries, 'ARS'),
        totalUSD: sumShared(sharedEntries, 'USD'),
      };

      // Total neto: suma de todas las secciones, menos lo que otros le van a devolver
      const totalARS = propiosTotals.totalARS + patricioTotals.totalARS + otrosTotals.totalARS
        + sharedTotals.totalARS - splitDeductionARS;
      const totalUSD = propiosTotals.totalUSD + patricioTotals.totalUSD + otrosTotals.totalUSD
        + sharedTotals.totalUSD - splitDeductionUSD;

      return {
        persona,
        ...colors,
        propios,
        enPatricio,
        otrosTitulares,
        sharedEntries,
        splitEntries,
        propiosTotals,
        patricioTotals,
        otrosTotals,
        sharedTotals,
        splitDeductionARS,
        splitDeductionUSD,
        totalARS,
        totalUSD,
      };
    });
  }, [filtered]);

  const toggle = (persona: string, section: string) => {
    const key = `${persona}-${section}`;
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (personas.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800">Deudas por Persona</h2>
          <p className="text-xs text-slate-500">
            Total a cobrar{filterMonth ? ` · ${filterMonth}` : ''}
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {personas.map(p => (
          <div key={p.persona} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm', p.bgClass, p.colorClass)}>
                  {p.persona.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-slate-800 text-lg">{p.persona}</span>
              </div>
              <div className="text-right">
                {p.totalARS > 0 && (
                  <p className={cn('text-lg font-bold', p.colorClass)}>
                    ${p.totalARS.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
                  </p>
                )}
                {p.totalUSD > 0 && (
                  <p className={cn('text-base font-bold', p.colorClass)}>
                    US$ {p.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">USD</span>
                  </p>
                )}
                {p.totalARS === 0 && p.totalUSD === 0 && (
                  <p className="text-slate-400 text-sm">Sin consumos</p>
                )}
              </div>
            </div>

            {p.propios.length > 0 && (
              <DebtSection
                label="Consumos propios"
                expenses={p.propios}
                totals={p.propiosTotals}
                expanded={!!expanded[`${p.persona}-propios`]}
                onToggle={() => toggle(p.persona, 'propios')}
                badgeClass="bg-slate-100 text-slate-600"
              />
            )}

            {p.enPatricio.length > 0 && (
              <DebtSection
                label={p.persona === 'Patricio' ? 'Tarjeta propia' : 'En tarjeta de Patricio'}
                expenses={p.enPatricio}
                totals={p.patricioTotals}
                expanded={!!expanded[`${p.persona}-patricio`]}
                onToggle={() => toggle(p.persona, 'patricio')}
                badgeClass="bg-amber-100 text-amber-700"
              />
            )}

            {p.otrosTitulares.length > 0 && (
              <DebtSection
                label="Otros gastos asignados"
                expenses={p.otrosTitulares}
                totals={p.otrosTotals}
                expanded={!!expanded[`${p.persona}-otros`]}
                onToggle={() => toggle(p.persona, 'otros')}
                badgeClass="bg-sky-100 text-sky-700"
              />
            )}

            {p.sharedEntries.length > 0 && (
              <SharedSection
                entries={p.sharedEntries}
                totals={p.sharedTotals}
                expanded={!!expanded[`${p.persona}-shared`]}
                onToggle={() => toggle(p.persona, 'shared')}
              />
            )}

            {p.splitEntries.length > 0 && (
              <SplitSection
                entries={p.splitEntries}
                deductionARS={p.splitDeductionARS}
                deductionUSD={p.splitDeductionUSD}
                expanded={!!expanded[`${p.persona}-split`]}
                onToggle={() => toggle(p.persona, 'split')}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sección estándar (gastos completos) ─────────────────────────────────────

interface DebtSectionProps {
  label: string;
  expenses: Expense[];
  totals: { totalARS: number; totalUSD: number };
  expanded: boolean;
  onToggle: () => void;
  badgeClass: string;
}

function DebtSection({ label, expenses, totals, expanded, onToggle, badgeClass }: DebtSectionProps) {
  return (
    <div className="rounded-lg border border-slate-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-sm"
      >
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', badgeClass)}>{label}</span>
          <span className="text-slate-500">{expenses.length} consumos</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            {totals.totalARS > 0 && (
              <span className="font-semibold text-slate-700 mr-2">${totals.totalARS.toLocaleString('es-AR')} ARS</span>
            )}
            {totals.totalUSD > 0 && (
              <span className="font-semibold text-slate-700">US$ {totals.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            )}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-slate-50">
          {expenses.map(e => (
            <div key={e.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="text-slate-700 truncate">{e.description}</p>
                <p className="text-xs text-slate-400">
                  {format(new Date(e.date), 'dd/MM/yyyy')}
                  {e.cardLast4 && <> · ···{e.cardLast4}</>}
                </p>
              </div>
              <p className="font-medium text-slate-700 ml-4 shrink-0">
                {e.currency === 'ARS' ? '$' : 'US$'} {e.amount.toLocaleString('es-AR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sección gastos compartidos (porción que le corresponde a esta persona) ──

interface SharedSectionProps {
  entries: SharedEntry[];
  totals: { totalARS: number; totalUSD: number };
  expanded: boolean;
  onToggle: () => void;
}

function SharedSection({ entries, totals, expanded, onToggle }: SharedSectionProps) {
  return (
    <div className="rounded-lg border border-orange-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-orange-50 hover:bg-orange-100 transition-colors text-sm"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
            👥 Gastos compartidos
          </span>
          <span className="text-slate-500">{entries.length} ítem{entries.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            {totals.totalARS > 0 && (
              <span className="font-semibold text-orange-700 mr-2">+${totals.totalARS.toLocaleString('es-AR')} ARS</span>
            )}
            {totals.totalUSD > 0 && (
              <span className="font-semibold text-orange-700">+US$ {totals.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            )}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-orange-50">
          {entries.map((entry, i) => (
            <div key={`${entry.expense.id}-${i}`} className="flex items-center justify-between px-4 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="text-slate-700 truncate">{entry.expense.description}</p>
                <p className="text-xs text-slate-400">
                  {format(new Date(entry.expense.date), 'dd/MM/yyyy')}
                  {entry.expense.cardLast4 && <> · ···{entry.expense.cardLast4}</>}
                  {' · '}pagado por <span className="font-medium">{entry.paidBy}</span>
                </p>
              </div>
              <p className="font-medium text-orange-700 ml-4 shrink-0">
                {entry.expense.currency === 'ARS' ? '$' : 'US$'} {entry.amount.toLocaleString('es-AR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sección gastos divididos (desglose neto del titular) ────────────────────

interface SplitSectionProps {
  entries: SplitEntry[];
  deductionARS: number;
  deductionUSD: number;
  expanded: boolean;
  onToggle: () => void;
}

function SplitSection({ entries, deductionARS, deductionUSD, expanded, onToggle }: SplitSectionProps) {
  return (
    <div className="rounded-lg border border-violet-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-violet-50 hover:bg-violet-100 transition-colors text-sm"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
            💳 Gastos divididos
          </span>
          <span className="text-slate-500">{entries.length} ítem{entries.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-violet-600">
            {deductionARS > 0 && <span className="mr-2">-${deductionARS.toLocaleString('es-AR')} ARS</span>}
            {deductionUSD > 0 && <span>-US$ {deductionUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-violet-50">
          {entries.map((entry, i) => {
            const sharedStr = entry.participants.map(p =>
              `${p.responsable} ${entry.expense.currency === 'ARS' ? '$' : 'US$'}${p.amount.toLocaleString('es-AR')}`
            ).join(' + ');
            return (
              <div key={`${entry.expense.id}-${i}`} className="px-4 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <p className="text-slate-700 truncate flex-1">{entry.expense.description}</p>
                  <p className="font-medium text-slate-500 ml-4 shrink-0 line-through text-xs">
                    {entry.expense.currency === 'ARS' ? '$' : 'US$'} {entry.expense.amount.toLocaleString('es-AR')}
                  </p>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {format(new Date(entry.expense.date), 'dd/MM/yyyy')}
                  {' · '}dividido con {sharedStr}
                  {' · '}tu parte: <span className="font-semibold text-violet-700">
                    {entry.expense.currency === 'ARS' ? '$' : 'US$'} {entry.netAmount.toLocaleString('es-AR')}
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
