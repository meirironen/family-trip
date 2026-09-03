import { useCallback, useEffect, useRef, useState } from 'react';
import type { ColumnId, PlaceId } from '../trip.ts';

const MOVE_THRESHOLD = 5; // px before a mouse press becomes a drag
const HOLD_MS = 190; // long-press before a touch becomes a drag, so pages still scroll
const EDGE = 64; // autoscroll margin
const SCROLL_STEP = 14;

export interface DragState {
  id: PlaceId;
  /** Current pointer position. */
  x: number;
  y: number;
  /** Pointer offset inside the card, so the ghost sits under the finger. */
  dx: number;
  dy: number;
  width: number;
}

export interface DropTarget {
  col: ColumnId;
  index: number;
}

export interface DragDrop {
  dragging: DragState | null;
  target: DropTarget | null;
  /** True right after a drag, so a card's click handler can be skipped. */
  justDragged: () => boolean;
}

type Armed = { id: PlaceId; x: number; y: number; rect: DOMRect };

/**
 * Drag-and-drop for the board, without a library.
 *
 * Mouse: press and move. Touch: long-press, so ordinary swipes still scroll.
 * While dragging we never restructure the DOM — we report the hovered
 * {col, index} and let React render a drop indicator. The move is committed
 * once, on release.
 *
 * Cards must carry `data-place="<id>"`; each column's list `data-col="<id>"`.
 */
export function useDragDrop(onDrop: (id: PlaceId, col: ColumnId, index: number) => void): DragDrop {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);

  const armed = useRef<Armed | null>(null);
  const holdTimer = useRef<number | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const targetRef = useRef<DropTarget | null>(null);
  const moved = useRef(false);

  dragRef.current = drag;
  targetRef.current = target;

  const clearArmed = useCallback(() => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    armed.current = null;
  }, []);

  const begin = useCallback((a: Armed) => {
    moved.current = true;
    setDrag({ id: a.id, x: a.x, y: a.y, dx: a.x - a.rect.left, dy: a.y - a.rect.top, width: a.rect.width });
  }, []);

  const track = useCallback((x: number, y: number) => {
    setDrag((d) => (d ? { ...d, x, y } : d));
    setTarget(hitTest(x, y, dragRef.current?.id));
    autoscroll(x, y);
  }, []);

  const finish = useCallback(() => {
    clearArmed();
    const d = dragRef.current;
    const t = targetRef.current;
    setDrag(null);
    setTarget(null);
    if (d && t) onDrop(d.id, t.col, t.index);
  }, [clearArmed, onDrop]);

  // ---- mouse ----
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const card = cardFrom(e.target);
      if (!card) return;
      armed.current = { id: card.dataset.place!, x: e.clientX, y: e.clientY, rect: card.getBoundingClientRect() };
      moved.current = false;
    };

    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        e.preventDefault();
        track(e.clientX, e.clientY);
        return;
      }
      const a = armed.current;
      if (a && Math.hypot(e.clientX - a.x, e.clientY - a.y) > MOVE_THRESHOLD) begin(a);
    };

    const onUp = () => {
      if (dragRef.current) finish();
      else clearArmed();
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [begin, track, finish, clearArmed]);

  // ---- touch ----
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const card = cardFrom(e.target);
      if (!card) return;

      const t = e.touches[0];
      const info: Armed = { id: card.dataset.place!, x: t.clientX, y: t.clientY, rect: card.getBoundingClientRect() };
      armed.current = info;
      moved.current = false;

      holdTimer.current = window.setTimeout(() => {
        if (armed.current === info) begin(info);
      }, HOLD_MS);
    };

    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;

      if (dragRef.current) {
        e.preventDefault(); // stop the page scrolling under the card
        track(t.clientX, t.clientY);
        return;
      }
      const a = armed.current;
      if (a && Math.hypot(t.clientX - a.x, t.clientY - a.y) > 10) clearArmed(); // it's a scroll
    };

    const onEnd = () => {
      if (dragRef.current) finish();
      else clearArmed();
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [begin, track, finish, clearArmed]);

  return { dragging: drag, target, justDragged: () => moved.current };
}

/** The card under an event target — unless the press landed on a control. */
function cardFrom(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof Element)) return null;
  if (node.closest('a, button, input, select, textarea')) return null;
  return node.closest<HTMLElement>('[data-place]');
}

/** Which list, and at which index, is under the pointer. */
function hitTest(x: number, y: number, draggedId: PlaceId | undefined): DropTarget | null {
  const el = document.elementFromPoint(x, y);
  const list = el?.closest<HTMLElement>('[data-col]');
  if (!list?.dataset.col) return null;

  const cards = [...list.querySelectorAll<HTMLElement>('[data-place]')].filter(
    (c) => c.dataset.place !== draggedId
  );

  let index = cards.length;
  for (let i = 0; i < cards.length; i += 1) {
    const r = cards[i].getBoundingClientRect();
    if (y < r.top + r.height / 2) {
      index = i;
      break;
    }
  }
  return { col: list.dataset.col as ColumnId, index };
}

function autoscroll(x: number, y: number): void {
  if (y < EDGE) window.scrollBy(0, -SCROLL_STEP);
  else if (y > window.innerHeight - EDGE) window.scrollBy(0, SCROLL_STEP);

  const list = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-col]');
  if (list && list.scrollHeight > list.clientHeight + 4) {
    const r = list.getBoundingClientRect();
    if (y < r.top + 34) list.scrollTop -= SCROLL_STEP;
    else if (y > r.bottom - 34) list.scrollTop += SCROLL_STEP;
  }
}
