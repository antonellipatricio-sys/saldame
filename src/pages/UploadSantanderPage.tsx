import { useState, useRef } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { parseSantanderExcel, type SantanderTransaction } from '@/lib/santanderParser';
import { classifyLocal, learnCategory, classifyTags, learnTags } from '@/lib/classifier';
import { TagSelector } from '@/components/tags/TagSelector';
import type { Currency } from '@/types';
import { Upload, FileSpreadsheet, Loader2, Check, Trash2, RotateCcw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewRow extends SantanderTransaction {
  category: string;
  selected: boolean;
  tags: string[];
}

export function UploadSantanderPage() {
  const { addExpense, categories } = useExpenseStore();

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setRows([]);
    setSavedCount(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      setFile(f);
      setRows([]);
      setSavedCount(null);
      setError(null);
    }
  };

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    setError(null);
    try {
      const transactions = await parseSantanderExcel(file);
      console.log('[Santander] Transacciones encontradas:', transactions.length, transactions);

      if (transactions.length === 0) {
        setError(
          'No se encontraron transacciones. Verificá que el archivo sea el resumen Excel de Santander ' +
          '(columnas: Fecha | Descripcion | Cuotas | Comentario | Monto en pesos | Monto en dólares).'
        );
        setParsing(false);
        return;
      }

      const reviewRows: ReviewRow[] = transactions.map(t => ({
        ...t,
        category: classifyLocal(t.description).category,
        selected: !t.isRefund,
        tags: classifyTags(t.description),
      }));
      setRows(reviewRows);
    } catch (err) {
      setError('Error al leer el archivo Excel. Asegurate de que sea un .xlsx/.xls válido de Santander.');
      console.error(err);
    } finally {
      setParsing(false);
    }
  };

  const handleSaveAll = async () => {
    const selected = rows.filter(r => r.selected);
    if (selected.length === 0) return;
    setSaving(true);
    let count = 0;
    for (const row of selected) {
      learnCategory(row.description, row.category);
      learnTags(row.description, row.tags);
      await addExpense({
        description: row.description,
        amount: row.amount,
        currency: row.currency as Currency,
        category: row.category,
        date: new Date(row.date + 'T12:00:00'),
        tags: row.tags.length > 0 ? row.tags : undefined,
        cardLast4: row.cardLast4,
        cardholder: row.cardholder,
        source: 'santander',
      });
      count++;
    }
    setSaving(false);
    setSavedCount(count);
    setRows([]);
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const updateRow = (id: string, changes: Partial<ReviewRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...changes } : r));
  };

  const selectedCount = rows.filter(r => r.selected).length;

  // ── Vista de revisión ──────────────────────────────
  if (rows.length > 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Revisar transacciones — Santander</h1>
            <p className="text-slate-500 text-sm mt-1">
              Se encontraron <strong>{rows.length}</strong> transacciones · <strong>{selectedCount}</strong> seleccionadas
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setRows([]); setFile(null); if (inputRef.current) inputRef.current.value = ''; }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
            >
              <RotateCcw className="w-4 h-4" /> Subir otro
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving || selectedCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                : <><Save className="w-4 h-4" /> Guardar {selectedCount} gastos</>}
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-[32px_1fr_130px_100px_80px_90px_140px_36px] gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <div />
            <div>Descripción</div>
            <div>Titular</div>
            <div>Monto</div>
            <div>Cuotas</div>
            <div>Fecha</div>
            <div>Categoría</div>
            <div />
          </div>

          <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
            {rows.map(row => (
              <div
                key={row.id}
                className={cn(
                  'grid grid-cols-[32px_1fr_130px_100px_80px_90px_140px_36px] gap-2 px-4 py-2 items-center text-sm transition-colors',
                  row.isRefund
                    ? 'bg-red-50'
                    : row.selected ? 'bg-white' : 'bg-slate-50 opacity-50'
                )}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={row.selected}
                  onChange={e => updateRow(row.id, { selected: e.target.checked })}
                  className="w-4 h-4 rounded accent-blue-600"
                />

                {/* Descripción + Etiquetas */}
                <div className="flex flex-col gap-1">
                  <input
                    value={row.description ?? ''}
                    onChange={e => updateRow(row.id, { description: e.target.value })}
                    className={cn(
                      'w-full px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-400 focus:outline-none text-sm bg-transparent',
                      row.isRefund && 'text-red-600 font-medium'
                    )}
                  />
                  <TagSelector
                    selected={row.tags}
                    onChange={tags => updateRow(row.id, { tags })}
                  />
                </div>

                {/* Titular / Adicional */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-slate-600 truncate" title={row.cardholder}>
                    {row.cardholder.split(' ').slice(0, 2).join(' ')}
                  </span>
                  {row.isAdditional && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 rounded px-1 w-fit">Adicional</span>
                  )}
                  <span className="text-[10px] text-slate-400">···{row.cardLast4}</span>
                </div>

                {/* Monto + Moneda */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex gap-1 items-center">
                    {row.isRefund && <span className="text-red-500 font-bold text-xs">-</span>}
                    <input
                      type="number"
                      step="0.01"
                      value={row.amount}
                      onChange={e => updateRow(row.id, { amount: parseFloat(e.target.value) || 0 })}
                      className={cn(
                        'w-16 px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-400 focus:outline-none text-sm bg-transparent',
                        row.isRefund && 'text-red-600'
                      )}
                    />
                    <select
                      value={row.currency}
                      onChange={e => updateRow(row.id, { currency: e.target.value as Currency })}
                      className="px-1 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:outline-none text-xs bg-transparent"
                    >
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  {row.isRefund && (
                    <span className="text-[10px] bg-red-100 text-red-600 rounded px-1 w-fit">Devolución</span>
                  )}
                </div>

                {/* Cuotas */}
                <span className="text-xs text-slate-400 text-center">{row.cuotas || '—'}</span>

                {/* Fecha */}
                <input
                  type="date"
                  value={row.date}
                  onChange={e => updateRow(row.id, { date: e.target.value })}
                  className="px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-400 focus:outline-none text-xs bg-transparent"
                />

                {/* Categoría */}
                <select
                  value={row.category}
                  onChange={e => updateRow(row.id, { category: e.target.value })}
                  className="px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:outline-none text-xs bg-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                  ))}
                </select>

                {/* Eliminar fila */}
                <button
                  onClick={() => setRows(prev => prev.filter(r => r.id !== row.id))}
                  className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex gap-3 text-sm">
          <button
            onClick={() => setRows(prev => prev.map(r => ({ ...r, selected: true })))}
            className="text-blue-600 hover:underline"
          >
            Seleccionar todas
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => setRows(prev => prev.map(r => ({ ...r, selected: false })))}
            className="text-slate-500 hover:underline"
          >
            Deseleccionar todas
          </button>
        </div>
      </div>
    );
  }

  // ── Vista de upload ──────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Subir Resumen Santander</h1>
        <p className="text-slate-500 mt-1 text-sm">Importá tu resumen de tarjeta en formato Excel (.xlsx)</p>
      </div>

      {/* Éxito */}
      {savedCount !== null && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800">
          <Check className="w-5 h-5 text-green-600 shrink-0" />
          <span>Se guardaron <strong>{savedCount} gastos</strong> correctamente.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          {!file ? (
            <>
              <Upload className="w-14 h-14 text-slate-400 mx-auto mb-3" />
              <p className="font-medium text-slate-700">Click o arrastrá tu Excel aquí</p>
              <p className="text-sm text-slate-400 mt-1">Resumen Santander en formato .xlsx / .xls</p>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-14 h-14 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-slate-800">{file.name}</p>
              <p className="text-sm text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · Click para cambiar</p>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Botón procesar */}
        <button
          onClick={handleParse}
          disabled={!file || parsing}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {parsing
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Leyendo Excel...</>
            : <><FileSpreadsheet className="w-5 h-5" /> Procesar Excel</>}
        </button>

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-1">
          <p className="font-semibold mb-2">¿Cómo funciona?</p>
          <p>1. Descargás el resumen desde el Home Banking de Santander (formato Excel)</p>
          <p>2. Lo subís acá — detectamos automáticamente fecha, descripción, cuotas y monto</p>
          <p>3. El clasificador sugiere la categoría de cada gasto</p>
          <p>4. Revisás, editás si hace falta, y guardás todo de una vez</p>
          <p className="mt-2 text-xs text-blue-600">
            Columnas esperadas: <strong>Fecha | Descripcion | Cuotas | Comentario | Monto en pesos | Monto en dólares</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
