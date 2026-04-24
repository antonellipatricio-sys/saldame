import { useState } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import type { Tag } from '@/types';
import { Plus, Trash2, Pencil, Check, X, Tag as TagIcon } from 'lucide-react';

const TAG_COLOR_OPTIONS = [
    { label: 'Azul', value: 'bg-blue-100 text-blue-700' },
    { label: 'Verde', value: 'bg-green-100 text-green-700' },
    { label: 'Naranja', value: 'bg-orange-100 text-orange-700' },
    { label: 'Rojo', value: 'bg-red-100 text-red-700' },
    { label: 'Violeta', value: 'bg-purple-100 text-purple-700' },
    { label: 'Gris', value: 'bg-slate-100 text-slate-600' },
    { label: 'Amarillo', value: 'bg-yellow-100 text-yellow-700' },
    { label: 'Rosa', value: 'bg-pink-100 text-pink-700' },
];

export function TagsPage() {
    const { tags, addTag, updateTag, deleteTag } = useExpenseStore();

    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const [editingTagId, setEditingTagId] = useState<string | null>(null);
    const [newTag, setNewTag] = useState({ name: '', color: TAG_COLOR_OPTIONS[0].value });
    const [editTag, setEditTag] = useState({ name: '', color: '' });

    const handleCreateTag = () => {
        if (!newTag.name.trim()) return;
        addTag({ id: `tag-${Date.now()}`, name: newTag.name.trim(), color: newTag.color });
        setNewTag({ name: '', color: TAG_COLOR_OPTIONS[0].value });
        setIsCreatingTag(false);
    };

    const startEditTag = (tag: Tag) => {
        setEditingTagId(tag.id);
        setEditTag({ name: tag.name, color: tag.color });
    };

    const handleUpdateTag = (id: string) => {
        if (!editTag.name.trim()) return;
        updateTag(id, { name: editTag.name.trim(), color: editTag.color });
        setEditingTagId(null);
    };

    const handleDeleteTag = (id: string, name: string) => {
        if (confirm(`¿Eliminar la etiqueta "${name}"?`)) deleteTag(id);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Etiquetas</h1>
                        <p className="text-slate-600 mt-1">Agrupá gastos con etiquetas personalizadas</p>
                    </div>
                    <button
                        onClick={() => { setIsCreatingTag(true); setEditingTagId(null); }}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                    >
                        <Plus className="w-5 h-5" /> Nueva
                    </button>
                </div>

                {/* Formulario nueva etiqueta */}
                {isCreatingTag && (
                    <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5 space-y-4">
                        <h3 className="font-semibold text-slate-800">Nueva etiqueta</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                            <input
                                autoFocus
                                type="text"
                                value={newTag.name}
                                onChange={(e) => setNewTag((p) => ({ ...p, name: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTag(); if (e.key === 'Escape') setIsCreatingTag(false); }}
                                placeholder="Ej: Gastos Fijos, Viajes, Trabajo..."
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                            <div className="flex flex-wrap gap-2">
                                {TAG_COLOR_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setNewTag((p) => ({ ...p, color: opt.value }))}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-all ${opt.value} ${newTag.color === opt.value ? 'border-slate-700 scale-110' : 'border-transparent'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-500">Vista previa:</span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${newTag.color}`}>
                                <TagIcon className="w-3 h-3" />
                                {newTag.name || 'Mi etiqueta'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCreateTag} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                <Check className="w-4 h-4" /> Crear
                            </button>
                            <button onClick={() => setIsCreatingTag(false)} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors">
                                <X className="w-4 h-4" /> Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Lista de etiquetas */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
                    {tags.length === 0 && (
                        <p className="text-center text-slate-500 py-12">No hay etiquetas. Creá una con el botón "Nueva".</p>
                    )}
                    {tags.map((tag) => (
                        <div key={tag.id} className="p-4">
                            {editingTagId === tag.id ? (
                                <div className="space-y-3">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={editTag.name}
                                        onChange={(e) => setEditTag((p) => ({ ...p, name: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {TAG_COLOR_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setEditTag((p) => ({ ...p, color: opt.value }))}
                                                className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-all ${opt.value} ${editTag.color === opt.value ? 'border-slate-700 scale-110' : 'border-transparent'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdateTag(tag.id)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                            <Check className="w-3 h-3" /> Guardar
                                        </button>
                                        <button onClick={() => setEditingTagId(null)} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded text-sm hover:bg-slate-200">
                                            <X className="w-3 h-3" /> Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${tag.color}`}>
                                        <TagIcon className="w-3.5 h-3.5" />
                                        {tag.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => startEditTag(tag)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteTag(tag.id, tag.name)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
