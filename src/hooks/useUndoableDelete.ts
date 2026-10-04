import { useCallback, useEffect, useRef, useState } from 'react';

const UNDO_MS = 5000;

interface Pending {
  id: string;
  message: string;
}

// Borrado con "Deshacer": el ítem se oculta enseguida y se borra de verdad a los 5 segundos.
// Si se borra otro antes, o se sale de la página, el pendiente se confirma en el momento.
export function useUndoableDelete(commit: (id: string) => Promise<void> | void) {
  const [pending, setPending] = useState<Pending | null>(null);
  const pendingRef = useRef<Pending | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  }, [commit]);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const current = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    if (current) void commitRef.current(current.id);
  }, []);

  const remove = useCallback((id: string, message: string) => {
    flush();
    const next = { id, message };
    pendingRef.current = next;
    setPending(next);
    timer.current = setTimeout(flush, UNDO_MS);
  }, [flush]);

  const undo = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pendingRef.current = null;
    setPending(null);
  }, []);

  useEffect(() => flush, [flush]);

  return { pendingId: pending?.id ?? null, pendingMessage: pending?.message ?? null, remove, undo };
}
