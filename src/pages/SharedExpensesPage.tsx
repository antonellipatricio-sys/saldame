import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Check, ArrowRight, Wallet, Receipt, RotateCcw, Share2, FileText, Copy, Pencil } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { generateSharedExpensesPDF } from '../lib/pdfGenerator';

interface Participant {
    id: string;
    name: string;
}

interface SharedExpense {
    id: string;
    description: string;
    amount: number;
    payerId: string;
    involvedIds: string[];
}

interface SharedPayment {
    id: string;
    fromId: string;
    toId: string;
    amount: number;
    method?: string;
    date: number;
}

export function SharedExpensesPage({ groupId }: { groupId?: string | null }) {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [expenses, setExpenses] = useState<SharedExpense[]>([]);
    const [payments, setPayments] = useState<SharedPayment[]>([]);
    const [eventName, setEventName] = useState('Cargando...');
    const [loading, setLoading] = useState(true);

    const [newParticipantName, setNewParticipantName] = useState('');
    const [newExpenseDesc, setNewExpenseDesc] = useState('');
    const [newExpenseAmt, setNewExpenseAmt] = useState('');
    const [newExpensePayer, setNewExpensePayer] = useState('');

    const [selectedInvolved, setSelectedInvolved] = useState<Record<string, boolean>>({});
    const [showPaymentForm, setShowPaymentForm] = useState<{ from: string, to: string, amount: number } | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [roundingMode, setRoundingMode] = useState<number>(0);

    useEffect(() => {
        if (!groupId) {
            setLoading(false);
            setEventName('Evento no encontrado');
            return;
        }

        const unsubscribe = onSnapshot(doc(db, 'sharedGroups', groupId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const title = data.title || 'Evento Compartido';
                setEventName(title);
                setParticipants(data.participants || []);
                setExpenses(data.expenses || []);
                setPayments(data.payments || []);
                setLoading(false);

                // Añadir al historial local de visitas (Dashboard)
                try {
                    const saved = localStorage.getItem('saldame_visited_events');
                    let visitedEvents = saved ? JSON.parse(saved) : [];
                    visitedEvents = visitedEvents.filter((ev: any) => ev.id !== groupId);
                    visitedEvents.unshift({
                        id: groupId,
                        name: title,
                        lastVisited: Date.now()
                    });
                    localStorage.setItem('saldame_visited_events', JSON.stringify(visitedEvents));
                } catch (e) {
                    console.error("Error al guardar historial:", e);
                }
            } else {
                setEventName('Evento no encontrado');
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [groupId]);

    useEffect(() => {
        const newSelected = { ...selectedInvolved };
        let changed = false;
        participants.forEach(p => {
            if (newSelected[p.id] === undefined) {
                newSelected[p.id] = true;
                changed = true;
            }
        });
        if (changed) {
            setSelectedInvolved(newSelected);
        }
    }, [participants]);

    const saveToFirebase = async (newParticipants: Participant[], newExpenses: SharedExpense[], newPayments: SharedPayment[] = payments) => {
        if (!groupId) return;
        await setDoc(doc(db, 'sharedGroups', groupId), {
            participants: newParticipants,
            expenses: newExpenses,
            payments: newPayments
        }, { merge: true });
    };

    const addParticipant = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newParticipantName.trim()) return;
        const newP = { id: crypto.randomUUID(), name: newParticipantName.trim() };

        let newExpenses = expenses;
        // Si ya hay gastos registrados, preguntamos si quiere sumarla a las deudas anteriores
        if (expenses.length > 0) {
            if (window.confirm(`¿Querés que ${newP.name} se agregue automáticamente a todos los gastos que ya estaban registrados? (Si ponés Cancelar, vas a tener que sumarla manualmente con el lápiz en cada gasto que corresponda).`)) {
                newExpenses = expenses.map(expense => ({
                    ...expense,
                    involvedIds: [...expense.involvedIds, newP.id]
                }));
            }
        }

        saveToFirebase([...participants, newP], newExpenses);
        setNewParticipantName('');
    };

    const removeParticipant = (id: string) => {
        if (confirm('¿Seguro que deseas eliminar a este participante? Sus montos se recalcularán pero sus gastos registrados se mantendrán.')) {
            saveToFirebase(participants.filter(p => p.id !== id), expenses);
        }
    };

    const handleSubmitExpense = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(newExpenseAmt);
        if (!newExpensePayer) {
            alert('Debes seleccionar quién pagó el gasto.');
            return;
        }

        if (!newExpenseDesc.trim() || !amount || amount <= 0) {
            alert('Por favor ingresa una descripción y un monto válido.');
            return;
        }

        const involved = Object.keys(selectedInvolved).filter(id => selectedInvolved[id]);
        if (involved.length === 0) {
            alert('Debes seleccionar al menos un participante para dividir el gasto.');
            return;
        }

        if (editingExpenseId) {
            const updatedExpenses = expenses.map(ex => {
                if (ex.id === editingExpenseId) {
                    return {
                        ...ex,
                        description: newExpenseDesc.trim(),
                        amount,
                        payerId: newExpensePayer,
                        involvedIds: involved,
                    };
                }
                return ex;
            });
            saveToFirebase(participants, updatedExpenses);
            setEditingExpenseId(null);
        } else {
            const expense: SharedExpense = {
                id: crypto.randomUUID(),
                description: newExpenseDesc.trim(),
                amount,
                payerId: newExpensePayer,
                involvedIds: involved,
            };
            saveToFirebase(participants, [...expenses, expense]);
        }

        setNewExpenseDesc('');
        setNewExpenseAmt('');
        setNewExpensePayer('');

        const resettedSelected: Record<string, boolean> = {};
        Object.keys(selectedInvolved).forEach(id => resettedSelected[id] = true);
        setSelectedInvolved(resettedSelected);
    };

    const editExpense = (expense: SharedExpense) => {
        setEditingExpenseId(expense.id);
        setNewExpenseDesc(expense.description);
        setNewExpenseAmt(expense.amount.toString());
        setNewExpensePayer(expense.payerId);

        const newSelected: Record<string, boolean> = {};
        participants.forEach(p => {
            newSelected[p.id] = expense.involvedIds.includes(p.id);
        });
        setSelectedInvolved(newSelected);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingExpenseId(null);
        setNewExpenseDesc('');
        setNewExpenseAmt('');
        setNewExpensePayer('');
        const resettedSelected: Record<string, boolean> = {};
        Object.keys(selectedInvolved).forEach(id => resettedSelected[id] = true);
        setSelectedInvolved(resettedSelected);
    };

    const removeExpense = (id: string) => {
        if (confirm('¿Seguro que deseas eliminar este gasto?')) {
            saveToFirebase(participants, expenses.filter(e => e.id !== id));
        }
    };

    const toggleInvolved = (id: string) => {
        setSelectedInvolved(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const addPayment = (from: string, to: string, amount: number, method: string) => {
        const payment: SharedPayment = {
            id: crypto.randomUUID(),
            fromId: from,
            toId: to,
            amount,
            method: method.trim() || '', // Use empty string instead of undefined
            date: Date.now()
        };
        saveToFirebase(participants, expenses, [...payments, payment]);
        setShowPaymentForm(null);
        setPaymentMethod('');
    };

    const removePayment = (id: string) => {
        if (confirm('¿Seguro que deseas eliminar este registro de pago?')) {
            saveToFirebase(participants, expenses, payments.filter(p => p.id !== id));
        }
    };

    // Calculation Logic
    const getBalances = () => {
        const balances: Record<string, number> = {};
        participants.forEach(p => balances[p.id] = 0);

        expenses.forEach(ext => {
            if (balances[ext.payerId] === undefined) {
                balances[ext.payerId] = 0;
            }
            balances[ext.payerId] += ext.amount;

            const validInvolved = ext.involvedIds.filter(id => balances[id] !== undefined);
            if (validInvolved.length > 0) {
                const split = ext.amount / validInvolved.length;
                validInvolved.forEach(id => {
                    balances[id] -= split;
                });
            }
        });

        payments.forEach(p => {
            if (balances[p.fromId] !== undefined) balances[p.fromId] += p.amount;
            if (balances[p.toId] !== undefined) balances[p.toId] -= p.amount;
        });

        if (roundingMode > 0) {
            let sum = 0;
            const roundedBalances: Record<string, number> = {};
            for (const [id, bal] of Object.entries(balances)) {
                let rounded = Math.round(bal / roundingMode) * roundingMode;
                roundedBalances[id] = rounded;
                sum += rounded;
            }

            let currentSum = Math.round(sum);
            let loopGuard = 1000;
            while (currentSum !== 0 && loopGuard > 0) {
                loopGuard--;
                const keys = Object.keys(roundedBalances).filter(k => roundedBalances[k] !== 0);
                if (keys.length === 0) break;

                if (currentSum > 0) {
                    const maxId = keys.reduce((a, b) => roundedBalances[a] > roundedBalances[b] ? a : b);
                    roundedBalances[maxId] -= roundingMode;
                    currentSum -= roundingMode;
                } else {
                    const maxId = keys.reduce((a, b) => roundedBalances[a] > roundedBalances[b] ? a : b);
                    roundedBalances[maxId] += roundingMode;
                    currentSum += roundingMode;
                }
            }
            return roundedBalances;
        }

        return balances;
    };

    const getTransfers = () => {
        const balances = getBalances();
        const debts: { id: string, amount: number }[] = [];
        const creditors: { id: string, amount: number }[] = [];

        for (const [id, balance] of Object.entries(balances)) {
            if (balance < -0.01) debts.push({ id, amount: -balance });
            if (balance > 0.01) creditors.push({ id, amount: balance });
        }

        debts.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        const transfers: { from: string, to: string, amount: number }[] = [];

        for (let i = 0; i < debts.length; i++) {
            for (let j = 0; j < creditors.length; j++) {
                if (debts[i].amount > 0 && Math.abs(debts[i].amount - creditors[j].amount) < 0.01) {
                    transfers.push({ from: debts[i].id, to: creditors[j].id, amount: debts[i].amount });
                    debts[i].amount = 0;
                    creditors[j].amount = 0;
                    break;
                }
            }
        }

        let i = 0;
        let j = 0;

        while (i < debts.length && j < creditors.length) {
            if (debts[i].amount < 0.01) { i++; continue; }
            if (creditors[j].amount < 0.01) { j++; continue; }

            const d = debts[i];
            const c = creditors[j];
            const amount = Math.min(d.amount, c.amount);

            if (amount > 0.01) {
                transfers.push({ from: d.id, to: c.id, amount });
            }

            d.amount -= amount;
            c.amount -= amount;
        }

        return transfers;
    };

    const getName = (id: string) => participants.find(p => p.id === id)?.name || 'Desconocido';
    const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

    const transfers = getTransfers();

    const handleCopySummary = () => {
        let text = `*Resumen de Gastos: ${eventName}*\n\n`;

        text += `💰 *Liquidación de Cuentas:*\n`;
        if (transfers.length > 0) {
            transfers.forEach(t => {
                text += `• ${getName(t.from)} 👉 ${getName(t.to)}: *$${roundingMode > 0 ? t.amount.toLocaleString('es-AR') : t.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}*\n`;
            });
        } else {
            text += `¡No hay deudas pendientes! 🎉\n`;
        }

        text += `\n📊 *Detalle de Gastos:*\n`;
        expenses.forEach(e => {
            text += `• ${e.description}: $${e.amount.toLocaleString('es-AR')} (Pagó: ${getName(e.payerId)})\n`;
        });

        if (payments.length > 0) {
            text += `\n✅ *Pagos Realizados:*\n`;
            payments.forEach(p => {
                text += `• ${getName(p.fromId)} le pagó a ${getName(p.toId)}: *$${p.amount.toLocaleString('es-AR')}*${p.method ? ` (${p.method})` : ''}\n`;
            });
        }

        text += `\n🔗 Ver detalle completo:\n${window.location.href}`;

        navigator.clipboard.writeText(text).then(() => {
            alert('¡Resumen copiado para WhatsApp!');
        });
    };

    const handleDownloadPDF = () => {
        generateSharedExpensesPDF(eventName, participants, expenses, payments, transfers);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-slate-500">
                <p>Cargando evento...</p>
            </div>
        );
    }

    if (!groupId) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold text-slate-800">Evento no encontrado</h1>
                <p className="text-slate-500 mt-2">No se proveyó un ID válido.</p>
                <a href="/gastos" className="mt-4 inline-block text-blue-600 hover:underline">Volver a mis eventos</a>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <a
                    href="/gastos"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all w-fit"
                >
                    &larr; Volver a Mis Juntadas
                </a>
            </div>

            <div className="mb-6">
                <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-brand-primary/5">
                    <img
                        src="/banner-gastos.png?v=2"
                        alt="Gastos Compartidos"
                        className="w-full h-auto block"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4 sm:p-6 opacity-0 hover:opacity-100 transition-opacity">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg flex items-center gap-2">
                            {eventName}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: Personas e Ingreso */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="font-bold text-brand-primary mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-text" />
                            Participantes
                        </h2>

                        <form onSubmit={addParticipant} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Nombre de la persona"
                                className="flex-1 w-full rounded-xl border-slate-300 bg-slate-50 border p-3 text-base focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                                value={newParticipantName}
                                onChange={(e) => setNewParticipantName(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-brand-primary text-white p-3 rounded-xl hover:opacity-90 transition shadow-sm"
                                disabled={!newParticipantName.trim()}
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </form>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {participants.map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xs">
                                            {getInitials(p.name)}
                                        </div>
                                        {p.name}
                                    </div>
                                    <button
                                        onClick={() => removeParticipant(p.id)}
                                        className="text-brand-alert hover:bg-red-50 p-1 rounded transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {participants.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-2">No hay participantes aún</p>
                            )}
                        </div>
                    </div>

                    {/* Formulario de Gasto */}
                    <div className={`bg-white p-6 rounded-xl border shadow-sm transition-colors ${editingExpenseId ? 'border-brand-primary/50 ring-2 ring-brand-primary/10' : 'border-slate-200'}`}>
                        <h2 className="font-bold text-brand-primary mb-4 flex items-center justify-between">
                            {editingExpenseId ? 'Editar Gasto' : 'Agregar Gasto'}
                            {editingExpenseId && (
                                <button type="button" onClick={cancelEdit} className="text-sm text-slate-500 hover:text-slate-800 font-normal">
                                    Cancelar
                                </button>
                            )}
                        </h2>
                        <form onSubmit={handleSubmitExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Descripción</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Asado, Bebidas"
                                    className="w-full rounded-xl border-slate-300 bg-slate-50 border p-3 text-base focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                                    value={newExpenseDesc}
                                    onChange={(e) => setNewExpenseDesc(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Monto ($)</label>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="any"
                                        placeholder="0.00"
                                        className="w-full rounded-xl border-slate-300 bg-slate-50 border p-3 text-base font-bold text-slate-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                                        value={newExpenseAmt}
                                        onChange={(e) => setNewExpenseAmt(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Pagado por</label>
                                    <select
                                        className="w-full rounded-xl border-brand-primary/50 bg-brand-primary/5 border-2 p-3 text-base font-bold text-brand-primary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none appearance-none"
                                        value={newExpensePayer}
                                        onChange={(e) => setNewExpensePayer(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>¿Quién pagó?</option>
                                        {participants.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-bold text-slate-700 mb-3">Se divide entre:</label>
                                <div className="flex flex-wrap gap-3">
                                    {participants.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => toggleInvolved(p.id)}
                                            className={`px-4 py-2 text-sm font-bold rounded-xl border-2 transition-all flex items-center gap-2 ${selectedInvolved[p.id]
                                                ? 'bg-brand-primary border-brand-primary text-white shadow-md transform scale-105'
                                                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70 grayscale'
                                                }`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${selectedInvolved[p.id] ? 'bg-white' : 'bg-slate-300'}`} />
                                            {p.name}
                                        </button>
                                    ))}
                                    {participants.length === 0 && (
                                        <span className="text-sm text-slate-400 italic bg-slate-50 px-3 py-2 rounded-lg border border-dashed border-slate-300">
                                            Agregá personas primero
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-brand-primary text-white font-bold text-lg py-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-md active:scale-[0.98] mt-4"
                                disabled={participants.length === 0}
                            >
                                {editingExpenseId ? 'Guardar Cambios' : 'Registrar Gasto'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Columna Central: Lista de Gastos */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="font-bold text-slate-800 mb-4">Gastos ({expenses.length})</h2>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                        {expenses.map(e => (
                            <div key={e.id} className="p-3 border border-slate-100 bg-slate-50 rounded-lg relative group">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 text-sm">{e.description}</h3>
                                        <p className="text-sm text-slate-600 mt-1">
                                            Pagó <span className="font-bold text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-lg">{getName(e.payerId)}</span>: <span className="font-black text-slate-900 ml-1">${e.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => editExpense(e)}
                                            className="text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 p-2 rounded-xl transition-all"
                                            title="Editar gasto"
                                        >
                                            <Pencil className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => removeExpense(e.id)}
                                            className="text-brand-alert/50 hover:text-brand-alert hover:bg-brand-alert/10 p-2 rounded-xl transition-all"
                                            title="Eliminar gasto"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-200/60 pt-3 flex flex-wrap gap-1.5 items-center">
                                    <Users className="w-3 h-3 mr-1" />
                                    {e.involvedIds.map(id => (
                                        <span key={id} className="bg-white text-slate-600 px-2 py-1 rounded-md border border-slate-200 font-medium">
                                            {getName(id)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {expenses.length === 0 && (
                            <div className="text-center text-sm text-slate-400 py-10">
                                <p>No hay gastos registrados.</p>
                                <p className="mt-1">Agregá tu primer gasto a la izquierda.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna Derecha: Pagos y Saldos */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-brand-primary flex items-center gap-2">
                            <Check className="w-5 h-5 text-brand-success" />
                            Quién le paga a quién
                        </h2>
                        <select
                            className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg px-2 py-1 outline-none font-medium"
                            value={roundingMode}
                            onChange={(e) => setRoundingMode(Number(e.target.value))}
                        >
                            <option value={0}>Exacto</option>
                            <option value={10}>Múltiplos $10</option>
                            <option value={50}>Múltiplos $50</option>
                            <option value={100}>Múltiplos $100</option>
                            <option value={500}>Múltiplos $500</option>
                            <option value={1000}>Múltiplos $1000</option>
                        </select>
                    </div>

                    <div className="space-y-4">
                        {transfers.length > 0 ? (
                            transfers.map((t, idx) => (
                                <div key={idx} className="flex flex-col gap-1 p-3 bg-green-50/50 border border-green-100 rounded-lg group relative">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-semibold text-slate-900">{getName(t.from)}</span>
                                        <ArrowRight className="w-4 h-4 text-slate-400 mx-2" />
                                        <span className="font-semibold text-slate-900">{getName(t.to)}</span>
                                    </div>
                                    <div className="text-center font-bold text-brand-success text-lg">
                                        ${roundingMode > 0 ? t.amount.toLocaleString('es-AR') : t.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>

                                    {/* Botón Pagar */}
                                    <button
                                        onClick={() => setShowPaymentForm({ from: t.from, to: t.to, amount: t.amount })}
                                        className="mt-2 flex items-center justify-center gap-2 py-2 px-4 bg-brand-success text-white text-xs font-bold rounded-lg hover:bg-brand-success/90 transition-all shadow-sm active:scale-95"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        Marcar como pagado
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-sm text-slate-400 py-10">
                                {expenses.length > 0 ? '¡Cuentas saldadas! Nadie debe nada.' : 'Agregá gastos para calcular las deudas.'}
                            </div>
                        )}

                        {/* Listado de Pagos ya realizados */}
                        {payments.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-brand-primary" />
                                    Pagos Registrados
                                </h3>
                                <div className="space-y-3">
                                    {payments.map(p => (
                                        <div key={p.id} className="text-xs bg-slate-50 border border-slate-100 p-3 rounded-lg flex justify-between items-center group">
                                            <div>
                                                <div className="font-medium text-slate-900">
                                                    {getName(p.fromId)} le pagó a {getName(p.toId)}
                                                </div>
                                                <div className="font-black text-brand-success mt-1 text-sm">
                                                    ${p.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </div>
                                                {p.method && (
                                                    <div className="mt-1 flex items-center gap-1 text-slate-400 font-medium italic">
                                                        <Wallet className="w-3 h-3" />
                                                        {p.method}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removePayment(p.id)}
                                                className="text-slate-300 hover:text-brand-alert p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Eliminar este pago"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {expenses.length > 0 && (
                            <div className="pt-6 border-t border-slate-100 space-y-3">
                                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Share2 className="w-4 h-4 text-brand-primary" />
                                    Compartir Resultados
                                </h3>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleDownloadPDF}
                                        className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                    >
                                        <FileText className="w-4 h-4 text-brand-alert" />
                                        PDF
                                    </button>
                                    <button
                                        onClick={handleCopySummary}
                                        className="flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-sm active:scale-95"
                                    >
                                        <Copy className="w-4 h-4" />
                                        WhatsApp
                                    </button>
                                </div>
                            </div>
                        )}

                        {expenses.length > 0 && (
                            <button
                                onClick={() => {
                                    if (confirm('¿Seguro que deseas borrar todos los gastos y pagos? Los participantes se mantendrán.')) {
                                        saveToFirebase(participants, [], []);
                                    }
                                }}
                                className="w-full mt-6 py-2 border border-slate-200 text-brand-primary font-medium text-sm rounded-lg hover:bg-brand-primary/5 transition flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reiniciar Todo
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* Modal de Pago */}
            {showPaymentForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <h3 className="font-bold text-slate-800 text-lg">Registrar Pago</h3>
                            <button onClick={() => setShowPaymentForm(null)} className="text-slate-400 hover:text-slate-600 p-1">&times;</button>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Transferencia</div>
                            <div className="flex items-center justify-between font-bold text-slate-800">
                                <span>{getName(showPaymentForm.from)}</span>
                                <ArrowRight className="w-4 h-4 text-slate-400" />
                                <span>{getName(showPaymentForm.to)}</span>
                            </div>
                            <div className="mt-2 text-2xl font-black text-brand-success">
                                ${showPaymentForm.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            addPayment(showPaymentForm.from, showPaymentForm.to, showPaymentForm.amount, paymentMethod);
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Medio de pago (opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Transferencia, Efectivo, Mercado Pago"
                                    className="w-full rounded-xl border-slate-300 bg-slate-50 border p-3 text-base focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentForm(null)}
                                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-4 py-3 bg-brand-success text-white font-bold rounded-xl hover:bg-brand-success/90 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Check className="w-5 h-5" />
                                    Confirmar Pago
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
