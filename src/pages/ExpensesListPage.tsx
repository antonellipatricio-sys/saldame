import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useExpenseStore } from '@/store/useExpenseStore';
import { exportExpensesToExcel } from '@/lib/exportExcel';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Trash2, Filter, Pencil, Download, X, Check, Loader2, SlidersHorizontal } from 'lucide-react';
import type { Currency, Expense, SharedParticipant } from '@/types';
import { cn } from '@/lib/utils';
import { TagSelector } from '@/components/tags/TagSelector';
import { ResponsableSelect } from '@/components/ResponsableSelect';
import { SharedWithEditor } from '@/components/SharedWithEditor';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SwipeRow } from '@/components/ui/SwipeRow';
import { UndoToast } from '@/components/ui/UndoToast';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';

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
  const [responsable, setResponsable] = useState(expense.responsable ?? '');
  const [sharedWith, setSharedWith] = useState<SharedParticipant[]>(expense.sharedWith ?? []);

  const handleSave = async () => {
    await updateExpense(expense.id, {
      description,
      amount: parseFloat(amount),
      currency,
      category,
      date: new Date(date + 'T12:00:00'),
      notes: notes || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      responsable: responsable || undefined,
      sharedWith: sharedWith.length > 0 ? sharedWith : undefined,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 md:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Editar gasto" className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[92dvh] md:max-h-[90vh] motion-safe:max-md:animate-sheet-up" onClick={e => e.stopPropagation()}>
        {/* Header fijo */}
        <div className="flex items-center justify-between p-5 md:p-6 pb-3 md:pb-4 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Editar gasto</h2>
          <button onClick={onClose} aria-label="Cerrar" className="-mr-2 w-11 h-11 md:w-auto md:h-auto md:mr-0 md:p-1 flex items-center justify-center rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto overscroll-contain flex-1 px-5 md:px-6 space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Descripción</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Monto</label>
              <input type="number" inputMode="decimal" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
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
            <label className="text-sm font-medium text-slate-700">Responsable</label>
            <div className="mt-1">
              <ResponsableSelect
                value={responsable}
                onChange={setResponsable}
                className="w-full py-2 text-sm"
                placeholder="— Sin asignar —"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Gasto compartido</label>
            <div className="mt-1 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
              <SharedWithEditor
                value={sharedWith}
                onChange={setSharedWith}
                totalAmount={amount ? parseFloat(amount) : undefined}
                currency={currency}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Notas</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="pb-2">
            <label className="text-sm font-medium text-slate-700">Etiquetas</label>
            <div className="mt-1">
              <TagSelector selected={selectedTags} onChange={setSelectedTags} />
            </div>
          </div>
        </div>

        {/* Botones fijos al pie */}
        <div className="flex gap-3 px-5 md:px-6 pt-3 md:pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-6 shrink-0 border-t border-slate-100">
          <button onClick={onClose}
            className="flex-1 min-h-[44px] md:min-h-0 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 min-h-[44px] md:min-h-0 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Página principal ──────────────────────────────────────────────
export function ExpensesListPage() {
  const { expenses, fetchExpenses, deleteExpense, updateExpense, categories, tags, loading } = useExpenseStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCurrency, setFilterCurrency] = useState<'ALL' | 'ARS' | 'USD'>('ALL');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const { pendingId, pendingMessage, remove: removeWithUndo, undo } = useUndoableDelete(deleteExpense);

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
      return expense.id !== pendingId && matchesSearch && matchesCategory && matchesCurrency && matchesMonth && matchesTag;
    });
  }, [expenses, searchTerm, filterCategory, filterCurrency, filterMonth, filterTag, pendingId]);

  const activeFilterCount = [filterMonth, filterCategory, filterCurrency !== 'ALL', filterTag].filter(Boolean).length;
  const clearFilters = () => {
    setFilterMonth('');
    setFilterCategory('');
    setFilterCurrency('ALL');
    setFilterTag('');
  };

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

  // Campos de filtro: se muestran en la tarjeta (escritorio) y en el panel Filtros (mobile)
  const filterSelects = (
    <>
      {/* Mes */}
      <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
        className="w-full min-h-[44px] md:min-h-0 px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
        <option value="">Todos los meses</option>
        {availableMonths.map(m => (
          <option key={m} value={m}>
            {format(new Date(m + '-01'), 'MMMM yyyy', { locale: es })}
          </option>
        ))}
      </select>

      {/* Categoría */}
      <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
        className="w-full min-h-[44px] md:min-h-0 px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
        <option value="">Todas las categorías</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
        ))}
      </select>

      {/* Moneda */}
      <select value={filterCurrency} onChange={e => setFilterCurrency(e.target.value as 'ALL' | 'ARS' | 'USD')}
        className="w-full min-h-[44px] md:min-h-0 px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
        <option value="ALL">Todas las monedas</option>
        <option value="ARS">$ ARS</option>
        <option value="USD">US$ USD</option>
      </select>
    </>
  );

  const tagFilter = (
    <>
      {/* Filtro por etiquetas */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 items-center">
          <span className="text-xs font-medium text-slate-500">Etiqueta:</span>
          <button
            onClick={() => setFilterTag('')}
            className={cn(
              'px-3 py-1.5 md:px-2.5 md:py-1 rounded-full text-xs font-medium border transition-all',
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
                'px-3 py-1.5 md:px-2.5 md:py-1 rounded-full text-xs font-medium border transition-all',
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
    </>
  );

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
    <div className="space-y-4 md:space-y-6">
      {editingExpense && (
        <EditModal expense={editingExpense} onClose={() => setEditingExpense(null)} />
      )}

      {/* Header */}
      <div className="hidden md:flex items-center justify-between flex-wrap gap-3">
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

      {/* Búsqueda + Filtros (mobile) */}
      <div className="md:hidden flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar gasto"
            className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        <button
          onClick={() => setFiltersOpen(true)}
          className={cn(
            'flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border font-semibold text-sm',
            activeFilterCount > 0 ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-slate-700 border-slate-300'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros{activeFilterCount > 0 && ` (${activeFilterCount})`}
        </button>
      </div>

      <BottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtros">
        <div className="px-5 space-y-3">
          {filterSelects}
          {tagFilter}
          <div className="flex gap-3 pt-2">
            <button
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
              className="flex-1 min-h-[44px] rounded-xl border border-slate-300 text-slate-600 font-medium disabled:opacity-40"
            >
              Limpiar
            </button>
            <button
              onClick={() => setFiltersOpen(false)}
              className="flex-1 min-h-[44px] rounded-xl bg-brand-primary text-white font-semibold"
            >
              Ver {filteredExpenses.length} gastos
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Filtros (escritorio) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 p-4">
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
          {filterSelects}
        </div>

        {tagFilter}
      </div>

      {/* Contador y totales */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>{filteredExpenses.length} de {expenses.length} gastos</span>
        <div className="flex items-center gap-4">
          {['ARS', 'USD'].map(cur => {
            const total = filteredExpenses.filter(e => e.currency === cur).reduce((s, e) => s + e.amount, 0);
            if (total === 0) return null;
            return (
              <span key={cur} className="font-semibold text-slate-800">
                {cur === 'ARS' ? '$' : 'US$'} {total.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </span>
            );
          })}
          <button
            onClick={handleExport}
            disabled={filteredExpenses.length === 0}
            className="md:hidden flex items-center gap-1 -my-2 px-2 min-h-[44px] text-green-700 font-semibold disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
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
            const amountLabel = `${expense.currency === 'ARS' ? '$' : 'US$'} ${expense.amount.toLocaleString('es-AR')}`;
            const chips = (
              <>
                {(expense.tags ?? []).map(tagName => {
                  const tagObj = tags.find(t => t.name === tagName);
                  return (
                    <span key={tagName} className={cn('px-2 py-0.5 rounded-full font-medium', tagObj?.color ?? 'bg-slate-100 text-slate-600')}>
                      {tagName}
                    </span>
                  );
                })}
                {expense.cardLast4 && (
                  <span className="text-slate-400">···{expense.cardLast4}</span>
                )}
                {expense.responsable && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">{expense.responsable}</span>
                )}
                {expense.sharedWith && expense.sharedWith.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                    👥 {expense.sharedWith.map(s => s.responsable).join(', ')}
                  </span>
                )}
              </>
            );
            return (
              <div key={expense.id}>
                {/* Mobile: tocar abre la edición, deslizar muestra Editar / Borrar */}
                <SwipeRow
                  className="md:hidden rounded-xl border border-slate-200 shadow-sm"
                  open={swipedId === expense.id}
                  onOpenChange={open => setSwipedId(open ? expense.id : null)}
                  onTap={() => setEditingExpense(expense)}
                  actions={[
                    { label: 'Editar', icon: <Pencil className="w-5 h-5" />, className: 'bg-brand-primary', onClick: () => setEditingExpense(expense) },
                    { label: 'Borrar', icon: <Trash2 className="w-5 h-5" />, className: 'bg-red-600', onClick: () => removeWithUndo(expense.id, `Borraste "${expense.description}"`) },
                  ]}
                >
                  <div className="flex items-start gap-3 px-3 py-3">
                    <span className="text-xl leading-none mt-0.5 w-7 text-center shrink-0">{catObj?.icon ?? '•'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-semibold text-slate-800 truncate">{expense.description}</h3>
                        <span className="font-bold text-slate-800 whitespace-nowrap tabular-nums">{amountLabel}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {expense.category}, {format(new Date(expense.date), 'd MMM', { locale: es })}
                        {expense.notes && <span className="italic">. {expense.notes}</span>}
                      </p>
                      {(expense.tags?.length || expense.cardLast4 || expense.responsable || expense.sharedWith?.length) ? (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs">{chips}</div>
                      ) : null}
                    </div>
                  </div>
                </SwipeRow>

                {/* Escritorio */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
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
                          {chips}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Selector de responsable */}
                      <ResponsableSelect
                        value={expense.responsable ?? (expense.cardLast4 === '3946' ? 'Maru' : expense.cardLast4 === '8337' ? 'Bren' : expense.cardLast4 === '1204' || expense.cardLast4 === '1884' ? 'Patricio' : '')}
                        onChange={val => updateExpense(expense.id, { responsable: val || undefined })}
                      />
                      <div className="text-right">
                        <p className="font-bold text-slate-800">{amountLabel}</p>
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
              </div>
            );
          })
        )}
      </div>

      <UndoToast message={pendingMessage} onUndo={undo} />
    </div>
  );
}