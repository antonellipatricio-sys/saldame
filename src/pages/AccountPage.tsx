import { useEffect, useMemo, useState } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreditCard, DollarSign, Filter, TrendingDown, Wallet, Trash2, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportExpensesToExcel } from '@/lib/exportExcel';

interface CardSummary {
    cardLast4: string;
    cardholder: string;
    totalARS: number;
    totalUSD: number;
    count: number;
}

export function AccountPage() {
    const { expenses, fetchExpenses, deleteExpensesByCard, loading } = useExpenseStore();
    const [filterMonth, setFilterMonth] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<{ cardLast4: string | null; label: string; count: number } | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

    // Meses disponibles
    const availableMonths = useMemo(() => {
        const months = new Set(expenses.map(exp => format(new Date(exp.date), 'yyyy-MM')));
        return Array.from(months).sort().reverse();
    }, [expenses]);

    // Filtrar por mes si se elige uno
    const filtered = useMemo(() => {
        if (!filterMonth) return expenses;
        return expenses.filter(exp => format(new Date(exp.date), 'yyyy-MM') === filterMonth);
    }, [expenses, filterMonth]);

    // Agrupar por tarjeta
    const cardSummaries = useMemo(() => {
        const map = new Map<string, CardSummary>();

        for (const exp of filtered) {
            const key = exp.cardLast4 ?? 'sin-tarjeta';
            const existing = map.get(key);
            if (existing) {
                if (exp.currency === 'ARS') existing.totalARS += exp.amount;
                else existing.totalUSD += exp.amount;
                existing.count++;
            } else {
                map.set(key, {
                    cardLast4: exp.cardLast4 ?? '',
                    cardholder: exp.cardholder ?? 'Sin tarjeta asignada',
                    totalARS: exp.currency === 'ARS' ? exp.amount : 0,
                    totalUSD: exp.currency === 'USD' ? exp.amount : 0,
                    count: 1,
                });
            }
        }

        return Array.from(map.values()).sort((a, b) => (b.totalARS + b.totalUSD) - (a.totalARS + a.totalUSD));
    }, [filtered]);

    // Totales globales
    const totalARS = useMemo(() => filtered.filter(e => e.currency === 'ARS').reduce((s, e) => s + e.amount, 0), [filtered]);
    const totalUSD = useMemo(() => filtered.filter(e => e.currency === 'USD').reduce((s, e) => s + e.amount, 0), [filtered]);

    // Gastos de la tarjeta seleccionada
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const cardExpenses = useMemo(() => {
        if (!selectedCard) return [];
        return filtered
            .filter(exp => (exp.cardLast4 ?? 'sin-tarjeta') === selectedCard)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filtered, selectedCard]);

    const handleDeleteCard = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const cardLast4 = deleteTarget.cardLast4;
        const count = await deleteExpensesByCard(cardLast4, filterMonth || undefined);
        setDeleting(false);
        setDeleteTarget(null);
        if (selectedCard === (cardLast4 ?? 'sin-tarjeta')) setSelectedCard(null);
        console.log(`[AccountPage] Eliminados ${count} gastos`);
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
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Estado de Cuenta</h1>
                    <p className="text-slate-600 mt-1">Desglose de gastos por tarjeta</p>
                </div>
                <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={filterMonth}
                        onChange={e => { setFilterMonth(e.target.value); setSelectedCard(null); }}
                        className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="">Todos los meses</option>
                        {availableMonths.map(m => (
                            <option key={m} value={m}>
                                {format(new Date(m + '-01'), 'MMMM yyyy', { locale: es })}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">Total en Pesos</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">${totalARS.toLocaleString('es-AR')}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">Total en Dólares</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">US$ {totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">Tarjetas</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{cardSummaries.filter(c => c.cardLast4).length}</p>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cardSummaries.map(card => {
                    const isSelected = selectedCard === (card.cardLast4 || 'sin-tarjeta');
                    return (
                        <button
                            key={card.cardLast4 || 'sin-tarjeta'}
                            onClick={() => setSelectedCard(isSelected ? null : (card.cardLast4 || 'sin-tarjeta'))}
                            className={cn(
                                'bg-white rounded-xl shadow-sm border p-5 text-left transition-all hover:shadow-md',
                                isSelected
                                    ? 'border-blue-400 ring-2 ring-blue-200'
                                    : 'border-slate-200 hover:border-slate-300'
                            )}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        'w-10 h-10 rounded-lg flex items-center justify-center',
                                        card.cardLast4?.startsWith('MP') ? 'bg-gradient-to-br from-sky-400 to-blue-600' :
                                            card.cardLast4 ? 'bg-gradient-to-br from-slate-700 to-slate-900' : 'bg-slate-200'
                                    )}>
                                        {card.cardLast4?.startsWith('MP') ? (
                                            <span className="text-white font-bold text-xs">MP</span>
                                        ) : (
                                            <CreditCard className={cn('w-5 h-5', card.cardLast4 ? 'text-white' : 'text-slate-500')} />
                                        )}
                                    </div>
                                    <div>
                                        {card.cardLast4 ? (
                                            <>
                                                <p className="font-bold text-slate-800">
                                                    {card.cardLast4.startsWith('MP') ? 'Mercado Pago' : `•••• ${card.cardLast4}`}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {card.cardholder}
                                                    {card.cardLast4 === 'MPVT' && ' · Virtual'}
                                                    {card.cardLast4 === 'MPFS' && ' · Física'}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="font-medium text-slate-500">Gastos sin tarjeta</p>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-medium">
                                    {card.count} gastos
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteTarget({
                                            cardLast4: card.cardLast4 || null,
                                            label: card.cardLast4?.startsWith('MP') ? 'Mercado Pago' : card.cardLast4 ? `•••• ${card.cardLast4}` : 'sin tarjeta',
                                            count: card.count,
                                        });
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    title="Eliminar resumen"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex gap-4">
                                {card.totalARS > 0 && (
                                    <div>
                                        <p className="text-xs text-slate-500">ARS</p>
                                        <p className="text-lg font-bold text-slate-800">${card.totalARS.toLocaleString('es-AR')}</p>
                                    </div>
                                )}
                                {card.totalUSD > 0 && (
                                    <div>
                                        <p className="text-xs text-slate-500">USD</p>
                                        <p className="text-lg font-bold text-slate-800">US$ {card.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {cardSummaries.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <TrendingDown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No hay gastos cargados para el período seleccionado</p>
                    <p className="text-sm text-slate-400 mt-1">Subí un resumen de Santander para ver tus tarjetas acá</p>
                </div>
            )}

            {/* Detalle de tarjeta seleccionada */}
            {selectedCard && cardExpenses.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-slate-800">
                                Detalle {selectedCard === 'sin-tarjeta'
                                    ? 'gastos sin tarjeta'
                                    : selectedCard.startsWith('MP')
                                        ? 'Mercado Pago'
                                        : `tarjeta •••• ${selectedCard}`}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">{cardExpenses.length} movimientos</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const label = selectedCard === 'sin-tarjeta' ? 'sin-tarjeta' : selectedCard;
                                    const fname = `gastos_${label}${filterMonth ? '_' + filterMonth : ''}.xlsx`;
                                    exportExpensesToExcel(cardExpenses, fname);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 text-sm font-medium transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" /> Exportar Excel
                            </button>
                            <button
                                onClick={() => setDeleteTarget({
                                    cardLast4: selectedCard === 'sin-tarjeta' ? null : selectedCard,
                                    label: selectedCard === 'sin-tarjeta' ? 'sin tarjeta' : selectedCard.startsWith('MP') ? 'Mercado Pago' : `•••• ${selectedCard}`,
                                    count: cardExpenses.length,
                                })}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 text-sm font-medium transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Eliminar resumen
                            </button>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto">
                        {cardExpenses.map(exp => (
                            <div key={exp.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-800 truncate">{exp.description}</p>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                        <span>{format(new Date(exp.date), 'dd/MM/yyyy', { locale: es })}</span>
                                        <span className="text-slate-300">•</span>
                                        <span>{exp.category}</span>
                                        {exp.tags && exp.tags.length > 0 && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                {exp.tags.map(t => (
                                                    <span key={t} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{t}</span>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <p className="font-bold text-slate-800">
                                        {exp.currency === 'ARS' ? '$' : 'US$'} {exp.amount.toLocaleString('es-AR')}
                                    </p>
                                    <p className="text-xs text-slate-400">{exp.currency}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal de confirmación de eliminación */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Eliminar resumen</h3>
                                <p className="text-sm text-slate-500">Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-700">
                            ¿Eliminar <strong>{deleteTarget.count} gastos</strong> de <strong>{deleteTarget.label}</strong>
                            {filterMonth && <> del período <strong>{filterMonth}</strong></>}?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteCard}
                                disabled={deleting}
                                className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 text-sm flex items-center gap-2"
                            >
                                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando...</> : <><Trash2 className="w-4 h-4" /> Eliminar {deleteTarget.count} gastos</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
