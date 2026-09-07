import { useEffect, useState } from 'react';
import { COLUMNS, TYPES, type Area, type AreaId, type ColumnId, type Place, type PlaceId } from '../trip.ts';
import { isHttpUrl, isTypeKey, mapsUrl } from '../lib/state.ts';

/** Every field is edited as a string; typed keys are validated on save. */
type Draft = Record<FieldKey, string>;
type FieldKey = 'he' | 'orig' | 'type' | 'area' | 'dur' | 'maps' | 'site' | 'notes';

interface Field {
  key: FieldKey;
  label: string;
  kind: 'text' | 'select' | 'textarea' | 'area';
  ltr?: boolean;
  options?: Record<string, { he: string }>;
}

const FIELDS: readonly Field[] = [
  { key: 'he', label: 'שם', kind: 'text' },
  { key: 'orig', label: 'שם באנגלית (משמש לחיפוש במפות)', kind: 'text', ltr: true },
  { key: 'type', label: 'סוג', kind: 'select', options: TYPES },
  { key: 'area', label: 'אזור', kind: 'area' },
  { key: 'dur', label: 'משך משוער', kind: 'text' },
  { key: 'maps', label: 'קישור Google Maps', kind: 'text', ltr: true },
  { key: 'site', label: 'אתר', kind: 'text', ltr: true },
  { key: 'notes', label: 'הערות', kind: 'textarea' },
];

interface Props {
  place: Place;
  areas: Record<AreaId, Area>;
  column: ColumnId | null;
  onSave: (id: PlaceId, patch: Partial<Place>) => void;
  onMove: (id: PlaceId, col: ColumnId) => void;
  onRemove: (id: PlaceId) => void;
  onClose: () => void;
}

export default function PlaceEditor({ place, areas, column, onSave, onMove, onRemove, onClose }: Props) {
  const [draft, setDraft] = useState<Draft>(
    () => Object.fromEntries(FIELDS.map((f) => [f.key, place[f.key] ?? ''])) as Draft
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key: FieldKey, value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const urlLooksWrong = (key: 'maps' | 'site') =>
    draft[key].trim() !== '' && !isHttpUrl(draft[key].trim());

  const save = () => {
    const patch: Partial<Place> = {
      he: draft.he.trim() || place.he,
      orig: draft.orig.trim(),
      dur: draft.dur.trim(),
      notes: draft.notes.trim(),
      // links are dropped unless they're real http(s) URLs
      maps: isHttpUrl(draft.maps.trim()) ? draft.maps.trim() : '',
      site: isHttpUrl(draft.site.trim()) ? draft.site.trim() : '',
    };
    if (isTypeKey(draft.type)) patch.type = draft.type;
    if (draft.area in areas) patch.area = draft.area;

    onSave(place.id, patch);
    onClose();
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={`עריכת ${place.he}`}>
        <h2 className="drawer__title">{place.he}</h2>
        {place.orig && <p className="drawer__orig">{place.orig}</p>}

        <div className="field">
          <label htmlFor="assign">שיבוץ ליום</label>
          <select
            id="assign"
            value={column ?? 'pool'}
            onChange={(e) => {
              onMove(place.id, e.target.value as ColumnId);
              onClose();
            }}
          >
            {COLUMNS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.dow ? `${c.title} · ${c.dow}${c.note ? ` — ${c.note}` : ''}` : c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="drawer__links">
          <a href={mapsUrl(place)} target="_blank" rel="noopener noreferrer">
            🗺 פתח ב-Google Maps
          </a>
          {isHttpUrl(place.site) && (
            <a href={place.site} target="_blank" rel="noopener noreferrer">
              🔗 אתר
            </a>
          )}
        </div>

        {FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label htmlFor={`f-${f.key}`}>{f.label}</label>

            {f.kind === 'area' ? (
              <select id={`f-${f.key}`} value={draft[f.key]} onChange={(e) => set(f.key, e.target.value)}>
                {Object.entries(areas).map(([id, area]) => (
                  <option key={id} value={id}>
                    {area.he}
                  </option>
                ))}
              </select>
            ) : f.kind === 'select' && f.options ? (
              <select id={`f-${f.key}`} value={draft[f.key]} onChange={(e) => set(f.key, e.target.value)}>
                {Object.entries(f.options).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.he}
                  </option>
                ))}
              </select>
            ) : f.kind === 'textarea' ? (
              <textarea id={`f-${f.key}`} value={draft[f.key]} onChange={(e) => set(f.key, e.target.value)} />
            ) : (
              <input
                id={`f-${f.key}`}
                type="text"
                dir={f.ltr ? 'ltr' : undefined}
                value={draft[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}

            {(f.key === 'maps' || f.key === 'site') && urlLooksWrong(f.key) && (
              <p className="field__hint">כתובת לא תקינה — צריך להתחיל ב-https://</p>
            )}
          </div>
        ))}

        <footer className="drawer__actions">
          <button type="button" className="btn btn--primary" onClick={save}>
            שמירה
          </button>
          <button type="button" className="btn" onClick={onClose}>
            ביטול
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              onRemove(place.id);
              onClose();
            }}
          >
            מחיקה
          </button>
        </footer>
      </aside>
    </>
  );
}
