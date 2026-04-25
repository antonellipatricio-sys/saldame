import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Check, ArrowRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

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

export function SharedExpensesPage({ groupId }: { groupId?: string | null }) {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [expenses, setExpenses] = useState<SharedExpense[]>([]);
    const [eventName, setEventName] = useState('Cargando...');
    const [loading, setLoading] = useState(true);

    const [newParticipantName, setNewParticipantName] = useState('');
    const [newExpenseDesc, setNewExpenseDesc] = useState('');
    const [newExpenseAmt, setNewExpenseAmt] = useState('');
    const [newExpensePayer, setNewExpensePayer] = useState('');

    const [selectedInvolved, setSelectedInvolved] = useState<Record<string, boolean>>({});

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

    const saveToFirebase = async (newParticipants: Participant[], newExpenses: SharedExpense[]) => {
        if (!groupId) return;
        await setDoc(doc(db, 'sharedGroups', groupId), {
            participants: newParticipants,
            expenses: newExpenses
        }, { merge: true });
    };

    const addParticipant = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newParticipantName.trim()) return;
        const newP = { id: crypto.randomUUID(), name: newParticipantName.trim() };
        saveToFirebase([...participants, newP], expenses);
        setNewParticipantName('');
    };

    const removeParticipant = (id: string) => {
        saveToFirebase(participants.filter(p => p.id !== id), expenses);
    };

    const addExpense = (e: React.FormEvent) => {
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

        const expense: SharedExpense = {
            id: crypto.randomUUID(),
            description: newExpenseDesc.trim(),
            amount,
            payerId: newExpensePayer,
            involvedIds: involved,
        };

        saveToFirebase(participants, [...expenses, expense]);
        setNewExpenseDesc('');
        setNewExpenseAmt('');

        const resettedSelected: Record<string, boolean> = {};
        Object.keys(selectedInvolved).forEach(id => resettedSelected[id] = true);
        setSelectedInvolved(resettedSelected);
    };

    const removeExpense = (id: string) => {
        saveToFirebase(participants, expenses.filter(e => e.id !== id));
    };

    const toggleInvolved = (id: string) => {
        setSelectedInvolved(prev => ({ ...prev, [id]: !prev[id] }));
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
        let i = 0;
        let j = 0;

        while (i < debts.length && j < creditors.length) {
            const d = debts[i];
            const c = creditors[j];
            const amount = Math.min(d.amount, c.amount);

            if (amount > 0.01) {
                transfers.push({ from: d.id, to: c.id, amount });
            }

            d.amount -= amount;
            c.amount -= amount;

            if (d.amount < 0.01) i++;
            if (c.amount < 0.01) j++;
        }

        return transfers;
    };

    const getName = (id: string) => participants.find(p => p.id === id)?.name || 'Desconocido';
    const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

    const transfers = getTransfers();

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
            <div>
                <a href="/gastos" className="text-sm text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1 mb-2">
                    &larr; Volver a Mis Juntadas
                </a>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <img src="/logopato.png" alt="Saldame Logo" className="w-12 h-12 object-contain drop-shadow" />
                    {eventName}
                </h1>
                <p className="text-slate-500 text-sm mt-1">Dividí los gastos con amigos fácilmente en tiempo real</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: Personas e Ingreso */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-slate-400" />
                            Participantes
                        </h2>

                        <form onSubmit={addParticipant} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Nombre"
                                className="flex-1 w-full rounded-lg border-slate-200 bg-slate-50 border p-3 text-base focus:border-blue-500 focus:ring-blue-500"
                                value={newParticipantName}
                                onChange={(e) => setNewParticipantName(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700 transition"
                                disabled={!newParticipantName.trim()}
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </form>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {participants.map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs">
                                            {getInitials(p.name)}
                                        </div>
                                        {p.name}
                                    </div>
                                    <button
                                        onClick={() => removeParticipant(p.id)}
                                        className="text-red-500 hover:bg-red-50 p-1 rounded transition"
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
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="font-bold text-slate-800 mb-4">Agregar Gasto</h2>
                        <form onSubmit={addExpense} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Descripción</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Asado, Bebidas"
                                    className="w-full rounded-lg border-slate-200 bg-slate-50 border p-3 text-base focus:border-blue-500 focus:ring-blue-500"
                                    value={newExpenseDesc}
                                    onChange={(e) => setNewExpenseDesc(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Monto ($)</label>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="any"
                                        placeholder="0.00"
                                        className="w-full rounded-lg border-slate-200 bg-slate-50 border p-3 text-base focus:border-blue-500 focus:ring-blue-500"
                                        value={newExpenseAmt}
                                        onChange={(e) => setNewExpenseAmt(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Pagado por</label>
                                    <select
                                        className="w-full rounded-lg border-slate-200 bg-slate-50 border p-3 text-base focus:border-blue-500 focus:ring-blue-500"
                                        value={newExpensePayer}
                                        onChange={(e) => setNewExpensePayer(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Seleccionar...</option>
                                        {participants.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-2">Se divide entre:</label>
                                <div className="flex flex-wrap gap-2">
                                    {participants.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => toggleInvolved(p.id)}
                                            className={`px-3 py-1 text-xs rounded-full border transition-all ${selectedInvolved[p.id]
                                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                                                }`}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                    {participants.length === 0 && (
                                        <span className="text-xs text-slate-400 italic">Agregá personas primero</span>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-2 rounded-lg hover:shadow-md transition-all disabled:opacity-50"
                                disabled={participants.length === 0}
                            >
                                Registrar Gasto
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
                                        <h3 className="font-medium text-sm text-slate-800">{e.description}</h3>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Pagó {getName(e.payerId)}: <span className="text-slate-800">${e.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => removeExpense(e.id)}
                                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2 flex flex-wrap gap-1 items-center">
                                    Dividido entre:
                                    {e.involvedIds.map(id => (
                                        <span key={id} className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
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
                    <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        Quién le paga a quién
                    </h2>

                    <div className="space-y-4">
                        {transfers.length > 0 ? (
                            transfers.map((t, idx) => (
                                <div key={idx} className="flex flex-col gap-1 p-3 bg-green-50/50 border border-green-100 rounded-lg">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-slate-700">{getName(t.from)}</span>
                                        <ArrowRight className="w-4 h-4 text-slate-400 mx-2" />
                                        <span className="font-medium text.slate-700">{getName(t.to)}</span>
                                    </div>
                                    <div className="text-center font-bold text-green-600">
                                        ${t.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-sm text-slate-400 py-10">
                                {expenses.length > 0 ? '¡Cuentas saldadas! Nadie debe nada.' : 'Agregá gastos para calcular las deudas.'}
                            </div>
                        )}

                        {expenses.length > 0 && (
                            <button
                                onClick={() => {
                                    if (confirm('¿Seguro que deseas borrar todos los gastos? Los participantes se mantendrán.')) {
                                        saveToFirebase(participants, []);
                                    }
                                }}
                                className="w-full mt-6 py-2 border border-slate-200 text-slate-500 font-medium text-sm rounded-lg hover:bg-slate-50 transition"
                            >
                                Reiniciar Gastos
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
