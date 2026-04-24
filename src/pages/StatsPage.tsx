import { useEffect, useMemo } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

export function StatsPage() {
  const { expenses, fetchExpenses } = useExpenseStore();

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const stats = useMemo(() => {
    const totalExpenses = expenses.length;
    const totalARS = expenses
      .filter((exp) => exp.currency === 'ARS')
      .reduce((sum, exp) => sum + exp.amount, 0);
    const totalUSD = expenses
      .filter((exp) => exp.currency === 'USD')
      .reduce((sum, exp) => sum + exp.amount, 0);

    const byCategory: Record<string, number> = {};
    const byTag: Record<string, number> = {};

    expenses.forEach((exp) => {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + 1;
      if (exp.tags) {
        exp.tags.forEach(tag => {
          byTag[tag] = (byTag[tag] || 0) + 1;
        });
      }
    });

    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const topTags = Object.entries(byTag)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return { totalExpenses, totalARS, totalUSD, topCategories, topTags };
  }, [expenses]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Estadísticas</h1>
        <p className="text-slate-600 mt-1">Análisis de tus gastos</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Total Gastos</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalExpenses}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Total ARS</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">
            ${stats.totalARS.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Total USD</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">
            US$ {stats.totalUSD.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <PieChart className="w-6 h-6 text-slate-700" />
          <h2 className="text-xl font-bold text-slate-800">Top 5 Categorías</h2>
        </div>

        {stats.topCategories.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            No hay suficientes datos para mostrar estadísticas
          </p>
        ) : (
          <div className="space-y-4">
            {stats.topCategories.map(([category, count], index) => (
              <div key={category} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{category}</p>
                  <div className="mt-1 w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(count / stats.totalExpenses) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">{count}</p>
                  <p className="text-xs text-slate-500">
                    {((count / stats.totalExpenses) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Tags */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <PieChart className="w-6 h-6 text-slate-700" />
          <h2 className="text-xl font-bold text-slate-800">Top 5 Etiquetas</h2>
        </div>

        {stats.topTags.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            No hay suficientes datos para mostrar estadísticas de etiquetas
          </p>
        ) : (
          <div className="space-y-4">
            {stats.topTags.map(([tag, count], index) => (
              <div key={tag} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{tag}</p>
                  <div className="mt-1 w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(count / stats.totalExpenses) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">{count}</p>
                  <p className="text-xs text-slate-500">
                    {((count / stats.totalExpenses) * 100).toFixed(1)}%
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
