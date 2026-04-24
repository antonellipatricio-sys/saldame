import { useState } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import type { Category } from '@/types';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';

const ICON_OPTIONS = ['🍔', '🚗', '🛒', '💊', '🎬', '👕', '🏠', '✈️', '💼', '❓', '💰', '🎮', '📱', '🐾', '🎓', '⚽', '🍷', '💅', '🏋️', '🎁', '🔧', '💡', '🏥', '📚', '🎵', '☕', '🍕', '🚌', '💳', '🏦'];
const COLOR_OPTIONS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9', '#74B9FF', '#A29BFE', '#FD79A8', '#B2BEC3', '#00B894', '#E17055', '#6C5CE7', '#FDCB6E', '#81ECEC', '#55EFC4'];



export function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useExpenseStore();

  // ── Estado categorías ──
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCat, setNewCat] = useState({ name: '', icon: '❓', color: '#B2BEC3' });
  const [editCat, setEditCat] = useState({ name: '', icon: '', color: '' });



  const handleCreate = () => {
    if (!newCat.name.trim()) return;
    addCategory({ id: crypto.randomUUID(), name: newCat.name.trim(), icon: newCat.icon, color: newCat.color });
    setNewCat({ name: '', icon: '❓', color: '#B2BEC3' });
    setIsCreating(false);
  };

  const startEdit = (cat: Category) => { setEditingId(cat.id); setEditCat({ name: cat.name, icon: cat.icon, color: cat.color }); };

  const handleUpdate = (id: string) => {
    if (!editCat.name.trim()) return;
    updateCategory(id, { name: editCat.name.trim(), icon: editCat.icon, color: editCat.color });
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Eliminar la categoría "${name}"?`)) deleteCategory(id);
  };



  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* ── CATEGORÍAS ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Categorías</h1>
            <p className="text-slate-600 mt-1">Gestioná tus categorías de gastos</p>
          </div>
          <button
            onClick={() => { setIsCreating(true); setEditingId(null); }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            <Plus className="w-5 h-5" /> Nueva
          </button>
        </div>

        {/* Formulario nueva categoría */}
        {isCreating && (
          <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Nueva categoría</h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={newCat.name}
                onChange={(e) => setNewCat((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Mascotas"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ícono</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewCat((p) => ({ ...p, icon }))}
                    className={`text-xl w-9 h-9 rounded-lg border-2 transition-all ${newCat.icon === icon ? 'border-blue-500 bg-blue-50 scale-110' : 'border-slate-200 hover:border-slate-400'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCat((p) => ({ ...p, color }))}
                    style={{ backgroundColor: color }}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${newCat.color === color ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <span className="text-2xl">{newCat.icon}</span>
              <span
                className="px-3 py-1 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: newCat.color }}
              >
                {newCat.name || 'Vista previa'}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Check className="w-4 h-4" /> Crear
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de categorías */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
          {categories.length === 0 && (
            <p className="text-center text-slate-500 py-12">No hay categorías</p>
          )}

          {categories.map((cat) => (
            <div key={cat.id} className="p-4">
              {editingId === cat.id ? (
                /* Modo edición */
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editCat.name}
                    onChange={(e) => setEditCat((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <div className="flex flex-wrap gap-1">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setEditCat((p) => ({ ...p, icon }))}
                        className={`text-lg w-8 h-8 rounded border-2 transition-all ${editCat.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditCat((p) => ({ ...p, color }))}
                        style={{ backgroundColor: color }}
                        className={`w-7 h-7 rounded-full border-2 ${editCat.color === color ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(cat.id)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      <Check className="w-3 h-3" /> Guardar
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded text-sm hover:bg-slate-200">
                      <X className="w-3 h-3" /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* Modo vista */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <span
                      className="px-3 py-1 rounded-full text-white text-sm font-medium"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>{/* fin categorías */}



    </div>
  );
}
