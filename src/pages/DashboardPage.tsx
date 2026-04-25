import { useEffect, useMemo } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
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

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const summary = useMemo(
    () => getMonthSummary(currentYear, currentMonth),
    [getMonthSummary, currentYear, currentMonth, expenses]
  );

  // Resumen del mes anterior para comparativa
  const prevDate = subMonths(currentDate, 1);
  const prevSummary = useMemo(
    () => getMonthSummary(prevDate.getFullYear(), prevDate.getMonth()),
    [getMonthSummary, prevDate, expenses]
  );

  const monthName = format(currentDate, 'MMMM yyyy', { locale: es });
  const prevMonthName = format(prevDate, 'MMMM', { locale: es });

  // Gastos recientes
  const recentExpenses = useMemo(() => expenses.slice(0, 5), [expenses]);

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

  // Gastos del mes
  const monthExpenseCount = useMemo(() =>
    expenses.filter(exp => {
      const d = new Date(exp.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }).length,
    [expenses, currentYear, currentMonth]
  );

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-brand-primary capitalize">Resumen de {monthName}</h1>
        <p className="text-brand-text mt-1">Tu control financiero del mes</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total ARS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Total en Pesos</p>
              <p className="text-3xl font-bold text-brand-success mt-2">
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
            </div>
            <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-brand-primary" />
            </div>
          </div>
        </div>

        {/* Total USD */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Total en Dólares</p>
              <p className="text-3xl font-bold text-brand-success mt-2">
                US$ {summary.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-brand-primary" />
            </div>
          </div>
        </div>

        {/* Total Gastos */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Gastos del Mes</p>
              <p className="text-3xl font-bold text-brand-success mt-2">
                {monthExpenseCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-brand-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de barras por categoría */}
      {sortedCategories.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-brand-primary mb-5">Gastos por Categoría</h2>
          <div className="space-y-3">
            {sortedCategories.map(([cat, amount]) => {
              const pct = maxCategoryAmount > 0 ? (amount / maxCategoryAmount) * 100 : 0;
              const catObj = categories.find(c => c.name === cat);
              const color = getCatColor(cat);
              return (
                <div key={cat} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      {catObj?.icon && <span>{catObj.icon}</span>}
                      {cat}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      ${amount.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparativa mes a mes */}
      {comparison.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-brand-primary mb-1">Comparativa Mensual</h2>
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

      {/* Recent Expenses */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-brand-primary mb-4">Últimos Gastos</h2>

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
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{expense.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">
                      {format(new Date(expense.date), 'dd/MM/yyyy', { locale: es })}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{expense.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">
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
