/**
 * DebtDashboard — cuánto te debe cada persona.
 *
 * Un número por persona: la suma de sus partes en los gastos (según
 * `reparto`, ver lib/quienPaga) menos lo que ya te devolvió (cobros).
 * El dueño de la app no aparece: lo suyo no es deuda.
 */
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, ChevronDown, ChevronUp, MessageCircle, Undo2, Users } from 'lucide-react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { useCobrosStore, type Cobro } from '@/store/useCobrosStore';
import { ownerName, reparto } from '@/lib/quienPaga';
import { mesResumen } from '@/lib/resumen';
import { cn } from '@/lib/utils';
import type { Expense } from '@/types';

const COLOR_PALETTE = [
  { colorClass: 'text-rose-600',    bgClass: 'bg-rose-50'    },
  { colorClass: 'text-violet-600',  bgClass: 'bg-violet-50'  },
  { colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50' },
  { colorClass: 'text-amber-600',   bgClass: 'bg-amber-50'   },
  { colorClass: 'text-sky-600',     bgClass: 'bg-sky-50'     },
  { colorClass: 'text-pink-600',    bgClass: 'bg-pink-50'    },
];

interface Item {
  expense: Expense;
  amount: number; // parte de esta persona
}

interface Deuda {
  persona: string;
  items: Item[];
  cobros: Cobro[];
  asignadoARS: number;
  asignadoUSD: number;
  pendienteARS: number;
  pendienteUSD: number;
}

const ars = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
const usd = (n: number) => `US$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const money = (n: number, currency: string) => (currency === 'USD' ? usd(n) : ars(n));

function montos(arsN: number, usdN: number) {
  return [arsN > 0.005 && ars(arsN), usdN > 0.005 && usd(usdN)].filter(Boolean).join(' + ');
}

function mensajeWhatsApp(d: Deuda, periodoLabel: string) {
  const lineas = d.items
    .slice()
    .sort((a, b) => new Date(a.expense.date).getTime() - new Date(b.expense.date).getTime())
    .map(({ expense: e, amount }) => {
      const parcial = Math.abs(amount - e.amount) > 0.005 ? ` (tu parte de ${money(e.amount, e.currency)})` : '';
      return `• ${format(new Date(e.date), 'dd/MM')} ${e.description}: ${money(amount, e.currency)}${parcial}`;
    });
  const cobrado = montos(
    d.cobros.reduce((s, c) => s + c.ars, 0),
    d.cobros.reduce((s, c) => s + c.usd, 0),
  );
  return [
    `Hola ${d.persona}! Gastos ${periodoLabel}:`,
    '',
    ...lineas,
    '',
    `Total: ${montos(d.asignadoARS, d.asignadoUSD)}`,
    ...(cobrado ? [`Ya pagado: ${cobrado}`, `Falta: ${montos(d.pendienteARS, d.pendienteUSD) || '$0'}`] : []),
  ].join('\n');
}

interface Props {
  filterMonth?: string;
}

export function DebtDashboard({ filterMonth }: Props) {
  const { expenses, responsables } = useExpenseStore();
  const { cobros, fetchCobros, addCobro, deleteCobro } = useCobrosStore();
  const [abierto, setAbierto] = useState<string | null>(null);

  useEffect(() => { fetchCobros(); }, [fetchCobros]);

  const periodoLabel = filterMonth
    ? `del resumen de ${format(new Date(filterMonth + '-01T12:00:00'), 'MMMM yyyy', { locale: es })}`
    : 'pendientes';

  const deudas = useMemo<Deuda[]>(() => {
    const owner = ownerName(responsables);
    const filtered = filterMonth
      ? expenses.filter(e => mesResumen(e) === filterMonth)
      : expenses;

    const porPersona = new Map<string, Item[]>();
    for (const e of filtered) {
      for (const p of reparto(e, responsables)) {
        if (p.persona === owner) continue;
        if (!porPersona.has(p.persona)) porPersona.set(p.persona, []);
        porPersona.get(p.persona)!.push({ expense: e, amount: p.amount });
      }
    }

    // Sin filtro se descuentan todos los cobros; con filtro, solo los de ese mes.
    const cobrosVigentes = filterMonth ? cobros.filter(c => c.periodo === filterMonth) : cobros;

    return [...porPersona.entries()]
      .map(([persona, items]) => {
        const propios = cobrosVigentes.filter(c => c.persona === persona);
        const asignadoARS = items.filter(i => i.expense.currency === 'ARS').reduce((s, i) => s + i.amount, 0);
        const asignadoUSD = items.filter(i => i.expense.currency === 'USD').reduce((s, i) => s + i.amount, 0);
        return {
          persona,
          items,
          cobros: propios,
          asignadoARS,
          asignadoUSD,
          pendienteARS: asignadoARS - propios.reduce((s, c) => s + c.ars, 0),
          pendienteUSD: asignadoUSD - propios.reduce((s, c) => s + c.usd, 0),
        };
      })
      .sort((a, b) => (b.pendienteARS + b.pendienteUSD * 1000) - (a.pendienteARS + a.pendienteUSD * 1000));
  }, [expenses, responsables, cobros, filterMonth]);

  /**
   * Registra el pago de lo pendiente, partido por mes de resumen: así un
   * "Cobrado" hecho en "Todos los meses" también se descuenta al ver cada mes.
   */
  const marcarCobrado = async (d: Deuda) => {
    const porMes = new Map<string, { ars: number; usd: number }>();
    for (const { expense: e, amount } of d.items) {
      const mes = mesResumen(e);
      const m = porMes.get(mes) ?? { ars: 0, usd: 0 };
      if (e.currency === 'USD') m.usd += amount; else m.ars += amount;
      porMes.set(mes, m);
    }
    // Cobros viejos sin mes ('todos'): se descuentan de los meses más antiguos primero
    const meses = [...porMes.keys()].sort();
    for (const c of cobros) {
      if (c.persona !== d.persona) continue;
      const m = porMes.get(c.periodo);
      if (m) { m.ars -= c.ars; m.usd -= c.usd; continue; }
      if (c.periodo !== 'todos' || filterMonth) continue; // en vista de un mes no se descuentan
      let restoARS = c.ars, restoUSD = c.usd;
      for (const mes of meses) {
        const x = porMes.get(mes)!;
        const a = Math.min(Math.max(0, x.ars), restoARS); x.ars -= a; restoARS -= a;
        const u = Math.min(Math.max(0, x.usd), restoUSD); x.usd -= u; restoUSD -= u;
      }
    }
    const partes = [...porMes.entries()]
      .map(([mes, m]) => ({ mes, ars: Math.max(0, m.ars), usd: Math.max(0, m.usd) }))
      .filter(p => p.ars > 0.005 || p.usd > 0.005);
    if (partes.length === 0) return;
    const totARS = partes.reduce((s, p) => s + p.ars, 0);
    const totUSD = partes.reduce((s, p) => s + p.usd, 0);
    if (!confirm(`¿${d.persona} te pagó ${montos(totARS, totUSD)}?`)) return;
    const lote = crypto.randomUUID();
    for (const p of partes) {
      await addCobro({ persona: d.persona, periodo: p.mes, ars: p.ars, usd: p.usd, lote });
    }
  };

  /** Cobros agrupados por lote (un "Cobrado" = una línea, aunque abarque varios meses). */
  const lotes = (cs: Cobro[]) => {
    const map = new Map<string, Cobro[]>();
    for (const c of cs) {
      const k = c.lote ?? c.id;
      map.set(k, [...(map.get(k) ?? []), c]);
    }
    return [...map.entries()].map(([key, items]) => ({
      key,
      items,
      fecha: items[0].fecha,
      ars: items.reduce((s, c) => s + c.ars, 0),
      usd: items.reduce((s, c) => s + c.usd, 0),
    }));
  };

  if (deudas.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-4 md:px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800">Quién te debe</h2>
          <p className="text-xs text-slate-500">
            {filterMonth ? `Gastos ${periodoLabel}` : 'Todos los meses'}
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {deudas.map((d, idx) => {
          const colors = COLOR_PALETTE[idx % COLOR_PALETTE.length];
          const alDia = d.pendienteARS <= 0.005 && d.pendienteUSD <= 0.005;
          const isOpen = abierto === d.persona;
          return (
            <div key={d.persona} className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0', colors.bgClass, colors.colorClass)}>
                    {d.persona.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    {alDia ? (
                      <p className="font-semibold text-slate-800">
                        {d.persona} <span className="text-emerald-600 text-sm font-medium">✓ al día</span>
                      </p>
                    ) : (
                      <p className="text-slate-800">
                        <span className="font-semibold">{d.persona}</span> te debe{' '}
                        <span className={cn('font-bold text-lg', colors.colorClass)}>
                          {montos(Math.max(0, d.pendienteARS), Math.max(0, d.pendienteUSD))}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-slate-400">
                      {d.items.length} gasto{d.items.length !== 1 ? 's' : ''}
                      {d.cobros.length > 0 && <> · ya pagó {montos(d.cobros.reduce((s, c) => s + c.ars, 0), d.cobros.reduce((s, c) => s + c.usd, 0))}</>}
                    </p>
                  </div>
                </div>

                <div className={cn('grid gap-2 w-full sm:flex sm:w-auto sm:gap-1.5', alDia ? 'grid-cols-2' : 'grid-cols-3')}>
                  <button
                    aria-expanded={isOpen}
                    onClick={() => setAbierto(isOpen ? null : d.persona)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 min-h-[40px] sm:min-h-0 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm sm:text-xs font-medium"
                  >
                    Ver {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp(d, periodoLabel))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 min-h-[40px] sm:min-h-0 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm sm:text-xs font-medium"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                  {!alDia && (
                    <button
                      onClick={() => marcarCobrado(d)}
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 min-h-[40px] sm:min-h-0 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm sm:text-xs font-semibold"
                    >
                      <Check className="w-3.5 h-3.5" /> Cobrado
                    </button>
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="rounded-lg border border-slate-100 divide-y divide-slate-50">
                  {d.items
                    .slice()
                    .sort((a, b) => new Date(b.expense.date).getTime() - new Date(a.expense.date).getTime())
                    .map(({ expense: e, amount }, i) => (
                      <div key={`${e.id}-${i}`} className="flex items-center justify-between px-3 sm:px-4 py-2 text-sm gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-700 truncate">{e.description}</p>
                          <p className="text-xs text-slate-400">
                            {format(new Date(e.date), 'dd/MM/yyyy')}
                            {e.cardLast4 && <> · ···{e.cardLast4}</>}
                            {Math.abs(amount - e.amount) > 0.005 && <> · su parte de {money(e.amount, e.currency)}</>}
                          </p>
                        </div>
                        <p className="font-medium text-slate-700 shrink-0">{money(amount, e.currency)}</p>
                      </div>
                    ))}
                  {lotes(d.cobros).map(l => (
                    <div key={l.key} className="flex items-center justify-between px-3 sm:px-4 py-1 sm:py-2 text-sm gap-3 bg-emerald-50/50">
                      <p className="text-emerald-700 flex-1">
                        Pagó el {format(l.fecha, 'dd/MM/yyyy')}
                      </p>
                      <p className="font-medium text-emerald-700 shrink-0">−{montos(l.ars, l.usd)}</p>
                      <button
                        onClick={async () => {
                          if (!confirm('¿Deshacer este cobro?')) return;
                          for (const c of l.items) await deleteCobro(c.id);
                        }}
                        className="-mr-2 sm:mr-0 w-10 h-10 sm:w-auto sm:h-auto sm:p-1 flex items-center justify-center text-slate-400 hover:text-red-500"
                        title="Deshacer cobro"
                        aria-label="Deshacer cobro"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
