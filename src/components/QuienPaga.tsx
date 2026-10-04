/**
 * QuienPaga — selector de un toque: ¿de quién es este gasto?
 *
 *   [Yo] [Maru] [Bren] [½] [⋯]
 *
 * - Yo / persona: el gasto entero es de esa persona.
 * - ½: se divide en partes iguales con la persona que elijas.
 * - ⋯: reparto libre (responsable + montos por persona).
 *
 * Si se pasa `descripcion`, después de elegir ofrece "¿Siempre que venga X?"
 * para crear una regla (o quitarla al volver a "Yo").
 *
 * Es controlado: devuelve `{ responsable, sharedWith }` por onChange y el
 * caller decide si persiste (Firestore) o guarda en estado local (importación).
 */
import { useMemo, useState } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExpenseStore } from '@/store/useExpenseStore';
import { useReglasStore, type ReglaPago } from '@/store/useReglasStore';
import { ResponsableSelect } from '@/components/ResponsableSelect';
import { SharedWithEditor } from '@/components/SharedWithEditor';
import {
  asignar, claveDescripcion, modoDe, ownerName, personasAsignables, reglaPara,
  type Asignacion, type Modo,
} from '@/lib/quienPaga';
import type { SharedParticipant } from '@/types';

type ModoSimple = Exclude<Modo, { tipo: 'custom' }>;

interface Props {
  amount: number;
  currency?: string;
  responsable?: string;
  sharedWith?: SharedParticipant[];
  onChange: (a: Asignacion) => void;
  /** Descripción del gasto: habilita la pregunta "¿Siempre?" */
  descripcion?: string;
  /** Al crear una regla: aplicarla a otros gastos. Devuelve a cuántos se aplicó. */
  onReglaCreada?: (regla: ReglaPago) => number | Promise<number>;
  className?: string;
}

type Pregunta =
  | { tipo: 'crear'; modo: Exclude<ModoSimple, { tipo: 'yo' }>; patron: string }
  | { tipo: 'quitar'; regla: ReglaPago }
  | { tipo: 'hecho'; texto: string };

export function QuienPaga({ amount, currency, responsable, sharedWith, onChange, descripcion, onReglaCreada, className }: Props) {
  const { responsables } = useExpenseStore();
  const { reglas, saveRegla, deleteRegla } = useReglasStore();
  const owner = ownerName(responsables);
  const personas = useMemo(() => personasAsignables(responsables), [responsables]);
  const modo = modoDe({ amount, responsable, sharedWith }, responsables);

  const [eligiendoMitad, setEligiendoMitad] = useState(false);
  const [custom, setCustom] = useState(false);
  const [pregunta, setPregunta] = useState<Pregunta | null>(null);
  const [guardando, setGuardando] = useState(false);
  const mostrarCustom = custom || modo.tipo === 'custom';

  const elegir = (m: ModoSimple) => {
    onChange(asignar(m, amount, responsables));
    setEligiendoMitad(false);
    setCustom(false);
    if (!descripcion) return;
    const existente = reglaPara(descripcion, reglas);
    if (m.tipo === 'yo') {
      setPregunta(existente ? { tipo: 'quitar', regla: existente } : null);
    } else if (existente && existente.tipo === m.tipo && existente.persona === m.persona) {
      setPregunta(null); // ya hay una regla igual
    } else {
      setPregunta({ tipo: 'crear', modo: m, patron: existente?.patron ?? claveDescripcion(descripcion) });
    }
  };

  const crearRegla = async (p: Extract<Pregunta, { tipo: 'crear' }>) => {
    const patron = claveDescripcion(p.patron);
    if (!patron) return;
    setGuardando(true);
    try {
      await saveRegla({ patron, tipo: p.modo.tipo, persona: p.modo.persona });
      const regla = useReglasStore.getState().reglas.find(r => r.patron === patron)!;
      const n = onReglaCreada ? await onReglaCreada(regla) : 0;
      setPregunta({ tipo: 'hecho', texto: n > 0 ? `Listo. También se aplicó a ${n} gasto${n !== 1 ? 's' : ''} más.` : 'Listo, queda como regla.' });
    } finally {
      setGuardando(false);
    }
  };

  const chip = (active: boolean) =>
    cn(
      'px-3 py-1.5 md:px-2 md:py-0.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap',
      active
        ? 'bg-indigo-600 border-indigo-600 text-white'
        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700'
    );

  const etiqueta = (m: Exclude<ModoSimple, { tipo: 'yo' }>) => (m.tipo === 'mitad' ? `½ con ${m.persona}` : m.persona);

  const preguntaUI = pregunta && (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-xs text-amber-900">
      {pregunta.tipo === 'crear' && (
        <>
          <span>¿Siempre que venga</span>
          <input
            value={pregunta.patron}
            onChange={e => setPregunta({ ...pregunta, patron: e.target.value })}
            className="min-w-0 w-32 px-1 py-0.5 rounded border border-amber-300 bg-white text-slate-700"
            title="Texto que tiene que aparecer en la descripción"
          />
          <span>→ <strong>{etiqueta(pregunta.modo)}</strong>?</span>
          <button type="button" disabled={guardando} onClick={() => crearRegla(pregunta)}
            className="px-2 py-0.5 rounded bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-50">
            Sí
          </button>
          <button type="button" onClick={() => setPregunta(null)} className="px-1.5 py-0.5 rounded hover:bg-amber-100">No</button>
        </>
      )}
      {pregunta.tipo === 'quitar' && (
        <>
          <span>Hay una regla: «{pregunta.regla.patron}» → {etiqueta({ tipo: pregunta.regla.tipo, persona: pregunta.regla.persona })}. ¿Borrarla?</span>
          <button type="button" onClick={async () => { await deleteRegla(pregunta.regla.id); setPregunta({ tipo: 'hecho', texto: 'Regla borrada.' }); }}
            className="px-2 py-0.5 rounded bg-amber-600 text-white font-semibold hover:bg-amber-700">
            Borrar
          </button>
          <button type="button" onClick={() => setPregunta(null)} className="px-1.5 py-0.5 rounded hover:bg-amber-100">No</button>
        </>
      )}
      {pregunta.tipo === 'hecho' && (
        <>
          <span>{pregunta.texto}</span>
          <button type="button" onClick={() => setPregunta(null)} className="p-0.5 hover:bg-amber-100 rounded"><X className="w-3 h-3" /></button>
        </>
      )}
    </div>
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
            onClick={() => elegir({ tipo: 'mitad', persona: p.name })}
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
          onClick={() => elegir({ tipo: 'yo' })}
          title={owner}
        >
          Yo
        </button>
        {personas.map(p => (
          <button
            key={p.id}
            type="button"
            className={chip(modo.tipo === 'todo' && modo.persona === p.name && !mostrarCustom)}
            onClick={() => elegir({ tipo: 'todo', persona: p.name })}
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

      {preguntaUI}

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

