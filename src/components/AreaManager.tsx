import { useEffect, useState } from 'react';
import { AREA_COLORS, type AreaId } from '../trip.ts';
import { countInArea, type TripState } from '../lib/state.ts';

interface Props {
  state: TripState;
  onAdd: (he: string, color: string) => void;
  onUpdate: (id: AreaId, he: string, color: string) => void;
  onRemove: (id: AreaId) => void;
  onClose: () => void;
}

export default function AreaManager({ state, onAdd, onUpdate, onRemove, onClose }: Props) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(AREA_COLORS[0]);
  const [confirming, setConfirming] = useState<AreaId | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ids = Object.keys(state.areas);
  const isLast = ids.length <= 1;

  const submit = () => {
    if (newName.trim() === '') return;
    onAdd(newName, newColor);
    setNewName('');
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="sheet" role="dialog" aria-label="ניהול אזורים">
        <header className="sheet__head">
          <h2>אזורים</h2>
          <button type="button" className="sheet__close" aria-label="סגירה" onClick={onClose}>
            ✕
          </button>
        </header>

        <ul className="arealist">
          {ids.map((id) => {
            const area = state.areas[id];
            const count = countInArea(state, id);

            return (
              <li className="arearow" key={id}>
                <input
                  type="color"
                  className="arearow__color"
                  value={area.color}
                  aria-label={`צבע של ${area.he}`}
                  onChange={(e) => onUpdate(id, area.he, e.target.value)}
                />
                <input
                  type="text"
                  className="arearow__name"
                  value={area.he}
                  aria-label={`שם האזור ${area.he}`}
                  onChange={(e) => onUpdate(id, e.target.value, area.color)}
                />
                <span className="arearow__count">{count}</span>

                {confirming === id ? (
                  <span className="arearow__confirm">
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() => {
                        onRemove(id);
                        setConfirming(null);
                      }}
                    >
                      מחיקה
                    </button>
                    <button type="button" className="btn" onClick={() => setConfirming(null)}>
                      ביטול
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="arearow__delete"
                    aria-label={`מחיקת ${area.he}`}
                    disabled={isLast}
                    title={isLast ? 'חייב להישאר אזור אחד לפחות' : undefined}
                    onClick={() => setConfirming(id)}
                  >
                    ✕
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {confirming !== null && (
          <p className="sheet__note">
            {countInArea(state, confirming)} מקומות באזור הזה יעברו לאזור אחר. אף מקום לא נמחק.
          </p>
        )}

        <section className="sheet__group">
          <h3 className="sheet__label">אזור חדש</h3>

          <div className="areaadd">
            <input
              type="text"
              value={newName}
              placeholder="שם האזור"
              aria-label="שם האזור החדש"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <button type="button" className="btn btn--primary" disabled={newName.trim() === ''} onClick={submit}>
              הוספה
            </button>
          </div>

          <div className="swatches">
            {AREA_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`swatch${newColor === color ? ' swatch--on' : ''}`}
                style={{ background: color }}
                aria-label={`צבע ${color}`}
                aria-pressed={newColor === color}
                onClick={() => setNewColor(color)}
              />
            ))}
          </div>
        </section>
      </aside>
    </>
  );
}
