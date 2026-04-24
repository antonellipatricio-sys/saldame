import { useEffect, useState, useMemo } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { exportExpensesToExcel } from '@/lib/exportExcel';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Trash2, Filter, Pencil, Download, X, Check, Loader2 } from 'lucide-react';
import type { Currency, Expense } from '@/types';
import { cn } from '@/lib/utils';
import { TagSelector } from '@/components/tags/TagSelector';

// ── Modal de edición ──────────────────────────────────────────────
function EditModal({ expense, onClose }: { expense: Expense; onClose: () => void }) {
  const { updateExpense, categories, loading } = useExpenseStore();
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [currency, setCurrency] = useState<Currency>(expense.currency);
  const [category, setCategory] = useState(expense.category);
  const [date, setDate] = useState(format(new Date(expense.date), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState(expense.notes ?? '');
  const [selectedTags, setSelectedTags] = useState<string[]>(expense.tags ?? []);

  const handleSave = async () => {
    await updateExpense(expense.id, {
      description,
      amount: parseFloat(amount),
      currency,
      category,
      date: new Date(date + 'T12:00:00'),
      notes: notes || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Editar gasto</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Descripción</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Monto</label>
              <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Moneda</label>
              <div className="flex gap-2 mt-1">
                {(['ARS', 'USD'] as Currency[]).map(cur => (
                  <button key={cur} type="button" onClick={() => setCurrency(cur)}
                    className={cn('flex-1 py-2 rounded-lg text-sm font-semibold border transition-all',
                      currency === cur ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300')}>
                    {cur === 'ARS' ? '$' : 'US$'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Categoría</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Notas</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Etiquetas</label>
            <div className="mt-1">
              <TagSelector selected={selectedTags} onChange={setSelectedTags} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────
export function ExpensesListPage() {
  const { expenses, fetchExpenses, deleteExpense, categories, tags, loading } = useExpenseStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCurrency, setFilterCurrency] = useState<'ALL' | 'ARS' | 'USD'>('ALL');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  // Meses disponibles en base a los gastos
  const availableMonths = useMemo(() => {
    const months = new Set(expenses.map(exp => format(new Date(exp.date), 'yyyy-MM')));
    return Array.from(months).sort().reverse();
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filterCategory || expense.category === filterCategory;
      const matchesCurrency = filterCurrency === 'ALL' || expense.currency === filterCurrency;
      const matchesMonth = !filterMonth || format(new Date(expense.date), 'yyyy-MM') === filterMonth;
      const matchesTag = !filterTag || (expense.tags ?? []).includes(filterTag);
      return matchesSearch && matchesCategory && matchesCurrency && matchesMonth && matchesTag;
    });
  }, [expenses, searchTerm, filterCategory, filterCurrency, filterMonth, filterTag]);

  const handleDelete = async (id: string, description: string) => {
    if (confirm(`¿Eliminar "${description}"?`)) {
      await deleteExpense(id);
    }
  };

  const handleExport = () => {
    const name = filterMonth
      ? `gastos_${filterMonth}.xlsx`
      : `gastos_todos.xlsx`;
    exportExpensesToExcel(filteredExpenses, name);
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Cargando gastos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {editingExpense && (
        <EditModal expense={editingExpense} onClose={() => setEditingExpense(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Mis Gastos</h1>
          <p className="text-slate-600 mt-1">Todos tus gastos registrados</p>
        </div>
        <button
          onClick={handleExport}
          disabled={filteredExpenses.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          Exportar Excel
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h2 className="font-semibold text-slate-800">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Buscar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar descripción..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>

          {/* Mes */}
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">Todos los meses</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>
                {format(new Date(m + '-01'), 'MMMM yyyy', { locale: es })}
              </option>
            ))}
          </select>

          {/* Categoría */}
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
            ))}
          </select>

          {/* Moneda */}
          <select value={filterCurrency} onChange={e => setFilterCurrency(e.target.value as 'ALL' | 'ARS' | 'USD')}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="ALL">Todas las monedas</option>
            <option value="ARS">$ ARS</option>
            <option value="USD">US$ USD</option>
          </select>
        </div>

        {/* Filtro por etiquetas */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 items-center">
            <span className="text-xs font-medium text-slate-500">Etiqueta:</span>
            <button
              onClick={() => setFilterTag('')}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                !filterTag ? 'bg-slate-700 text-white border-transparent' : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200'
              )}
            >
              Todas
            </button>
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => setFilterTag(filterTag === tag.name ? '' : tag.name)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                  filterTag === tag.name
                    ? `${tag.color} border-transparent ring-2 ring-offset-1 ring-blue-400`
                    : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200'
                )}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contador y totales */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>{filteredExpenses.length} de {expenses.length} gastos</span>
        <div className="flex gap-4">
          {['ARS', 'USD'].map(cur => {
            const total = filteredExpenses.filter(e => e.currency === cur).reduce((s, e) => s + e.amount, 0);
            if (total === 0) return null;
            return (
              <span key={cur} className="font-semibold text-slate-800">
                {cur === 'ARS' ? '$' : 'US$'} {total.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </span>
            );
          })}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            No se encontraron gastos
          </div>
        ) : (
          filteredExpenses.map((expense) => {
            const catObj = categories.find(c => c.name === expense.category);
            return (
              <div key={expense.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {catObj && (
                      <span className="text-xl mt-0.5 shrink-0">{catObj.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{expense.description}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                        <span
                          className="px-2 py-0.5 rounded-full text-white text-xs"
                          style={{ backgroundColor: catObj?.color ?? '#94a3b8' }}
                        >
                          {expense.category}
                        </span>
                        <span>{format(new Date(expense.date), 'dd/MM/yyyy', { locale: es })}</span>
                        {expense.notes && <span className="italic truncate max-w-xs">{expense.notes}</span>}
                        {(expense.tags ?? []).map(tagName => {
                          const tagObj = tags.find(t => t.name === tagName);
                          return (
                            <span key={tagName} className={cn('px-2 py-0.5 rounded-full font-medium', tagObj?.color ?? 'bg-slate-100 text-slate-600')}>
                              {tagName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-slate-800">
                        {expense.currency === 'ARS' ? '$' : 'US$'} {expense.amount.toLocaleString('es-AR')}
                      </p>
                      <p className="text-xs text-slate-400">{expense.currency}</p>
                    </div>
                    <button onClick={() => setEditingExpense(expense)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(expense.id, expense.description)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}