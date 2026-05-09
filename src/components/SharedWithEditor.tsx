import { useState } from 'react';
import { Users, Plus, X } from 'lucide-react';
import { ResponsableSelect } from '@/components/ResponsableSelect';
import type { SharedParticipant } from '@/types';

interface Props {
  value: SharedParticipant[];
  onChange: (participants: SharedParticipant[]) => void;
  /** Monto total del gasto, para mostrar el neto del responsable principal */
  totalAmount?: number;
  currency?: string;
}

export function SharedWithEditor({ value, onChange, totalAmount, currency = 'ARS' }: Props) {
  const [open, setOpen] = useState(value.length > 0);

  const addParticipant = () => {
    onChange([...value, { responsable: '', amount: 0 }]);
    setOpen(true);
  };

  const updateParticipant = (idx: number, updates: Partial<SharedParticipant>) => {
    onChange(value.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  const removeParticipant = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
    if (next.length === 0) setOpen(false);
  };

  const sharedTotal = value.reduce((sum, p) => sum + (p.amount || 0), 0);
  const net = totalAmount != null ? totalAmount - sharedTotal : null;

  // Badge compacto cuando está cerrado y hay participantes
  if (!open && value.length > 0) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-2 py-0.5 hover:bg-violet-100 transition-colors w-full"
        title="Ver gastos compartidos"
      >
        <Users className="w-3 h-3 shrink-0" />
        <span className="truncate">
          {value.map(p => p.responsable || '?').join(', ')}
        </span>
      </button>
    );
  }

  // Botón toggle cuando está cerrado y vacío
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => { setOpen(true); addParticipant(); }}
        className="flex items-center gap-1 text-[10px] font-medium text-violet-500 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-md px-1.5 py-0.5 transition-colors w-fit"
        title="Marcar como gasto compartido"
      >
        <Users className="w-3 h-3" />
        <span>compartir</span>
      </button>
    );
  }

  // Editor expandido
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center gap-1 text-xs font-medium text-violet-700">
        <Users className="w-3 h-3" />
        <span>Compartido con:</span>
        <button
          type="button"
          onClick={() => { onChange([]); setOpen(false); }}
          className="ml-auto text-slate-400 hover:text-red-400"
          title="Quitar compartir"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {value.map((p, idx) => (
        <div key={idx} className="flex gap-1 items-center">
          <div className="flex-1 min-w-0">
            <ResponsableSelect
              value={p.responsable}
              onChange={name => updateParticipant(idx, { responsable: name })}
              placeholder="— quién —"
            />
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={p.amount || ''}
            onChange={e => updateParticipant(idx, { amount: parseFloat(e.target.value) || 0 })}
            placeholder="monto"
            className="w-20 text-xs border border-slate-200 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-violet-400 bg-white"
          />
          <button
            type="button"
            onClick={() => removeParticipant(idx)}
            className="p-0.5 text-slate-400 hover:text-red-400 shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addParticipant}
        className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 mt-0.5"
      >
        <Plus className="w-3 h-3" /> Agregar persona
      </button>

      {net != null && value.length > 0 && (
        <p className="text-[10px] text-slate-500 mt-0.5">
          Tu parte: <span className="font-semibold text-slate-700">
            {net.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span> {currency}
        </p>
      )}
    </div>
  );
}
