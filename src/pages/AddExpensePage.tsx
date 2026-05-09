import { useState, useRef, useEffect, useCallback } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { classifyLocal, learnCategory } from '@/lib/classifier';
import { TagSelector } from '@/components/tags/TagSelector';
import { ResponsableSelect } from '@/components/ResponsableSelect';
import { SharedWithEditor } from '@/components/SharedWithEditor';
import { UploadFileSection } from '@/components/upload/UploadFileSection';
import type { Currency, SharedParticipant } from '@/types';
import { Save, Loader2, RotateCcw, PenLine, FolderUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'manual' | 'importar';

export function AddExpensePage() {
  const { addExpense, loading, categories } = useExpenseStore();
  const [tab, setTab] = useState<Tab>('manual');

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [responsable, setResponsable] = useState('');
  const [sharedWith, setSharedWith] = useState<SharedParticipant[]>([]);

  const [suggestion, setSuggestion] = useState<{ category: string; confidence: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const descRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    descRef.current?.focus();
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
    setSuggestion(null);
    if (value.trim().length >= 3) {
      const result = classifyLocal(value);
      setSuggestion({ category: result.category, confidence: result.confidence });
      if (result.confidence === 'high' && !category) {
        setCategory(result.category);
      }
    }
  }, [category]);

  const applySuggestion = () => {
    if (suggestion) {
      setCategory(suggestion.category);
      setSuggestion(null);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!description.trim() || !amount || !category) return;

    learnCategory(description, category);

    await addExpense({
      description: description.trim(),
      amount: parseFloat(amount),
      currency,
      category,
      date: new Date(date + 'T12:00:00'),
      notes: notes || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      responsable: responsable || undefined,
      sharedWith: sharedWith.length > 0 ? sharedWith : undefined,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    setDescription('');
    setAmount('');
    setCategory('');
    setNotes('');
    setSelectedTags([]);
    setResponsable('');
    setSharedWith([]);
    setSuggestion(null);
    descRef.current?.focus();
  };

  const categoryObj = categories.find(c => c.name === category);

  return (
    <div className={cn('space-y-3', tab === 'manual' && 'max-w-2xl mx-auto')}>

      {/* Header compacto */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Agregar Gasto</h1>
        <p className="text-slate-400 text-xs mt-0.5">Clasificación automática instantánea</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {([
          { id: 'manual', label: 'Manual', icon: <PenLine className="w-4 h-4" /> },
          { id: 'importar', label: 'Importar archivo', icon: <FolderUp className="w-4 h-4" /> },
        ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              tab === t.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Importar */}
      {tab === 'importar' && <UploadFileSection />}

      {/* Tab: Manual */}
      {tab === 'manual' && (
      <div className={cn(
        'bg-white rounded-2xl shadow-sm border p-4 transition-all',
        saved ? 'border-green-400 shadow-green-100' : 'border-slate-200'
      )}>
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ¿En qué gastaste? *
            </label>
            <input
              ref={descRef}
              type="text"
              value={description}
              onChange={e => handleDescriptionChange(e.target.value)}
              placeholder="Ej: Uber, McDonald's, Carrefour..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              required
              autoComplete="off"
            />

            {/* Sugerencia */}
            {suggestion && suggestion.category !== category && (
              <div className={cn(
                'mt-1.5 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                suggestion.confidence === 'high'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-blue-50 border border-blue-200'
              )}>
                <span>{categories.find(c => c.name === suggestion.category)?.icon ?? '💡'}</span>
                <span className="flex-1 text-slate-700 text-xs">
                  {suggestion.confidence === 'high' ? '✓ Detectado: ' : '¿Es '}
                  <strong>{suggestion.category}</strong>
                  {suggestion.confidence !== 'high' && '?'}
                </span>
                <button type="button" onClick={applySuggestion} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  Aplicar
                </button>
              </div>
            )}

            {/* Categoría elegida */}
            {categoryObj && (
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: categoryObj.color }}
                >
                  {categoryObj.icon} {categoryObj.name}
                </span>
                <button type="button" onClick={() => setCategory('')} className="text-slate-400 hover:text-slate-600" title="Cambiar">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Monto + Moneda */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Monto *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Moneda *</label>
              <div className="flex gap-1.5">
                {(['ARS', 'USD'] as Currency[]).map(cur => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setCurrency(cur)}
                    className={cn(
                      'flex-1 py-2 rounded-xl font-semibold text-sm transition-all border',
                      currency === cur
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                    )}
                  >
                    {cur === 'ARS' ? '$ ARS' : 'US$'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selector de categoría */}
          {!category && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Categoría * <span className="text-slate-400">(elegí una)</span>
              </label>
              <div className="grid grid-cols-5 gap-1">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <span className="text-base leading-none">{cat.icon}</span>
                    <span className="text-slate-600 text-center leading-tight text-[10px]">{cat.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Responsable + Fecha en la misma fila */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Responsable <span className="text-slate-400">(opc.)</span>
              </label>
              <ResponsableSelect
                value={responsable}
                onChange={setResponsable}
                className="w-full text-sm py-2 px-2 rounded-xl border-slate-300"
                placeholder="— quién —"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Gasto compartido */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Gasto compartido <span className="text-slate-400">(opcional)</span>
            </label>
            <div className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
              <SharedWithEditor
                value={sharedWith}
                onChange={setSharedWith}
                totalAmount={amount ? parseFloat(amount) : undefined}
                currency={currency}
              />
            </div>
          </div>

          {/* Etiquetas */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Etiquetas <span className="text-slate-400">(opcional)</span>
            </label>
            <TagSelector selected={selectedTags} onChange={setSelectedTags} />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Notas <span className="text-slate-400">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Algún detalle extra..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            />
          </div>

          {/* Botón guardar */}
          <button
            type="submit"
            disabled={loading || !description || !amount || !category}
            className={cn(
              'w-full font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-base',
              saved
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700',
              (loading || !description || !amount || !category) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
            ) : saved ? (
              <>✓ ¡Guardado!</>
            ) : (
              <><Save className="w-5 h-5" /> Guardar Gasto</>
            )}
          </button>

        </form>
      </div>
      )}
    </div>
  );
}
