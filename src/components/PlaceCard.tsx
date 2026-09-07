import type { CSSProperties } from 'react';
import { FALLBACK_COLOR, TYPES, type Area, type AreaId, type Place, type PlaceId } from '../trip.ts';
import { isHttpUrl, mapsUrl } from '../lib/state.ts';

interface Props {
  place: Place;
  areas: Record<AreaId, Area>;
  done: boolean;
  dragging: boolean;
  draggable?: boolean;
  onOpen: (id: PlaceId) => void;
  onToggleDone: (id: PlaceId) => void;
}

export default function PlaceCard({ place, areas, done, dragging, draggable = true, onOpen, onToggleDone }: Props) {
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
          <span aria-hidden="true">{type.icon} </span>
          {place.he}
        </h3>
        <p className="card__meta">
          {[area?.he, place.dur].filter(Boolean).join(' · ')}
          {(area?.he || place.dur) && ' · '}
          <a href={mapsUrl(place)} target="_blank" rel="noopener noreferrer">
            מפה
          </a>
          {isHttpUrl(place.site) && (
            <>
              {' · '}
              <a href={place.site} target="_blank" rel="noopener noreferrer">
                אתר
              </a>
            </>
          )}
        </p>
      </div>
    </article>
  );
}
