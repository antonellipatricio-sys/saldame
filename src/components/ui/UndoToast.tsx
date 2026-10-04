import { createPortal } from 'react-dom';

export function UndoToast({ message, onUndo }: { message: string | null; onUndo: () => void }) {
  if (!message) return null;
  return createPortal(
    <div
      role="status"
      className="fixed inset-x-3 z-40 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] md:bottom-6 md:left-auto md:right-6 md:w-96 flex items-center gap-3 rounded-xl bg-slate-800 text-white pl-4 pr-2 py-2 shadow-lg motion-safe:animate-fade-in"
    >
      <span className="flex-1 text-sm truncate">{message}</span>
      <button onClick={onUndo} className="px-3 min-h-[44px] rounded-lg font-semibold text-violet-200 active:bg-white/10">
        Deshacer
      </button>
    </div>,
    document.body
  );
}
