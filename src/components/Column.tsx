import PlaceCard from './PlaceCard.tsx';
import { resolvePlace, routeUrl, type TripState } from '../lib/state.ts';
import type { DragState, DropTarget } from '../lib/useDragDrop.ts';
import { POOL, type Area, type AreaId, type ColumnDef, type ColumnId, type PlaceId } from '../trip.ts';

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
            {column.note ? `${column.note} · ` : ''}
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
