import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Calendar, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface VisitedEvent {
    id: string;
    name: string;
    lastVisited: number;
}

export function SharedExpensesDashboard() {
    const [visitedEvents, setVisitedEvents] = useState<VisitedEvent[]>(() => {
        try {
            const saved = localStorage.getItem('saldame_visited_events');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [newEventName, setNewEventName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        localStorage.setItem('saldame_visited_events', JSON.stringify(visitedEvents));
    }, [visitedEvents]);

    const generateId = () => {
        return Math.random().toString(36).substring(2, 10);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventName.trim()) return;

        setIsCreating(true);
        const id = generateId();

        try {
            await setDoc(doc(db, 'sharedGroups', id), {
                title: newEventName.trim(),
                createdAt: serverTimestamp(),
                participants: [],
                expenses: []
            });

            // Guardar en local
            const newEvent: VisitedEvent = {
                id,
                name: newEventName.trim(),
                lastVisited: Date.now()
            };

            const updatedEvents = [newEvent, ...visitedEvents];
            setVisitedEvents(updatedEvents);
            localStorage.setItem('saldame_visited_events', JSON.stringify(updatedEvents));

            // Redirect
            window.location.href = `/gastos/${id}`;
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Hubo un error al crear la juntada. Revisa tu conexión.");
            setIsCreating(false);
        }
    };

    const handleRemoveHistory = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        e.preventDefault();
        if (confirm('¿Seguro que deseas borrar esta juntada de tu historial? No se borrará de la nube, solo de este listado.')) {
            setVisitedEvents(visitedEvents.filter(ev => ev.id !== id));
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 py-4">
            {/* Banner Header */}
            <div className="w-full mb-6 relative aspect-[21/9] sm:aspect-[16/5] rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-brand-primary/5">
                <img
                    src="/banner-gastos.png?v=2"
                    alt="Gastos Compartidos"
                    className="w-full h-full object-cover object-center sm:object-[center_30%]"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Crear Evento */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit">
                    <h2 className="text-lg font-bold text-brand-primary mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-brand-success" />
                        Nueva Juntada
                    </h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Nombre del evento</label>
                            <input
                                type="text"
                                placeholder="Ej: Viaje a Mendoza, Asado del sábado..."
                                className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 focus:border-brand-primary focus:outline-none"
                                value={newEventName}
                                onChange={(e) => setNewEventName(e.target.value)}
                                disabled={isCreating}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!newEventName.trim() || isCreating}
                            className="w-full bg-brand-success text-white font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
                        >
                            {isCreating ? 'Creando...' : '+ Crear y Compartir'}
                        </button>
                    </form>
                </div>

                {/* Historial de Eventos */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-lg font-bold text-brand-primary mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-brand-success" />
                        Mis Juntadas Recientes
                    </h2>

                    <div className="space-y-3">
                        {visitedEvents.length === 0 ? (
                            <div className="text-center py-8 text-brand-text text-sm border-2 border-dashed border-brand-primary/20 rounded-xl">
                                No tienes juntadas recientes.<br />¡Crea una nueva arriba!
                            </div>
                        ) : (
                            visitedEvents.map((ev) => (
                                <a
                                    key={ev.id}
                                    href={`/gastos/${ev.id}`}
                                    className="group flex justify-between items-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-brand-primary/5 hover:border-brand-primary/20 transition-all cursor-pointer"
                                >
                                    <div>
                                        <h3 className="font-semibold text-brand-primary transition capitalize">{ev.name}</h3>
                                        <p className="text-xs text-brand-text mt-0.5">Hace {Math.round((Date.now() - ev.lastVisited) / (1000 * 60 * 60 * 24))} días</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => handleRemoveHistory(e, ev.id)}
                                            className="text-slate-400/50 hover:text-brand-alert transition-all p-2"
                                            title="Borrar juntada (solo se quita de tu historial)"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shadow-sm">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </a>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
