/**
 * ResponsableSelect — selector de responsable con opción "Otro..." para nombre libre.
 * Las opciones base se leen del store (responsables). Muestra además los nombres
 * custom usados en gastos existentes que no estén en el store.
 */
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useExpenseStore } from '@/store/useExpenseStore';

interface Props {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}

export function ResponsableSelect({ value, onChange, className, placeholder = '— resp. —' }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [custom, setCustom] = useState('');
  const { expenses, responsables } = useExpenseStore();

  const knownNames = useMemo(() => responsables.map((r) => r.name), [responsables]);

  // Nombres usados en gastos que no están en el store
  const extraOptions = useMemo(() => {
    const all = new Set<string>();
    for (const e of expenses) {
      if (e.responsable && !knownNames.includes(e.responsable)) {
        all.add(e.responsable);
      }
    }
    if (value && !knownNames.includes(value)) {
      all.add(value);
    }
    return Array.from(all).sort();
  }, [expenses, knownNames, value]);

  useEffect(() => {
    setShowInput(false);
    setCustom('');
  }, [value]);

  if (showInput) {
    return (
      <div className="flex gap-1 items-center">
        <input
          autoFocus
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onBlur={() => {
            if (custom.trim()) {
              onChange(custom.trim());
            } else {
              onChange('');
              setShowInput(false);
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (custom.trim()) onChange(custom.trim());
              else { onChange(''); setShowInput(false); }
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
      {extraOptions.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
      <option value="__otro__">+ Otro...</option>
    </select>
  );
}
