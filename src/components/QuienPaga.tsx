/**
 * QuienPaga — selector de un toque: ¿de quién es este gasto?
 *
 *   [Yo] [Maru] [Bren] [½] [⋯]
 *
 * - Yo / persona: el gasto entero es de esa persona.
 * - ½: se divide en partes iguales con la persona que elijas.
 * - ⋯: reparto libre (responsable + montos por persona).
 *
 * Es controlado: devuelve `{ responsable, sharedWith }` por onChange y el
 * caller decide si persiste (Firestore) o guarda en estado local (importación).
 */
import { useMemo, useState } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExpenseStore } from '@/store/useExpenseStore';
import { ResponsableSelect } from '@/components/ResponsableSelect';
import { SharedWithEditor } from '@/components/SharedWithEditor';
import { asignar, modoDe, ownerName, personasAsignables, type Asignacion } from '@/lib/quienPaga';
import type { SharedParticipant } from '@/types';

interface Props {
  amount: number;
  currency?: string;
  responsable?: string;
  sharedWith?: SharedParticipant[];
  onChange: (a: Asignacion) => void;
  className?: string;
}

export function QuienPaga({ amount, currency, responsable, sharedWith, onChange, className }: Props) {
  const { responsables } = useExpenseStore();
  const owner = ownerName(responsables);
  const personas = useMemo(() => personasAsignables(responsables), [responsables]);
  const modo = modoDe({ amount, responsable, sharedWith }, responsables);

  const [eligiendoMitad, setEligiendoMitad] = useState(false);
  const [custom, setCustom] = useState(false);
  const mostrarCustom = custom || modo.tipo === 'custom';

  const chip = (active: boolean) =>
    cn(
      'px-2 py-0.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap',
      active
        ? 'bg-indigo-600 border-indigo-600 text-white'
        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700'
    );

  if (eligiendoMitad) {
    return (
      <div className={cn('flex flex-wrap items-center gap-1', className)}>
        <span className="text-xs text-slate-500">½ con:</span>
        {personas.map(p => (
          <button
            key={p.id}
            type="button"
            className={chip(modo.tipo === 'mitad' && modo.persona === p.name)}
            onClick={() => {
              onChange(asignar({ tipo: 'mitad', persona: p.name }, amount, responsables));
              setEligiendoMitad(false);
              setCustom(false);
            }}
          >
            {p.name}
          </button>
        ))}
        <button type="button" onClick={() => setEligiendoMitad(false)} className="p-0.5 text-slate-400 hover:text-slate-600" title="Cancelar">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          className={chip(modo.tipo === 'yo' && !mostrarCustom)}
          onClick={() => { onChange(asignar({ tipo: 'yo' }, amount, responsables)); setCustom(false); }}
          title={owner}
        >
          Yo
        </button>
        {personas.map(p => (
          <button
            key={p.id}
            type="button"
            className={chip(modo.tipo === 'todo' && modo.persona === p.name && !mostrarCustom)}
            onClick={() => { onChange(asignar({ tipo: 'todo', persona: p.name }, amount, responsables)); setCustom(false); }}
          >
            {p.name}
          </button>
        ))}
        <button
          type="button"
          className={chip(modo.tipo === 'mitad' && !mostrarCustom)}
          onClick={() => setEligiendoMitad(true)}
          title="Dividir en partes iguales"
        >
          {modo.tipo === 'mitad' ? `½ ${modo.persona}` : '½'}
        </button>
        <button
          type="button"
          className={chip(mostrarCustom)}
          onClick={() => setCustom(c => !c)}
          title="Repartir con montos a mano"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {mostrarCustom && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-violet-100 bg-violet-50/40 p-2 min-w-56">
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <span>Se queda con el resto:</span>
            <ResponsableSelect
              value={responsable ?? owner}
              onChange={val => onChange({ responsable: val || owner, sharedWith })}
              placeholder={owner}
            />
          </div>
          <SharedWithEditor
            value={sharedWith ?? []}
            onChange={sw => onChange({ responsable: responsable ?? owner, sharedWith: sw.length > 0 ? sw : undefined })}
            totalAmount={amount}
            currency={currency}
          />
        </div>
      )}
    </div>
  );
}
