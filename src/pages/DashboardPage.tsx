import { useEffect, useMemo, useState } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useDollarRate } from '@/hooks/useDollarRate';
import { format, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Minus, ChevronLeft, ChevronRight, Zap, BarChart2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  'Comida y Restaurantes': '#F97316',
  'Transporte': '#3B82F6',
  'Supermercado': '#22C55E',
  'Salud': '#EF4444',
  'Entretenimiento': '#A855F7',
  'Ropa': '#EC4899',
  'Hogar y Servicios': '#14B8A6',
  'Viajes': '#F59E0B',
  'Trabajo': '#6366F1',
  'Educación': '#06B6D4',
  'Mascotas': '#84CC16',
  'Tecnología': '#8B5CF6',
  'Streaming': '#E11D48',
  'Otros': '#94A3B8',
};

function getCatColor(name: string): string {
  return CATEGORY_COLORS[name] ?? '#94A3B8';
}

export function DashboardPage() {
  const { expenses, categories, fetchExpenses, getMonthSummary, loading } = useExpenseStore();

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const isCurrentMonth = selectedDate.getFullYear() === today.getFullYear() && selectedDate.getMonth() === today.getMonth();

  const navigateMonth = (delta: number) => {
    setSelectedDate(prev => delta > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();

  const summary = useMemo(
    () => getMonthSummary(selectedYear, selectedMonth),
    [getMonthSummary, selectedYear, selectedMonth]
  );

  // Resumen del mes anterior para comparativa
  const prevDate = useMemo(() => subMonths(selectedDate, 1), [selectedDate]);
  const prevSummary = useMemo(
    () => getMonthSummary(prevDate.getFullYear(), prevDate.getMonth()),
    [getMonthSummary, prevDate]
  );

  const monthName = format(selectedDate, 'MMMM yyyy', { locale: es });
  const prevMonthName = format(prevDate, 'MMMM', { locale: es });

  // Gastos recientes del mes seleccionado
  const recentExpenses = useMemo(() =>
    expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      })
      .slice(0, 5),
    [expenses, selectedYear, selectedMonth]
  );

  // Categorías ordenadas por monto
  const sortedCategories = useMemo(() => {
    return Object.entries(summary.byCategory)
      .sort(([, a], [, b]) => b - a);
  }, [summary.byCategory]);

  const maxCategoryAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;

  // Comparativa: diferencia mes a mes por categoría (top 5)
  const comparison = useMemo(() => {
    const allCats = new Set([
      ...Object.keys(summary.byCategory),
      ...Object.keys(prevSummary.byCategory),
    ]);

    return Array.from(allCats).map(cat => ({
      name: cat,
      current: summary.byCategory[cat] || 0,
      previous: prevSummary.byCategory[cat] || 0,
      diff: (summary.byCategory[cat] || 0) - (prevSummary.byCategory[cat] || 0),
      pct: prevSummary.byCategory[cat]
        ? Math.round(((summary.byCategory[cat] || 0) - prevSummary.byCategory[cat]) / prevSummary.byCategory[cat] * 100)
        : null,
    }))
      .filter(c => c.current > 0 || c.previous > 0)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 6);
  }, [summary.byCategory, prevSummary.byCategory]);

  // Delta total ARS
  const arsChange = summary.totalARS - prevSummary.totalARS;
  const arsPct = prevSummary.totalARS > 0
    ? Math.round((arsChange / prevSummary.totalARS) * 100)
    : null;

  // Gastos del mes seleccionado
  const monthExpenseCount = useMemo(() =>
    expenses.filter(exp => {
      const d = new Date(exp.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    }).length,
    [expenses, selectedYear, selectedMonth]
  );

  // ── Nuevas features ──
  const { budgets } = useBudgetStore();
  const dollar = useDollarRate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Gastos del mes actual (para cálculos)
  const monthExpenses = useMemo(() =>
    expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    }),
    [expenses, selectedYear, selectedMonth]
  );

  // Top 5 gastos individuales del mes (por monto ARS)
  const topExpenses = useMemo(() =>
    [...monthExpenses]
      .filter(e => e.currency === 'ARS')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5),
    [monthExpenses]
  );

  // Gastos fijos vs variables (tag "Gastos Fijos")
  const FIXED_TAG = 'Gastos Fijos';
  const fixedARS = useMemo(() =>
    monthExpenses.filter(e => e.currency === 'ARS' && e.tags?.includes(FIXED_TAG))
      .reduce((s, e) => s + e.amount, 0),
    [monthExpenses]
  );
  const variableARS = useMemo(() =>
    summary.totalARS - fixedARS,
    [summary.totalARS, fixedARS]
  );
  const fixedPct = summary.totalARS > 0 ? Math.round((fixedARS / summary.totalARS) * 100) : 0;

  // Drill-down: gastos de la categoría seleccionada en el mes
  const drillExpenses = useMemo(() => {
    if (!selectedCategory) return [];
    return monthExpenses
      .filter(e => e.category === selectedCategory)
      .sort((a, b) => b.amount - a.amount);
  }, [monthExpenses, selectedCategory]);

  // Total en ARS equivalente (USD convertido al tipo de cambio blue)
  const totalARSEquivalent = useMemo(() => {
    if (!dollar.sell || dollar.sell === 0) return null;
    return summary.totalARS + summary.totalUSD * dollar.sell;
  }, [summary.totalARS, summary.totalUSD, dollar.sell]);

  if (loading && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando gastos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header con navegación de mes */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold text-brand-primary capitalize">Resumen de {monthName}</h1>
          <p className="text-brand-text mt-1">Tu control financiero del mes</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          {isCurrentMonth && (
            <span className="hidden md:inline text-xs font-semibold bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full">
              Mes actual
            </span>
          )}
          <div className="flex items-center justify-between gap-1 w-full md:w-auto">
            <button
              onClick={() => navigateMonth(-1)}
              className="w-11 h-11 md:w-auto md:h-auto md:p-2 flex items-center justify-center rounded-lg border border-slate-200 bg-white md:bg-transparent hover:bg-slate-100 text-slate-600 transition-colors"
              title="Mes anterior"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
            </button>
            <div className="md:hidden text-center">
              <p className="text-lg font-bold text-brand-primary capitalize leading-tight">{monthName}</p>
              {isCurrentMonth && <p className="text-xs text-slate-500">Mes actual</p>}
            </div>
            <button
              onClick={() => navigateMonth(1)}
              disabled={isCurrentMonth}
              className="w-11 h-11 md:w-auto md:h-auto md:p-2 flex items-center justify-center rounded-lg border border-slate-200 bg-white md:bg-transparent hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Mes siguiente"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards — 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total ARS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-slate-600 font-medium">Total en Pesos</p>
              <p className="text-xl md:text-2xl font-bold text-brand-success mt-1 tabular-nums break-words">
                ${summary.totalARS.toLocaleString('es-AR')}
              </p>
              {arsPct !== null && (
                <div className={cn('flex items-center gap-1 mt-1 text-xs font-medium',
                  arsChange > 0 ? 'text-red-500' : arsChange < 0 ? 'text-green-500' : 'text-slate-400'
                )}>
                  {arsChange > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> :
                    arsChange < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> :
                      <Minus className="w-3.5 h-3.5" />}
                  {arsChange > 0 ? '+' : ''}{arsPct}% vs {prevMonthName}
                </div>
              )}
              {totalARSEquivalent !== null && summary.totalUSD > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  ≈ ${totalARSEquivalent.toLocaleString('es-AR')} total unificado
                </p>
              )}
            </div>
            <div className="hidden md:flex w-10 h-10 bg-brand-primary/10 rounded-full items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-brand-primary" />
            </div>
          </div>
        </div>

        {/* Total USD */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-slate-600 font-medium">Total en Dólares</p>
              <p className="text-xl md:text-2xl font-bold text-brand-success mt-1 tabular-nums break-words">
                US$ {summary.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="hidden md:flex w-10 h-10 bg-brand-primary/10 rounded-full items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-brand-primary" />
            </div>
          </div>
        </div>

        {/* Gastos del Mes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-slate-600 font-medium">Gastos del Mes</p>
              <p className="text-xl md:text-2xl font-bold text-brand-success mt-1 tabular-nums break-words">
                {monthExpenseCount}
              </p>
            </div>
            <div className="hidden md:flex w-10 h-10 bg-brand-primary/10 rounded-full items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-brand-primary" />
            </div>
          </div>
        </div>

        {/* Dólar Blue */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5 min-w-0 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-slate-600 font-medium">Dólar Blue</p>
              {dollar.loading ? (
                <p className="text-lg font-semibold text-slate-400 mt-1">Cargando…</p>
              ) : dollar.error ? (
                <p className="text-sm text-slate-400 mt-1">No disponible</p>
              ) : (
                <>
                  <p className="text-xl md:text-2xl font-bold text-brand-primary mt-1 tabular-nums">
                    ${dollar.sell.toLocaleString('es-AR')}
                  </p>
                  <p className="text-xs text-slate-400">compra ${dollar.buy.toLocaleString('es-AR')}</p>
                </>
              )}
            </div>
            <div className="hidden md:flex w-10 h-10 bg-blue-50 rounded-full items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">$</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fijos vs Variables + Top Gastos — 2 col grid */}
      {monthExpenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Gastos Fijos vs Variables */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-brand-primary" />
              <h2 className="text-base font-bold text-brand-primary">Fijos vs Variables</h2>
            </div>
            {summary.totalARS === 0 ? (
              <p className="text-sm text-slate-400">Sin gastos en ARS este mes</p>
            ) : (
              <>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-brand-primary transition-all duration-500"
                    style={{ width: `${fixedPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-primary mr-1.5" />
                    <span className="font-semibold text-slate-700">Fijos</span>
                    <p className="text-xs text-slate-500 mt-0.5">${fixedARS.toLocaleString('es-AR')} ({fixedPct}%)</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-200 mr-1.5" />
                    <span className="font-semibold text-slate-700">Variables</span>
                    <p className="text-xs text-slate-500 mt-0.5">${variableARS.toLocaleString('es-AR')} ({100 - fixedPct}%)</p>
                  </div>
                </div>
                {fixedARS === 0 && (
                  <p className="text-xs text-slate-400 mt-2">Etiquetá gastos con "Gastos Fijos" para ver la división</p>
                )}
              </>
            )}
          </div>

          {/* Top 5 Gastos Individuales */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5 text-brand-primary" />
              <h2 className="text-base font-bold text-brand-primary">Top Gastos del Mes</h2>
            </div>
            {topExpenses.length === 0 ? (
              <p className="text-sm text-slate-400">Sin gastos ARS este mes</p>
            ) : (
              <div className="space-y-2">
                {topExpenses.map((e, i) => (
                  <div key={e.id} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{e.description}</p>
                      <p className="text-xs text-slate-400">{e.category}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900 flex-shrink-0">
                      ${e.amount.toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Presupuestos por categoría (solo si hay alguno configurado) */}
      {Object.keys(budgets).length > 0 && sortedCategories.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-brand-primary mb-5">Presupuestos</h2>
          <div className="space-y-4">
            {sortedCategories
              .filter(([cat]) => budgets[cat] !== undefined)
              .map(([cat, spent]) => {
                const budget = budgets[cat];
                const pct = Math.min(Math.round((spent / budget) * 100), 100);
                const over = spent > budget;
                const catObj = categories.find(c => c.name === cat);
                return (
                  <div key={cat}>
                    <div className="flex flex-wrap items-center justify-between gap-x-3 mb-1">
                      <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        {catObj?.icon} {cat}
                      </span>
                      <span className={cn('text-sm font-bold', over ? 'text-brand-alert' : 'text-slate-700')}>
                        ${spent.toLocaleString('es-AR')} / ${budget.toLocaleString('es-AR')}
                        {over && <span className="ml-1 text-xs">⚠️ Excedido</span>}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', over ? 'bg-brand-alert' : pct >= 80 ? 'bg-amber-400' : 'bg-brand-success')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{pct}% utilizado</p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Gráfico de barras por categoría (clickeable para drill-down) */}
      {sortedCategories.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-0.5 mb-4 md:mb-5">
            <h2 className="text-lg md:text-xl font-bold text-brand-primary">Gastos por Categoría</h2>
            <span className="text-xs text-slate-400"><span className="md:hidden">Tocá</span><span className="hidden md:inline">Hacé clic</span> para ver detalle</span>
          </div>
          <div className="space-y-3">
            {sortedCategories.map(([cat, amount]) => {
              const pct = maxCategoryAmount > 0 ? (amount / maxCategoryAmount) * 100 : 0;
              const catObj = categories.find(c => c.name === cat);
              const color = getCatColor(cat);
              const isSelected = selectedCategory === cat;
              return (
                <div key={cat}>
                  <button
                    onClick={() => setSelectedCategory(isSelected ? null : cat)}
                    className={cn(
                      'w-full text-left group rounded-lg p-2 -mx-2 transition-colors',
                      isSelected ? 'bg-brand-primary/5' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 min-w-0 truncate">
                        {catObj?.icon && <span>{catObj.icon}</span>}
                        {cat}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          ${amount.toLocaleString('es-AR')}
                        </span>
                        <span className={cn('text-slate-400 transition-transform text-xs', isSelected ? 'rotate-180' : '')}>▾</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
                      />
                    </div>
                  </button>

                  {/* Drill-down de categoría */}
                  {isSelected && (
                    <div className="mt-2 mb-1 border border-slate-100 rounded-xl bg-slate-50 p-3 md:p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-slate-700">{catObj?.icon} {cat} — {format(selectedDate, 'MMMM yyyy', { locale: es })}</p>
                        <button onClick={() => setSelectedCategory(null)} aria-label="Cerrar detalle" className="w-9 h-9 -m-2 flex items-center justify-center text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {drillExpenses.length === 0 ? (
                        <p className="text-sm text-slate-400">Sin gastos</p>
                      ) : (
                        <div className="space-y-2">
                          {drillExpenses.map(e => (
                            <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{e.description}</p>
                                <p className="text-xs text-slate-400">{format(new Date(e.date), 'dd/MM', { locale: es })}{e.cardholder ? ` · ${e.cardholder}` : ''}</p>
                              </div>
                              <span className="text-sm font-bold text-slate-900 ml-3 flex-shrink-0">
                                {e.currency === 'ARS' ? '$' : 'US$'} {e.amount.toLocaleString('es-AR')}
                              </span>
                            </div>
                          ))}
                          <p className="text-xs text-slate-400 text-right pt-1">{drillExpenses.length} transacciones</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparativa mes a mes */}
      {comparison.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-brand-primary mb-1">Comparativa Mensual</h2>
          <p className="text-sm text-brand-text mb-5 capitalize">{monthName} vs {prevMonthName}</p>
          <div className="space-y-3">
            {comparison.map(c => (
              <div key={c.name} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                  <p className="text-xs text-slate-400">
                    Antes: ${c.previous.toLocaleString('es-AR')}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-bold text-slate-900">
                    ${c.current.toLocaleString('es-AR')}
                  </p>
                  <div className={cn('flex items-center gap-0.5 text-xs font-medium justify-end',
                    c.current === 0 ? 'text-brand-alert' :
                      c.diff > 0 ? 'text-red-500' : c.diff < 0 ? 'text-brand-success' : 'text-slate-400'
                  )}>
                    {c.diff > 0 ? <ArrowUpRight className="w-3 h-3" /> :
                      c.diff < 0 ? <ArrowDownRight className="w-3 h-3" /> :
                        <Minus className="w-3 h-3" />}
                    {c.pct !== null ? `${c.diff > 0 ? '+' : ''}${c.pct}%` :
                      c.diff > 0 ? 'Nuevo' : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimos Gastos del mes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-brand-primary mb-4">Últimos Gastos del Mes</h2>

        {recentExpenses.length === 0 ? (
          <div className="text-center py-12">
            <TrendingDown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay gastos registrados aún</p>
            <p className="text-sm text-slate-400 mt-1">Comenzá agregando tu primer gasto</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between gap-3 p-3 md:p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{expense.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">
                      {format(new Date(expense.date), 'dd/MM/yyyy', { locale: es })}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{expense.category}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-900 whitespace-nowrap">
                    {expense.currency === 'ARS' ? '$' : 'US$'} {expense.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
