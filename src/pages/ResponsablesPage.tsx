import { useState } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import type { Responsable } from '@/types';
import { Plus, Trash2, Pencil, Check, X, UserCircle2 } from 'lucide-react';

const EMOJI_OPTIONS = ['🧔', '👩', '👧', '👦', '🧑', '👨', '💁', '🙋', '🧑‍💼', '👱', '🧒', '🧓'];

export function ResponsablesPage() {
    const { responsables, addResponsable, updateResponsable, deleteResponsable, renameResponsable, expenses } = useExpenseStore();

    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newItem, setNewItem] = useState({ name: '', emoji: EMOJI_OPTIONS[0] });
    const [editItem, setEditItem] = useState({ name: '', emoji: '', aliases: '' });

    const handleCreate = async () => {
        if (!newItem.name.trim()) return;
        const id = `resp-${newItem.name.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        await addResponsable({ id, name: newItem.name.trim(), emoji: newItem.emoji });
        setNewItem({ name: '', emoji: EMOJI_OPTIONS[0] });
        setIsCreating(false);
    };

    const startEdit = (r: Responsable) => {
        setEditingId(r.id);
        setEditItem({
            name: r.name,
            emoji: r.emoji,
            aliases: (r.aliases ?? []).join(', '),
        });
    };

    const handleUpdate = async (id: string) => {
        if (!editItem.name.trim()) return;
        const r = responsables.find(r => r.id === id);
        const aliases = editItem.aliases
            .split(',')
            .map(a => a.trim().toLowerCase())
            .filter(Boolean);

        if (r && editItem.name.trim() !== r.name) {
            // Nombre cambió: renombrar + migrar todos los gastos asociados
            await renameResponsable(id, editItem.name.trim());
        }

        await updateResponsable(id, {
            name: editItem.name.trim(),
            emoji: editItem.emoji,
            aliases: aliases.length > 0 ? aliases : undefined,
        });
        setEditingId(null);
    };

    const handleDelete = async (id: string, name: string) => {
        const count = expenses.filter(e => e.responsable === name).length;
        const msg = count > 0
            ? `"${name}" tiene ${count} gasto${count > 1 ? 's' : ''} asociado${count > 1 ? 's' : ''}. ¿Eliminar igualmente?`
            : `¿Eliminar a "${name}"?`;
        if (confirm(msg)) await deleteResponsable(id);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Responsables</h1>
                        <p className="text-slate-600 mt-1">Personas que pueden tener gastos asignados</p>
                    </div>
                    <button
                        onClick={() => { setIsCreating(true); setEditingId(null); }}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                    >
                        <Plus className="w-5 h-5" /> Nuevo
                    </button>
                </div>

                {/* Formulario nuevo */}
                {isCreating && (
                    <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5 space-y-4">
                        <h3 className="font-semibold text-slate-800">Nuevo responsable</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                            <input
                                autoFocus
                                type="text"
                                value={newItem.name}
                                onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setIsCreating(false); }}
                                placeholder="Ej: Patricio, Maru..."
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Emoji</label>
                            <div className="flex flex-wrap gap-2">
                                {EMOJI_OPTIONS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => setNewItem((p) => ({ ...p, emoji }))}
                                        className={`text-xl px-2 py-1 rounded-lg border-2 transition-all ${newItem.emoji === emoji ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-slate-300'}`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-500">Vista previa:</span>
                            <span className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700">
                                {newItem.emoji} {newItem.name || 'Nombre'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                <Check className="w-4 h-4" /> Crear
                            </button>
                            <button onClick={() => setIsCreating(false)} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors">
                                <X className="w-4 h-4" /> Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Lista */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
                    {responsables.length === 0 && (
                        <div className="text-center py-12">
                            <UserCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500">No hay responsables. Creá uno con el botón "Nuevo".</p>
                        </div>
                    )}
                    {responsables.map((r) => {
                        const gastoCount = expenses.filter(e => e.responsable === r.name).length;
                        return (
                            <div key={r.id} className="p-4">
                                {editingId === r.id ? (
                                    <div className="space-y-3">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={editItem.name}
                                            onChange={(e) => setEditItem((p) => ({ ...p, name: e.target.value }))}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(r.id); if (e.key === 'Escape') setEditingId(null); }}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            {EMOJI_OPTIONS.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => setEditItem((p) => ({ ...p, emoji }))}
                                                    className={`text-xl px-2 py-1 rounded-lg border-2 transition-all ${editItem.emoji === emoji ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-slate-300'}`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Aliases (separados por coma) — nombres en resúmenes de TC
                                            </label>
                                            <input
                                                type="text"
                                                value={editItem.aliases}
                                                onChange={(e) => setEditItem((p) => ({ ...p, aliases: e.target.value }))}
                                                placeholder="Ej: mariana, mariana antonelli, m. antonelli"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleUpdate(r.id)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
                                                <Check className="w-3 h-3" /> Guardar
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1.5 rounded text-sm hover:bg-slate-200">
                                                <X className="w-3 h-3" /> Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{r.emoji}</span>
                                            <div>
                                                <p className="font-semibold text-slate-800">{r.name}</p>
                                                <p className="text-xs text-slate-400">{gastoCount} gasto{gastoCount !== 1 ? 's' : ''}</p>
                                                {r.aliases && r.aliases.length > 0 && (
                                                    <p className="text-xs text-violet-500 mt-0.5">
                                                        🔗 {r.aliases.join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => startEdit(r)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(r.id, r.name)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
