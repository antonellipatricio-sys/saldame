/**
 * CategorySelect: dropdown custom para seleccionar o crear categorías al vuelo.
 * Usado en la tabla de revisión de transacciones.
 */
import { useState, useRef, useEffect } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { cn } from '@/lib/utils';
import { Plus, Check, X, ChevronDown } from 'lucide-react';

const ICON_OPTIONS = ['🍔', '🚗', '🛒', '💊', '🎬', '👕', '🏠', '✈️', '💼', '❓', '💰', '🎮', '📱', '🐾', '🎓', '⚽', '🍷', '💅', '🏋️', '🎁', '🔧', '💡', '🏥', '📚', '🎵', '☕', '🍕', '🚌', '💳', '🏦'];

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CategorySelect({ value, onChange, className }: CategorySelectProps) {
  const { categories, addCategory } = useExpenseStore();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('❓');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = categories.find(c => c.name === value);

  // Cerrar al hacer click afuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setNewName('');
        setNewIcon('❓');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus al abrir el formulario de creación
  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  const handleSelect = (catName: string) => {
    onChange(catName);
    setOpen(false);
    setCreating(false);
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const newCat = { id: crypto.randomUUID(), name, icon: newIcon, color: '#B2BEC3' };
    addCategory(newCat);
    onChange(name);
    setNewName('');
    setNewIcon('❓');
    setCreating(false);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') { setCreating(false); setNewName(''); }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setCreating(false); }}
        className="flex items-center gap-1 px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:outline-none text-xs bg-transparent w-full text-left"
      >
        <span className="shrink-0">{selected?.icon ?? '❓'}</span>
        <span className="truncate flex-1">{value || 'Sin categoría'}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg min-w-[180px] max-h-72 overflow-y-auto">
          {/* Lista de categorías existentes */}
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelect(cat.name)}
              className={cn(
                'w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs transition-colors',
                cat.name === value ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-700'
              )}
            >
              <span>{cat.icon}</span>
              <span className="truncate">{cat.name}</span>
              {cat.name === value && <Check className="w-3 h-3 ml-auto shrink-0" />}
            </button>
          ))}

          {/* Separador + botón nueva categoría */}
          <div className="border-t border-slate-100 mt-1">
            {!creating ? (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 transition-colors font-medium"
              >
                <Plus className="w-3 h-3" /> Nueva categoría
              </button>
            ) : (
              <div className="p-2 space-y-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nombre..."
                  className="w-full px-2 py-1 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
                {/* Picker de íconos */}
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {ICON_OPTIONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewIcon(icon)}
                      className={cn(
                        'text-sm w-7 h-7 rounded border-2 transition-all',
                        newIcon === icon ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-400'
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                {/* Preview + acciones */}
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs text-slate-500 truncate">
                    {newIcon} {newName || 'Vista previa'}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={!newName.trim()}
                      className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCreating(false); setNewName(''); }}
                      className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
