/**
 * ResponsableSelect — selector de responsable con opción "Otro..." para nombre libre.
 * Las opciones base se leen del store (responsables). Al ingresar un nombre nuevo
 * lo persiste automáticamente en el store (visible en el módulo Responsables).
 */
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useExpenseStore } from '@/store/useExpenseStore';

interface Props {
  value: string | undefined;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}

const DEFAULT_EMOJI = '🧑';

export function ResponsableSelect({ value, onChange, className, placeholder = '— resp. —' }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [custom, setCustom] = useState('');
  const { responsables, addResponsable } = useExpenseStore();

  const knownNames = useMemo(() => responsables.map((r) => r.name), [responsables]);

  const confirmCustom = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) { onChange(''); setShowInput(false); return; }

    // Si el nombre no está en el store, lo persiste automáticamente
    if (!knownNames.includes(trimmed)) {
      const id = `resp-${trimmed.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      await addResponsable({ id, name: trimmed, emoji: DEFAULT_EMOJI });
    }

    onChange(trimmed);
  };

  if (showInput) {
    return (
      <div className="flex gap-1 items-center">
        <input
          autoFocus
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onBlur={() => confirmCustom(custom)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              confirmCustom(custom);
              (e.target as HTMLInputElement).blur();
            }
            if (e.key === 'Escape') {
              setCustom('');
              onChange('');
              setShowInput(false);
            }
          }}
          placeholder="Escribí el nombre..."
          className={cn(
            'text-xs border border-blue-400 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 w-28',
            className
          )}
        />
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={e => {
        if (e.target.value === '__otro__') {
          setShowInput(true);
          setCustom('');
        } else {
          onChange(e.target.value);
        }
      }}
      className={cn(
        'text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400',
        className
      )}
    >
      <option value="">{placeholder}</option>
      {responsables.map((r) => (
        <option key={r.id} value={r.name}>{r.emoji} {r.name}</option>
      ))}
      <option value="__otro__">+ Otro...</option>
    </select>
  );
}
