import type { CSSProperties } from 'react';
import { COLUMNS, FALLBACK_COLOR, TYPES, type ColumnId, type Area, type AreaId, type Place, type PlaceId } from '../trip.ts';
import { isHttpUrl, mapsUrl } from '../lib/state.ts';

interface Props {
  place: Place;
  areas: Record<AreaId, Area>;
  done: boolean;
  dragging: boolean;
  expanded?: boolean;
  addToDay?: ColumnId;
  onMove?: (id: PlaceId, col: ColumnId) => void;
  draggable?: boolean;
  onOpen: (id: PlaceId) => void;
  onToggleDone: (id: PlaceId) => void;
}

export default function PlaceCard({ place, areas, done, dragging, draggable = true, onOpen, onToggleDone, expanded, addToDay, onMove }: Props) {
  const type = TYPES[place.type];
  // the area may have been deleted by someone else since this place was filed
  const area = areas[place.area];
  const style = { '--accent-bar': area?.color ?? FALLBACK_COLOR } as CSSProperties;

  const className = ['card', done && 'is-done', dragging && 'is-dragging'].filter(Boolean).join(' ');

  return (
    <article className={className} data-place={draggable ? place.id : undefined} style={style}>
      <button
        type="button"
        className="card__check"
        aria-pressed={done}
        aria-label={done ? `סמן ש${place.he} לא בוצע` : `סמן ש${place.he} בוצע`}
        onClick={() => onToggleDone(place.id)}
      >
        {done ? '✓' : ''}
      </button>

      <div className="card__body" onClick={() => onOpen(place.id)}>
        <h3 className="card__title">
          {draggable ? (
            <><span aria-hidden="true">{type.icon} </span>{place.he}</>
          ) : (
            <button type="button" className="card__open" aria-label={`עריכת ${place.he}`}>
              <span aria-hidden="true">{type.icon} </span>
              {place.he}
            </button>
          )}
        </h3>
        <p className="card__meta">
          {[area?.he, place.dur].filter(Boolean).join(' · ')}
          {(area?.he || place.dur) && ' · '}
          <a onClick={(e) => e.stopPropagation()} href={mapsUrl(place)} target="_blank" rel="noopener noreferrer">
            מפה
          </a>
          {isHttpUrl(place.site) && (
            <>
              {' · '}
              <a onClick={(e) => e.stopPropagation()} href={place.site} target="_blank" rel="noopener noreferrer">
                אתר
              </a>
            </>
          )}
        </p>
        {expanded && place.notes && <p className="card__notes">{place.notes}</p>}
        {draggable && <div className="card__tools" onClick={(e) => e.stopPropagation()}>
          <button className="card__edit" onClick={() => onOpen(place.id)}>פרטים ועריכה</button>
          {addToDay && onMove ? <button className="card__edit" onClick={() => onMove(place.id, addToDay)}>＋ הוספה ליום</button> : onMove && <select aria-label={`העברת ${place.he} ליום`} value="" onChange={(e) => { if (e.target.value) onMove(place.id, e.target.value as ColumnId); }}>
            <option value="">העברה ליום…</option>
            {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>}
        </div>}
      </div>
    </article>
  );
}
