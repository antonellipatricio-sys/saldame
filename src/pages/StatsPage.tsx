import { useEffect, useMemo, useState } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { BarChart3, PieChart, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function StatsPage() {
  const { expenses, fetchExpenses } = useExpenseStore();

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const today = useMemo(() => new Date(), []);
  const currentMonthKey = format(today, 'yyyy-MM');
  const [filterMonth, setFilterMonth] = useState(currentMonthKey);

  // Meses disponibles para el selector
  const availableMonths = useMemo(() => {
    const months = new Set(expenses.map(exp => format(new Date(exp.date), 'yyyy-MM')));
    return Array.from(months).sort().reverse();
  }, [expenses]);

  // Gastos filtrados por el mes seleccionado (o todos si está vacío)
  const filtered = useMemo(() => {
    if (!filterMonth) return expenses;
    return expenses.filter(exp => format(new Date(exp.date), 'yyyy-MM') === filterMonth);
  }, [expenses, filterMonth]);

  const stats = useMemo(() => {
    const totalExpenses = filtered.length;
    const totalARS = filtered
      .filter((exp) => exp.currency === 'ARS')
      .reduce((sum, exp) => sum + exp.amount, 0);
    const totalUSD = filtered
      .filter((exp) => exp.currency === 'USD')
      .reduce((sum, exp) => sum + exp.amount, 0);

    // Agrupar por categoría: monto ARS + count
    const byCategory: Record<string, { amount: number; count: number }> = {};
    const byTag: Record<string, { amount: number; count: number }> = {};

    filtered.forEach((exp) => {
      if (!byCategory[exp.category]) byCategory[exp.category] = { amount: 0, count: 0 };
      if (exp.currency === 'ARS') byCategory[exp.category].amount += exp.amount;
      byCategory[exp.category].count++;

      if (exp.tags) {
        exp.tags.forEach(tag => {
          if (!byTag[tag]) byTag[tag] = { amount: 0, count: 0 };
          if (exp.currency === 'ARS') byTag[tag].amount += exp.amount;
          byTag[tag].count++;
        });
      }
    });

    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, 5);

    const topTags = Object.entries(byTag)
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, 5);

    const maxCatAmount = topCategories.length > 0 ? topCategories[0][1].amount : 0;
    const maxTagAmount = topTags.length > 0 ? topTags[0][1].amount : 0;

    return { totalExpenses, totalARS, totalUSD, topCategories, topTags, maxCatAmount, maxTagAmount };
  }, [filtered]);

  // Historial mes a mes (siempre sobre todos los gastos)
  const monthlyHistory = useMemo(() => {
    const monthMap: Record<string, { totalARS: number; totalUSD: number; count: number }> = {};
    expenses.forEach(exp => {
      const key = format(new Date(exp.date), 'yyyy-MM');
      if (!monthMap[key]) monthMap[key] = { totalARS: 0, totalUSD: 0, count: 0 };
      if (exp.currency === 'ARS') monthMap[key].totalARS += exp.amount;
      else monthMap[key].totalUSD += exp.amount;
      monthMap[key].count++;
    });

    const sorted = Object.entries(monthMap).sort(([a], [b]) => b.localeCompare(a));
    return sorted.map(([key, data], i) => {
      const prev = sorted[i + 1]?.[1];
      const delta = prev && prev.totalARS > 0
        ? Math.round(((data.totalARS - prev.totalARS) / prev.totalARS) * 100)
        : null;
      return { key, ...data, delta };
    });
  }, [expenses]);

  return (
    <div className="space-y-6">
      {/* Header + Selector de mes */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-brand-primary">Estadísticas</h1>
          <p className="text-brand-text mt-1">Análisis de tus gastos</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary text-sm"
          >
            <option value="">Todos los meses</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>
                {format(new Date(m + '-01T12:00:00'), 'MMMM yyyy', { locale: es })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-brand-primary" />
            </div>
            <p className="text-sm font-medium text-slate-600">Total Gastos</p>
          </div>
          <p className="text-3xl font-bold text-brand-primary">{stats.totalExpenses}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-success/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand-success" />
            </div>
            <p className="text-sm font-medium text-slate-600">Total ARS</p>
          </div>
          <p className="text-3xl font-bold text-brand-success">
            ${stats.totalARS.toLocaleString('es-AR')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Total USD</p>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            US$ {stats.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <PieChart className="w-6 h-6 text-brand-primary" />
          <h2 className="text-xl font-bold text-brand-primary">Top 5 Categorías</h2>
        </div>

        {stats.topCategories.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No hay datos para el período seleccionado</p>
        ) : (
          <div className="space-y-4">
            {stats.topCategories.map(([category, data], index) => {
              const pct = stats.maxCatAmount > 0 ? (data.amount / stats.maxCatAmount) * 100 : 0;
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary font-bold text-xs">
                        {index + 1}
                      </div>
                      <span className="font-medium text-slate-800">{category}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800">${data.amount.toLocaleString('es-AR')}</span>
                      <span className="text-xs text-slate-400 ml-1">({data.count} gastos)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-primary transition-all duration-500"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Tags */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <PieChart className="w-6 h-6 text-brand-secondary" />
          <h2 className="text-xl font-bold text-brand-primary">Top 5 Etiquetas</h2>
        </div>

        {stats.topTags.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No hay etiquetas para el período seleccionado</p>
        ) : (
          <div className="space-y-4">
            {stats.topTags.map(([tag, data], index) => {
              const pct = stats.maxTagAmount > 0 ? (data.amount / stats.maxTagAmount) * 100 : 0;
              return (
                <div key={tag}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-brand-secondary/20 rounded-full flex items-center justify-center text-brand-secondary font-bold text-xs">
                        {index + 1}
                      </div>
                      <span className="font-medium text-slate-800">{tag}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800">${data.amount.toLocaleString('es-AR')}</span>
                      <span className="text-xs text-slate-400 ml-1">({data.count} gastos)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-secondary transition-all duration-500"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historial mes a mes */}
      {monthlyHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-brand-primary" />
            <h2 className="text-xl font-bold text-brand-primary">Historial Mes a Mes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pb-3 text-slate-500 font-semibold">Mes</th>
                  <th className="text-right pb-3 text-slate-500 font-semibold">Total ARS</th>
                  <th className="text-right pb-3 text-slate-500 font-semibold hidden sm:table-cell">Total USD</th>
                  <th className="text-right pb-3 text-slate-500 font-semibold">Gastos</th>
                  <th className="text-right pb-3 text-slate-500 font-semibold">vs ant.</th>
                </tr>
              </thead>
              <tbody>
                {monthlyHistory.map(row => {
                  const isCurrent = row.key === currentMonthKey;
                  return (
                    <tr
                      key={row.key}
                      onClick={() => setFilterMonth(row.key)}
                      className={cn(
                        'border-b border-slate-50 last:border-0 cursor-pointer transition-colors hover:bg-slate-50',
                        filterMonth === row.key && 'bg-brand-primary/5',
                        isCurrent && 'font-semibold'
                      )}
                    >
                      <td className="py-2.5 capitalize">
                        {format(new Date(row.key + '-01T12:00:00'), 'MMMM yyyy', { locale: es })}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded-full font-semibold">
                            actual
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-800">
                        ${row.totalARS.toLocaleString('es-AR')}
                      </td>
                      <td className="py-2.5 text-right text-slate-500 hidden sm:table-cell">
                        {row.totalUSD > 0 ? `US$ ${row.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="py-2.5 text-right text-slate-600">{row.count}</td>
                      <td className="py-2.5 text-right">
                        {row.delta === null ? (
                          <span className="text-slate-300">—</span>
                        ) : (
                          <span className={cn(
                            'flex items-center justify-end gap-0.5 text-xs font-medium',
                            row.delta > 0 ? 'text-red-500' : row.delta < 0 ? 'text-brand-success' : 'text-slate-400'
                          )}>
                            {row.delta > 0 ? <ArrowUpRight className="w-3 h-3" /> : row.delta < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {row.delta > 0 ? '+' : ''}{row.delta}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {monthlyHistory.length > 0 && (
            <p className="text-xs text-slate-400 mt-3">Hacé clic en un mes para filtrar las estadísticas de arriba.</p>
          )}
        </div>
      )}
    </div>
  );
}
