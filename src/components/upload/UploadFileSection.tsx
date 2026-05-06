import { useState, useRef, useEffect } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { extractTextFromPDF, parseTransactions } from '@/lib/pdfParser';
import { isMercadoPago, parseMercadoPagoTransactions, extractMPCardInfo, type MPCardInfo } from '@/lib/mercadoPagoParser';
import { parseSantanderExcel, type SantanderTransaction } from '@/lib/santanderParser';
import { classifyLocal, learnCategory, classifyTags, learnTags } from '@/lib/classifier';
import { TagSelector } from '@/components/tags/TagSelector';
import { CategorySelect } from '@/components/upload/CategorySelect';
import { ResponsableSelect } from '@/components/ResponsableSelect';
import type { ParsedTransaction } from '@/lib/pdfParser';
import type { Currency } from '@/types';
import { Upload, FileText, FileSpreadsheet, Loader2, Check, Trash2, RotateCcw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

type DetectedFormat = 'banco-nacion' | 'mercadopago' | 'santander' | null;

interface ReviewRow {
  id: string;
  selected: boolean;
  description: string;
  amount: number;
  currency: 'ARS' | 'USD';
  date: string;
  category: string;
  tags: string[];
  // PDF-only
  cuotas?: string;
  operacion?: string;
  // Excel-only
  comprobante?: string;
  cardholder?: string;
  cardLast4?: string;
  responsable?: string;
  isAdditional?: boolean;
  isRefund?: boolean;
}

function rowFromPDF(t: ParsedTransaction): ReviewRow {
  return {
    id: t.id,
    selected: true,
    description: t.description,
    amount: t.amount,
    currency: t.currency,
    date: t.date,
    category: classifyLocal(t.description).category,
    tags: classifyTags(t.description),
    cuotas: t.cuotas,
    operacion: t.operacion,
  };
}

function rowFromExcel(t: SantanderTransaction): ReviewRow {
  return {
    id: t.id,
    selected: !t.isRefund,
    description: t.description,
    amount: t.amount,
    currency: t.currency,
    date: t.date,
    category: classifyLocal(t.description).category,
    tags: classifyTags(t.description),
    cuotas: t.cuotas,
    comprobante: t.comprobante,
    cardholder: t.cardholder,
    cardLast4: t.cardLast4,
    responsable: t.responsable,
    isAdditional: t.isAdditional,
    isRefund: t.isRefund,
  };
}

export function UploadFileSection() {
  const { addExpense } = useExpenseStore();

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<DetectedFormat>(null);
  const [mpCardInfo, setMpCardInfo] = useState<MPCardInfo | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  const selectedCount = rows.filter(r => r.selected).length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;
  const someSelected = selectedCount > 0 && selectedCount < rows.length;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const reset = () => {
    setFile(null);
    setRows([]);
    setSavedCount(null);
    setError(null);
    setRawText(null);
    setDetectedFormat(null);
    setMpCardInfo(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setRows([]);
    setSavedCount(null);
    setError(null);
    setRawText(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const isPdf = f.type === 'application/pdf' || f.name.endsWith('.pdf');
    const isExcel = f.name.endsWith('.xlsx') || f.name.endsWith('.xls');
    if (isPdf || isExcel) {
      setFile(f);
      setRows([]);
      setSavedCount(null);
      setError(null);
      setRawText(null);
    }
  };

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    setError(null);
    setDetectedFormat(null);

    try {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

      if (isExcel) {
        const transactions = await parseSantanderExcel(file);
        if (transactions.length === 0) {
          setError(
            'No se encontraron transacciones. Verificá que el archivo sea el resumen Excel de Santander ' +
            '(columnas: Fecha | Descripcion | Cuotas | Comentario | Monto en pesos | Monto en dólares).'
          );
          return;
        }
        setDetectedFormat('santander');
        setRows(transactions.map(rowFromExcel));
      } else {
        const text = await extractTextFromPDF(file);
        if (isMercadoPago(text)) {
          const cardInfo = extractMPCardInfo(text);
          setMpCardInfo(cardInfo);
          setDetectedFormat('mercadopago');
          const transactions = parseMercadoPagoTransactions(text);
          if (transactions.length === 0) {
            setRawText(text.slice(0, 800));
            setError('No se encontraron transacciones en el PDF de Mercado Pago.');
            return;
          }
          setRows(transactions.map(rowFromPDF));
        } else {
          setDetectedFormat('banco-nacion');
          const transactions = parseTransactions(text);
          if (transactions.length === 0) {
            setRawText(text.slice(0, 800));
            setError('No se encontraron transacciones. Revisá el texto extraído abajo.');
            return;
          }
          setRows(transactions.map(rowFromPDF));
        }
      }
    } catch (err) {
      setError('Error al leer el archivo. Asegurate de que no esté protegido con contraseña.');
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

    const responsableFromCardholder = (name: string): string | undefined => {
      const n = name.toLowerCase();
      if (n.includes('patricio')) return 'Patricio';
      if (n.includes('mariana') || n.includes('maru')) return 'Maru';
      if (n.includes('brenda') || n.includes('bren')) return 'Bren';
      if (n.includes('micaela') || n.includes('mica')) return 'Mica';
      return undefined;
    };

    for (const row of selected) {
      learnCategory(row.description, row.category);
      learnTags(row.description, row.tags);

      if (detectedFormat === 'santander') {
        await addExpense({
          description: row.description,
          amount: row.amount,
          currency: row.currency as Currency,
          category: row.category,
          date: new Date(row.date + 'T12:00:00'),
          tags: row.tags.length > 0 ? row.tags : undefined,
          cardLast4: row.cardLast4,
          cardholder: row.cardholder,
          responsable: row.responsable,
          source: 'santander',
        });
      } else {
        await addExpense({
          description: row.description,
          amount: row.amount,
          currency: row.currency as Currency,
          category: row.category,
          date: new Date(row.date + 'T12:00:00'),
          tags: row.tags.length > 0 ? row.tags : undefined,
          cardLast4: mpCardInfo?.cardLast4 || undefined,
          cardholder: mpCardInfo?.cardholder || undefined,
          responsable: mpCardInfo?.cardholder ? responsableFromCardholder(mpCardInfo.cardholder) : undefined,
          source: 'pdf',
        });
      }
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

  // ── Vista de revisión — Excel Santander ─────────────────────────────────────
  if (rows.length > 0 && detectedFormat === 'santander') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">Revisar transacciones — Santander</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                📊 Excel
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Se encontraron <strong>{rows.length}</strong> transacciones · <strong>{selectedCount}</strong> seleccionadas
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium">
              <RotateCcw className="w-4 h-4" /> Subir otro
            </button>
            <button onClick={handleSaveAll} disabled={saving || selectedCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                : <><Save className="w-4 h-4" /> Guardar {selectedCount} gastos</>}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-[32px_1fr_130px_110px_120px_80px_90px_140px_36px] gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <div className="flex items-center">
              <input ref={masterCheckboxRef} type="checkbox" checked={allSelected}
                onChange={e => setRows(prev => prev.map(r => ({ ...r, selected: e.target.checked })))}
                className="w-4 h-4 rounded accent-blue-600" />
            </div>
            <div>Descripción</div>
            <div>Titular</div>
            <div>Responsable</div>
            <div>Monto</div>
            <div>Cuotas</div>
            <div>Fecha</div>
            <div>Categoría</div>
            <div />
          </div>

          <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
            {rows.map(row => (
              <div key={row.id}
                className={cn(
                  'grid grid-cols-[32px_1fr_130px_110px_120px_80px_90px_140px_36px] gap-2 px-4 py-1.5 items-center text-sm transition-colors',
                  row.isRefund ? 'bg-red-50' : row.selected ? 'bg-white' : 'bg-slate-50 opacity-50'
                )}>
                <input type="checkbox" checked={row.selected}
                  onChange={e => updateRow(row.id, { selected: e.target.checked })}
                  className="w-4 h-4 rounded accent-blue-600" />

                <div className="flex flex-col gap-0.5">
                  <input value={row.description ?? ''}
                    onChange={e => updateRow(row.id, { description: e.target.value })}
                    className={cn(
                      'w-full px-2 py-0.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-400 focus:outline-none text-sm bg-transparent',
                      row.isRefund && 'text-red-600 font-medium'
                    )} />
                  {row.comprobante && (
                    <span className="text-[10px] text-slate-400 px-2 leading-none">#{row.comprobante}</span>
                  )}
                  <TagSelector selected={row.tags} onChange={tags => updateRow(row.id, { tags })} />
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-slate-600 truncate" title={row.cardholder}>
                    {row.cardholder?.split(' ').slice(0, 2).join(' ')}
                  </span>
                  {row.isAdditional && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 rounded px-1 w-fit">Adicional</span>
                  )}
                  <span className="text-[10px] text-slate-400">···{row.cardLast4}</span>
                </div>

                <ResponsableSelect
                  value={row.responsable ?? ''}
                  onChange={val => updateRow(row.id, { responsable: val })}
                />

                <div className="flex flex-col gap-0.5">
                  <div className="flex gap-1 items-center">
                    {row.isRefund && <span className="text-red-500 font-bold text-xs">-</span>}
                    <span className={cn('text-sm font-medium tabular-nums', row.isRefund ? 'text-red-600' : 'text-slate-800')}>
                      {row.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-slate-500">{row.currency}</span>
                  </div>
                  {row.isRefund && (
                    <span className="text-[10px] bg-red-100 text-red-600 rounded px-1 w-fit">Devolución</span>
                  )}
                </div>

                <span className="text-xs text-slate-400 text-center">{row.cuotas || '—'}</span>

                <input type="date" value={row.date}
                  onChange={e => updateRow(row.id, { date: e.target.value })}
                  className="px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-400 focus:outline-none text-xs bg-transparent" />

                <CategorySelect value={row.category} onChange={category => updateRow(row.id, { category })} />

                <button onClick={() => setRows(prev => prev.filter(r => r.id !== row.id))}
                  className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 text-sm">
          <button onClick={() => setRows(prev => prev.map(r => ({ ...r, selected: true })))}
            className="text-blue-600 hover:underline">Seleccionar todas</button>
          <span className="text-slate-300">|</span>
          <button onClick={() => setRows(prev => prev.map(r => ({ ...r, selected: false })))}
            className="text-slate-500 hover:underline">Deseleccionar todas</button>
        </div>
      </div>
    );
  }

  // ── Vista de revisión — PDF (Banco Nación / Mercado Pago) ───────────────────
  if (rows.length > 0) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">Revisar transacciones</h2>
              <span className={cn(
                'text-xs font-semibold px-2.5 py-1 rounded-full',
                detectedFormat === 'mercadopago'
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-emerald-100 text-emerald-700'
              )}>
                {detectedFormat === 'mercadopago' ? '💳 Mercado Pago' : '🏦 Banco Nación / VISA'}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Se encontraron <strong>{rows.length}</strong> transacciones · <strong>{selectedCount}</strong> seleccionadas
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium">
              <RotateCcw className="w-4 h-4" /> Subir otro
            </button>
            <button onClick={handleSaveAll} disabled={saving || selectedCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                : <><Save className="w-4 h-4" /> Guardar {selectedCount} gastos</>}
            </button>
          </div>
        </div>

        {mpCardInfo && detectedFormat === 'mercadopago' && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-center gap-4 flex-wrap">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">MP</span>
            </div>
            <div className="flex-1 flex items-center gap-4 flex-wrap">
              <div>
                <label className="text-xs text-sky-600 font-medium">Titular</label>
                <input value={mpCardInfo.cardholder}
                  onChange={e => setMpCardInfo({ ...mpCardInfo, cardholder: e.target.value })}
                  className="block w-full px-2 py-1 rounded-lg border border-sky-200 focus:outline-none focus:ring-1 focus:ring-sky-400 text-sm bg-white" />
              </div>
              <div>
                <label className="text-xs text-sky-600 font-medium">ID Tarjeta</label>
                <input value={mpCardInfo.cardLast4}
                  onChange={e => setMpCardInfo({ ...mpCardInfo, cardLast4: e.target.value })}
                  className="block w-24 px-2 py-1 rounded-lg border border-sky-200 focus:outline-none focus:ring-1 focus:ring-sky-400 text-sm bg-white font-mono"
                  maxLength={4} />
              </div>
              <div>
                <label className="text-xs text-sky-600 font-medium">Tipo</label>
                <p className="text-sm text-sky-800 font-medium capitalize">{mpCardInfo.cardType}</p>
              </div>
            </div>
            <p className="text-xs text-sky-500 w-full mt-1">
              Estos datos se guardan con cada gasto para que aparezca en Estado de Cuenta
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-[32px_1fr_70px_120px_90px_140px_36px] gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <div className="flex items-center">
              <input ref={masterCheckboxRef} type="checkbox" checked={allSelected}
                onChange={e => setRows(prev => prev.map(r => ({ ...r, selected: e.target.checked })))}
                className="w-4 h-4 rounded accent-blue-600" />
            </div>
            <div>Descripción / Etiquetas</div>
            <div>Cuotas</div>
            <div>Monto</div>
            <div>Fecha</div>
            <div>Categoría</div>
            <div />
          </div>

          <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
            {rows.map(row => (
              <div key={row.id}
                className={cn('grid grid-cols-[32px_1fr_70px_120px_90px_140px_36px] gap-2 px-4 py-1.5 items-center text-sm transition-colors',
                  row.selected ? 'bg-white' : 'bg-slate-50 opacity-50')}>
                <input type="checkbox" checked={row.selected}
                  onChange={e => updateRow(row.id, { selected: e.target.checked })}
                  className="w-4 h-4 rounded accent-blue-600" />

                <div className="flex flex-col gap-1">
                  <input value={row.description}
                    onChange={e => updateRow(row.id, { description: e.target.value })}
                    className="w-full px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-400 focus:outline-none text-sm bg-transparent" />
                  {row.operacion && (
                    <div className="px-2">
                      <span className="text-[10px] text-slate-400 leading-none font-mono">#{row.operacion}</span>
                    </div>
                  )}
                  <TagSelector selected={row.tags} onChange={tags => updateRow(row.id, { tags })} />
                </div>

                <div className="text-xs text-slate-500 text-center">
                  {row.cuotas ?? <span className="text-slate-300">—</span>}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium tabular-nums text-slate-800">
                    {row.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-500">{row.currency}</span>
                </div>

                <input type="date" value={row.date}
                  onChange={e => updateRow(row.id, { date: e.target.value })}
                  className="px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-400 focus:outline-none text-xs bg-transparent" />

                <CategorySelect value={row.category} onChange={category => updateRow(row.id, { category })} />

                <button onClick={() => setRows(prev => prev.filter(r => r.id !== row.id))}
                  className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 text-sm">
          <button onClick={() => setRows(prev => prev.map(r => ({ ...r, selected: true })))}
            className="text-blue-600 hover:underline">Seleccionar todas</button>
          <span className="text-slate-300">|</span>
          <button onClick={() => setRows(prev => prev.map(r => ({ ...r, selected: false })))}
            className="text-slate-500 hover:underline">Deseleccionar todas</button>
        </div>
      </div>
    );
  }

  // ── Vista de upload ─────────────────────────────────────────────────────────
  const isExcelFile = file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'));

  return (
    <div className="space-y-5">
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
          className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          {!file ? (
            <>
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="font-medium text-slate-700">Click o arrastrá tu archivo aquí</p>
              <p className="text-sm text-slate-400 mt-1">
                Resúmenes de tarjeta <strong>PDF</strong> (Banco Nación, VISA, Mercado Pago) o <strong>Excel</strong> (Santander .xlsx)
              </p>
            </>
          ) : isExcelFile ? (
            <>
              <FileSpreadsheet className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-slate-800">{file.name}</p>
              <p className="text-sm text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · Click para cambiar</p>
            </>
          ) : (
            <>
              <FileText className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <p className="font-semibold text-slate-800">{file.name}</p>
              <p className="text-sm text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · Click para cambiar</p>
            </>
          )}
        </div>

        {error && (
          <div className="space-y-3">
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            {rawText && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase">Texto extraído del PDF (primeros 800 chars):</p>
                <pre className="text-xs bg-slate-100 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto text-slate-700">{rawText}</pre>
              </div>
            )}
          </div>
        )}

        <button onClick={handleParse} disabled={!file || parsing}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 flex items-center justify-center gap-2 disabled:opacity-40">
          {parsing
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
            : isExcelFile
              ? <><FileSpreadsheet className="w-5 h-5" /> Procesar Excel</>
              : <><FileText className="w-5 h-5" /> Procesar PDF</>}
        </button>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-1">
          <p className="font-semibold mb-2">¿Qué podés importar?</p>
          <p>📄 <strong>PDF</strong>: Banco Nación, VISA, Mastercard, Mercado Pago</p>
          <p>📊 <strong>Excel</strong>: Resumen Santander (.xlsx) — Fecha | Descripcion | Cuotas | Monto</p>
          <p className="mt-2 text-xs text-blue-600">El formato se detecta automáticamente. El clasificador sugiere categoría y etiquetas.</p>
        </div>
      </div>
    </div>
  );
}
