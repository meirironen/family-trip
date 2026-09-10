import { useEffect, useRef, useState, type ReactNode } from 'react';
import { resolvePlace, type TripState } from '../lib/state.ts';
import { POOL, type PlaceId } from '../trip.ts';
import PlaceCard from './PlaceCard.tsx';

interface Props {
  state: TripState;
  editing: boolean;
  onOpen: (id: PlaceId) => void;
  onToggleDone: (id: PlaceId) => void;
  onClose: () => void;
  onImport: () => void;
  children: ReactNode;
}

export default function PoolModal({ state, editing, onOpen, onToggleDone, onClose, onImport, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [section, setSection] = useState<'all' | 'attractions' | 'food' | 'other'>('all');
  const [query, setQuery] = useState('');
  const ids = state.order[POOL];
  const groupOf = (id: PlaceId) => {
    const type = resolvePlace(state, id)?.type;
    return type === 'food' ? 'food' : type === 'attraction' || type === 'hike' ? 'attractions' : 'other';
  };
  const visible = ids.filter((id) => {
    const place = resolvePlace(state, id);
    return (section === 'all' || groupOf(id) === section) &&
      `${place?.he ?? ''} ${place?.orig ?? ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim());
  });

  useEffect(() => {
    const element = dialog.current!;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, []);

  useEffect(() => {
    if (editing) dialog.current?.querySelector<HTMLSelectElement>('.drawer select')?.focus();
    else closeButton.current?.focus();
  }, [editing]);

  return (
    <dialog
      ref={dialog}
      id="pool-modal"
      className="pool-modal"
      aria-labelledby="pool-title"
      onCancel={(event) => {
        event.preventDefault();
        // The editor handles Escape itself; keep the list open underneath it.
        if (!editing) onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || editing) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
    >
      <div className="pool-modal__content" hidden={editing}>
        <header className="pool-modal__head">
          <div>
            <h2 id="pool-title">טרם שובצו <span className="btn__count">{ids.length}</span></h2>
            <p>בחרו מקום לעריכה או לשיבוץ ליום</p>
          </div>
          <button ref={closeButton} type="button" className="btn" aria-label="סגירת טרם שובצו" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="pool-controls">
          <div className="pool-sections" aria-label="סוגי מקומות">
            {([['all', 'הכל'], ['attractions', '◎ אטרקציות'], ['food', '🍽 אוכל'], ['other', 'אחר']] as const).map(([key, label]) => (
              <button key={key} type="button" className={`chip${section === key ? ' chip--on' : ''}`}
                aria-pressed={section === key} onClick={() => setSection(key)}>
                {label} <span>{key === 'all' ? ids.length : ids.filter((id) => groupOf(id) === key).length}</span>
              </button>
            ))}
          </div>
          <div className="pool-search">
            <input type="search" aria-label="חיפוש מקום" placeholder="חיפוש מקום…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="button" className="btn" onClick={onImport}>⇧ ייבוא מקומות</button>
          </div>
        </div>
        <div className="pool-modal__list" tabIndex={0} aria-label="מקומות שטרם שובצו">
          {visible.length === 0 && <p className="column__empty">אין מקומות להצגה ברשימה</p>}
          {visible.map((id) => {
            const place = resolvePlace(state, id);
            if (!place) return null;
            return (
              <div key={id} className="pool-modal__item">
                <PlaceCard
                  place={place}
                  areas={state.areas}
                  done={state.done[id] === true}
                  dragging={false}
                  draggable={false}
                  onOpen={onOpen}
                  onToggleDone={onToggleDone}
                />
              </div>
            );
          })}
        </div>
      </div>
      {children}
    </dialog>
  );
}
