import type { TripState } from '../lib/state.ts';
import { COLUMNS, type ColumnId, type DayId } from '../trip.ts';

interface Props {
  state: TripState;
  active: ColumnId | null;
  today: DayId | null;
  onSelect: (id: ColumnId) => void;
}

/**
 * Mobile day switcher. One day at a time reads far better on a phone than
 * ten stacked columns, and the strip keeps the whole trip one tap away.
 */
export default function DayTabs({ state, active, today, onSelect }: Props) {
  return (
    <nav className="daytabs" aria-label="ימי הטיול">
      {COLUMNS.map((column) => {
        const ids = state.order[column.id] ?? [];
        const done = ids.filter((id) => state.done[id]).length;
        const isActive = column.id === active;

        return (
          <button
            key={column.id}
            type="button"
            className={`daytab${isActive ? ' daytab--on' : ''}${column.id === today ? ' daytab--today' : ''}`}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onSelect(column.id)}
          >
            <span className="daytab__label">{column.title}</span>
            <span className="daytab__sub">
              {column.dow ?? 'הכל'}
              {ids.length > 0 && ` · ${done}/${ids.length}`}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
