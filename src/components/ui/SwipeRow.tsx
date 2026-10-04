import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SwipeAction {
  label: string;
  icon: React.ReactNode;
  className: string;
  onClick: () => void;
}

interface SwipeRowProps {
  actions: SwipeAction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

const ACTION_WIDTH = 76;
const DECIDE_THRESHOLD = 8;

// Fila que se desliza hacia la izquierda para mostrar acciones (estilo iOS).
// El scroll vertical sigue funcionando: solo se toma el gesto si es claramente horizontal.
export function SwipeRow({ actions, open, onOpenChange, children, className }: SwipeRowProps) {
  const maxOffset = actions.length * ACTION_WIDTH;
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const gesture = useRef<{ x: number; y: number; mode: 'pending' | 'swipe' | 'scroll' } | null>(null);
  const suppressClick = useRef(false);

  const baseOffset = open ? -maxOffset : 0;
  const offset = dragOffset ?? baseOffset;

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    gesture.current = { x: e.clientX, y: e.clientY, mode: 'pending' };
    suppressClick.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (g.mode === 'pending') {
      if (Math.abs(dx) > DECIDE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        g.mode = 'swipe';
        suppressClick.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } else if (Math.abs(dy) > DECIDE_THRESHOLD) {
        g.mode = 'scroll';
      }
    }
    if (g.mode === 'swipe') {
      setDragOffset(Math.min(0, Math.max(-maxOffset, baseOffset + dx)));
    }
  };

  const endGesture = () => {
    if (gesture.current?.mode === 'swipe' && dragOffset !== null) {
      onOpenChange(dragOffset < -maxOffset / 2);
    }
    gesture.current = null;
    setDragOffset(null);
  };

  // Un toque que termina un deslizamiento, o que cierra la fila abierta, no llega al contenido
  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current || open) {
      e.stopPropagation();
      e.preventDefault();
      suppressClick.current = false;
      if (open) onOpenChange(false);
    }
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className={cn('absolute inset-y-0 right-0 flex', offset === 0 && 'invisible')} aria-hidden={!open}>
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={() => {
              onOpenChange(false);
              action.onClick();
            }}
            className={cn('flex flex-col items-center justify-center gap-1 text-white text-xs font-semibold', action.className)}
            style={{ width: ACTION_WIDTH }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        onClickCapture={onClickCapture}
        className={cn(
          'relative bg-white touch-pan-y select-none',
          dragOffset === null && 'motion-safe:transition-transform motion-safe:duration-200'
        )}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
