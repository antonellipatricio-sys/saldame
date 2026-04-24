import { useState, useRef, useEffect, useCallback } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { classifyLocal, learnCategory } from '@/lib/classifier';
import { TagSelector } from '@/components/tags/TagSelector';
import type { Currency } from '@/types';
import { Zap, Save, Loader2, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AddExpensePage() {
  const { addExpense, loading, categories } = useExpenseStore();

  // Modo: 'quick' = carga rápida (3 campos + Enter), 'full' = formulario completo
  const [mode, setMode] = useState<'quick' | 'full'>('quick');

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [suggestion, setSuggestion] = useState<{ category: string; confidence: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const descRef = useRef<HTMLInputElement>(null);

  // Focus automático al cargar
  useEffect(() => {
    descRef.current?.focus();
  }, []);

  // Clasificar al escribir (instantáneo, sin API)
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

    // Aprender para la próxima vez
    learnCategory(description, category);

    await addExpense({
      description: description.trim(),
      amount: parseFloat(amount),
      currency,
      category,
      date: new Date(date + 'T12:00:00'),
      notes: notes || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });

    // Feedback visual y reset
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    setDescription('');
    setAmount('');
    setCategory('');
    setNotes('');
    setSelectedTags([]);
    setSuggestion(null);
    descRef.current?.focus();
  };

  // Guardar con Enter en modo rápido
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && mode === 'quick') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const categoryObj = categories.find(c => c.name === category);

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Agregar Gasto</h1>
          <p className="text-slate-500 text-sm mt-1">
            Clasificación automática instantánea · sin límites de API
          </p>
        </div>
        <button
          onClick={() => setMode(m => m === 'quick' ? 'full' : 'quick')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {mode === 'quick' ? (
            <><ChevronDown className="w-4 h-4" /> Más campos</>
          ) : (
            <><ChevronUp className="w-4 h-4" /> Modo rápido</>
          )}
        </button>
      </div>

      {/* Card */}
      <div className={cn(
        'bg-white rounded-2xl shadow-sm border p-6 transition-all',
        saved ? 'border-green-400 shadow-green-100' : 'border-slate-200'
      )}>

        <div className="flex items-center gap-2 mb-6">
          <Zap className={cn('w-5 h-5', mode === 'quick' ? 'text-yellow-500' : 'text-slate-400')} />
          <span className="text-sm font-medium text-slate-600">
            {mode === 'quick' ? '⚡ Carga rápida — presioná Enter para guardar' : 'Formulario completo'}
          </span>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-5">

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
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              required
              autoComplete="off"
            />

            {/* Sugerencia de categoría */}
            {suggestion && suggestion.category !== category && (
              <div className={cn(
                'mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                suggestion.confidence === 'high'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-blue-50 border border-blue-200'
              )}>
                <span className="text-lg">
                  {categories.find(c => c.name === suggestion.category)?.icon ?? '💡'}
                </span>
                <span className="flex-1 text-slate-700">
                  {suggestion.confidence === 'high' ? '✓ Detectado: ' : '¿Es '}
                  <strong>{suggestion.category}</strong>
                  {suggestion.confidence !== 'high' && '?'}
                </span>
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  Aplicar
                </button>
              </div>
            )}

            {/* Categoría elegida */}
            {categoryObj && (
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: categoryObj.color }}
                >
                  {categoryObj.icon} {categoryObj.name}
                </span>
                <button
                  type="button"
                  onClick={() => setCategory('')}
                  className="text-slate-400 hover:text-slate-600"
                  title="Cambiar categoría"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Monto + Moneda */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monto *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Moneda *</label>
              <div className="flex gap-2">
                {(['ARS', 'USD'] as Currency[]).map(cur => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setCurrency(cur)}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-semibold text-sm transition-all border',
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

          {/* Selector de categoría (si no se detectó automáticamente) */}
          {!category && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Categoría * <span className="text-slate-400 text-xs">(elegí una)</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-xs"
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-slate-600 text-center leading-tight">{cat.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Campos extra en modo completo */}
          {mode === 'full' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Etiquetas <span className="text-slate-400">(opcional)</span>
                </label>
                <TagSelector selected={selectedTags} onChange={setSelectedTags} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notas <span className="text-slate-400">(opcional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Algún detalle extra..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </>
          )}

          {/* Botón guardar */}
          <button
            type="submit"
            disabled={loading || !description || !amount || !category}
            className={cn(
              'w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-base',
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
              <><Save className="w-5 h-5" /> {mode === 'quick' ? 'Guardar (Enter)' : 'Guardar Gasto'}</>
            )}
          </button>

        </form>
      </div>

      {/* Tips */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm text-slate-500 space-y-1">
        <p>💡 <strong>Tip:</strong> La categoría se detecta automáticamente mientras escribís</p>
        <p>⌨️ En carga rápida podés presionar <strong>Enter</strong> para guardar sin hacer click</p>
        <p>🧠 El sistema <strong>aprende</strong> tus correcciones para la próxima vez</p>
      </div>
    </div>
  );
}
