/**
 * TagSelector compacto:
 * - Muestra solo los tags YA seleccionados como chips con ×
 * - Botón "+" que abre un dropdown con todos los tags disponibles para elegir
 */
import { useState, useRef, useEffect } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface TagSelectorProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export function TagSelector({ selected, onChange }: TagSelectorProps) {
  const { tags } = useExpenseStore();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click afuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const remove = (name: string) => onChange(selected.filter((t) => t !== name));

  const toggle = (name: string) => {
    onChange(
      selected.includes(name)
        ? selected.filter((t) => t !== name)
        : [...selected, name]
    );
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
      {tags.length > 0 && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-slate-400 border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-500 transition-all"
        >
          <Plus className="w-3 h-3" />
          {selected.length === 0 ? 'Etiqueta' : ''}
        </button>
      )}

      {/* Dropdown picker */}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-2 min-w-[160px]">
          {tags.length === 0 && (
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
          {unselected.length === 0 && selected.length > 0 && (
            <p className="text-xs text-slate-400 px-2 py-1 border-t border-slate-100 mt-1">Todas asignadas</p>
          )}
        </div>
      )}
    </div>
  );
}
