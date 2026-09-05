import { useEffect, useState } from 'react';
import PlaceCard from './PlaceCard.tsx';
import {
  DAY_NOTE_MAX,
  dayNote,
  hotelOf,
  hotels,
  mapsUrl,
  resolvePlace,
  routeUrl,
  type TripState,
} from '../lib/state.ts';
import type { DragState, DropTarget } from '../lib/useDragDrop.ts';
import { POOL, TYPES, type Area, type AreaId, type ColumnDef, type ColumnId, type PlaceId } from '../trip.ts';

interface Props {
  column: ColumnDef;
  state: TripState;
  areas: Record<AreaId, Area>;
  isToday: boolean;
  collapsed: boolean;
  onToggleCollapse: (id: ColumnId) => void;
  dragging: DragState | null;
  target: DropTarget | null;
  onOpen: (id: PlaceId) => void;
  onToggleDone: (id: PlaceId) => void;
  /** Which area this day is based in, and how to change it. */
  dayArea?: AreaId | undefined;
  onSetDayArea?: (day: ColumnId, area: AreaId | null) => void;
  onSetDayNote?: (day: ColumnId, note: string) => void;
  onSetDayHotel?: (day: ColumnId, id: PlaceId | null) => void;
}

export default function Column({
  column,
  state,
  areas,
  isToday,
  collapsed,
  onToggleCollapse,
  dragging,
  target,
  onOpen,
  onToggleDone,
  dayArea,
  onSetDayArea,
  onSetDayNote,
  onSetDayHotel,
}: Props) {
  const ids = state.order[column.id] ?? [];
  const route = routeUrl(state, column.id);
  const doneCount = ids.filter((id) => state.done[id]).length;
  const dropAt = target?.col === column.id ? target.index : null;

  const className = ['column', column.id === POOL && 'column--pool', isToday && 'column--today']
    .filter(Boolean)
    .join(' ');

  const isDay = column.id !== POOL;
  const chosen = dayArea ? areas[dayArea] : undefined;
  const note = isDay ? dayNote(state, column.id) : '';
  const hotel = isDay ? hotelOf(state, column.id) : null;
  const hotelOptions = isDay ? hotels(state) : [];

  return (
    <section className={className}>
      <header className="column__head">
        <button
          type="button"
          className="column__toggle"
          aria-expanded={!collapsed}
          onClick={() => onToggleCollapse(column.id)}
        >
          <h2 className="column__title">
            {column.title}
            {column.dow && <em>{column.dow}</em>}
            {isToday && <span className="badge">היום</span>}
          </h2>
          <p className="column__sub">
            {note ? `${note} · ` : ''}
            {ids.length} מקומות
            {doneCount > 0 && ` · ${doneCount} בוצעו`}
          </p>
        </button>

        {route && (
          <a className="column__route" href={route} target="_blank" rel="noopener noreferrer">
            מסלול נסיעה ↗
          </a>
        )}
      </header>

      {isDay && onSetDayNote && (
        <DayNoteInput
          value={note}
          label={`תיאור ${column.title}`}
          onSave={(next) => onSetDayNote(column.id, next)}
        />
      )}

      {isDay && onSetDayHotel && (
        <div className="column__hotel">
          <span className="column__hotel-icon" aria-hidden="true">
            {TYPES.hotel.icon}
          </span>
          <select
            aria-label={`מלון של ${column.title}`}
            value={hotel?.id ?? ''}
            onChange={(e) => onSetDayHotel(column.id, e.target.value === '' ? null : e.target.value)}
          >
            <option value="">אין מלון</option>
            {hotelOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.he}
              </option>
            ))}
          </select>
          {hotel && (
            <a
              className="column__hotel-link"
              href={mapsUrl(hotel)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${hotel.he} ב-Google Maps`}
            >
              ↗
            </a>
          )}
        </div>
      )}

      {isDay && onSetDayArea && (
        <div className="column__area">
          <span
            className="column__area-dot"
            style={{ background: chosen?.color ?? 'transparent' }}
            aria-hidden="true"
          />
          <select
            aria-label={`אזור של ${column.title}`}
            value={dayArea ?? ''}
            onChange={(e) => onSetDayArea(column.id, e.target.value === '' ? null : e.target.value)}
          >
            <option value="">בחרו אזור ליום</option>
            {Object.entries(areas).map(([id, area]) => (
              <option key={id} value={id}>
                {area.he}
              </option>
            ))}
          </select>
        </div>
      )}

      {!collapsed && (
        <div className="column__list" data-col={column.id}>
          {ids.length === 0 && dropAt === null && <p className="column__empty">גררו לכאן</p>}

          {ids.map((id, i) => {
            const place = resolvePlace(state, id);
            if (!place) return null;
            return (
              <div key={id}>
                {dropAt === i && <div className="drop-line" aria-hidden="true" />}
                <PlaceCard
                  place={place}
                  areas={areas}
                  done={state.done[id] === true}
                  dragging={dragging?.id === id}
                  onOpen={onOpen}
                  onToggleDone={onToggleDone}
                />
              </div>
            );
          })}

          {dropAt !== null && dropAt >= ids.length && <div className="drop-line" aria-hidden="true" />}
        </div>
      )}
    </section>
  );
}

/** Local draft so we don't save on every keystroke. */
function DayNoteInput({
  value,
  label,
  onSave,
}: {
  value: string;
  label: string;
  onSave: (note: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    const next = draft.trim();
    if (next === value) {
      setDraft(value);
      return;
    }
    onSave(next);
  };

  return (
    <div className="column__note">
      <input
        type="text"
        aria-label={label}
        placeholder="תיאור היום"
        maxLength={DAY_NOTE_MAX}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') {
            setDraft(value);
            e.currentTarget.blur();
          }
        }}
      />
    </div>
  );
}

