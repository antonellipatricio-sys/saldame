/**
 * TagSelector compacto:
 * - Muestra solo los tags YA seleccionados como chips con ×
 * - Botón "+" que abre un dropdown con todos los tags disponibles para elegir
 * - Opción "Nueva etiqueta" al pie del dropdown para crear al vuelo
 */
import { useState, useRef, useEffect } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { cn } from '@/lib/utils';
import { Plus, X, Check } from 'lucide-react';

const TAG_COLOR_OPTIONS = [
  { label: 'Azul',    value: 'bg-blue-100 text-blue-700' },
  { label: 'Verde',   value: 'bg-green-100 text-green-700' },
  { label: 'Naranja', value: 'bg-orange-100 text-orange-700' },
  { label: 'Rojo',    value: 'bg-red-100 text-red-700' },
  { label: 'Violeta', value: 'bg-purple-100 text-purple-700' },
  { label: 'Gris',    value: 'bg-slate-100 text-slate-600' },
  { label: 'Amarillo',value: 'bg-yellow-100 text-yellow-700' },
  { label: 'Rosa',    value: 'bg-pink-100 text-pink-700' },
];

interface TagSelectorProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export function TagSelector({ selected, onChange }: TagSelectorProps) {
  const { tags, addTag } = useExpenseStore();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(TAG_COLOR_OPTIONS[0].value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cerrar al hacer click afuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setNewName('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus al abrir el formulario de creación
  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  const remove = (name: string) => onChange(selected.filter((t) => t !== name));

  const toggle = (name: string) => {
    onChange(
      selected.includes(name)
        ? selected.filter((t) => t !== name)
        : [...selected, name]
    );
  };

  const handleCreateTag = () => {
    const name = newName.trim();
    if (!name) return;
    const newTag = { id: `tag-${Date.now()}`, name, color: newColor };
    addTag(newTag);
    onChange([...selected, name]);
    setNewName('');
    setNewColor(TAG_COLOR_OPTIONS[0].value);
    setCreating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateTag();
    if (e.key === 'Escape') { setCreating(false); setNewName(''); }
  };

  const unselected = tags.filter((t) => !selected.includes(t.name));

  return (
    <div ref={containerRef} className="flex flex-wrap gap-1.5 items-center relative">
      {/* Tags seleccionados */}
      {selected.map((name) => {
        const tagObj = tags.find((t) => t.name === name);
        return (
          <span
            key={name}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              tagObj?.color ?? 'bg-slate-100 text-slate-600'
            )}
          >
            {name}
            <button
              type="button"
              onClick={() => remove(name)}
              className="hover:opacity-70 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        );
      })}

      {/* Botón para abrir picker */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-slate-400 border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-500 transition-all"
      >
        <Plus className="w-3 h-3" />
        {selected.length === 0 ? 'Etiqueta' : ''}
      </button>

      {/* Dropdown picker */}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-2 min-w-[170px]">
          {tags.length === 0 && !creating && (
            <p className="text-xs text-slate-400 px-2 py-1">Sin etiquetas</p>
          )}
          {tags.map((tag) => {
            const isSelected = selected.includes(tag.name);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => { toggle(tag.name); }}
                className={cn(
                  'w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors',
                  isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full shrink-0', isSelected ? 'bg-blue-500' : 'bg-slate-300')} />
                <span className={cn('px-1.5 py-0.5 rounded-full font-medium', tag.color)}>{tag.name}</span>
                {isSelected && <X className="w-3 h-3 ml-auto text-slate-400" />}
              </button>
            );
          })}
          {unselected.length === 0 && selected.length > 0 && tags.length > 0 && (
            <p className="text-xs text-slate-400 px-2 py-1 border-t border-slate-100 mt-1">Todas asignadas</p>
          )}

          {/* Separador + crear nueva etiqueta */}
          <div className={cn('mt-1', tags.length > 0 && 'border-t border-slate-100 pt-1')}>
            {!creating ? (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-blue-600 hover:bg-blue-50 transition-colors font-medium"
              >
                <Plus className="w-3 h-3" /> Nueva etiqueta
              </button>
            ) : (
              <div className="space-y-2 px-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nombre..."
                  className="w-full px-2 py-1 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
                {/* Picker de color */}
                <div className="flex flex-wrap gap-1">
                  {TAG_COLOR_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewColor(opt.value)}
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium border-2 transition-all',
                        opt.value,
                        newColor === opt.value ? 'border-slate-700 scale-105' : 'border-transparent'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {/* Preview + acciones */}
                <div className="flex items-center justify-between gap-1">
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium truncate', newColor)}>
                    {newName || 'Vista previa'}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleCreateTag}
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
