import { useEffect, useState } from 'react';
import { MAX_DRIVING_MINUTES, validDrivingMinutes } from '../lib/driving.ts';

export default function DrivingTime({ minutes, from, to, mapsUrl, onSave }: {
  mapsUrl: string; minutes: number | null; from: string; to: string; onSave: (minutes: number | null) => void;
}) {
  const [draft, setDraft] = useState(minutes === null ? '' : String(minutes));
  const [error, setError] = useState(false);
  useEffect(() => {
    setDraft(minutes === null ? '' : String(minutes));
    setError(false);
  }, [minutes]);
  const commit = () => {
    const next = draft.trim() === '' ? null : Number(draft);
    if (next !== null && !validDrivingMinutes(next)) { setError(true); return; }
    setError(false);
    if (next !== minutes) onSave(next);
  };
  return (
    <div className="driving-time">
      <div className="driving-time__controls">
      <label>
        <span aria-hidden="true">🚗 </span>זמן נסיעה
        <input
          type="number" inputMode="numeric" min={0} max={MAX_DRIVING_MINUTES} step={1}
          aria-label={`זמן נסיעה מ${from} אל ${to}, בדקות`}
          aria-invalid={error} placeholder="—" value={draft}
          onChange={(e) => { setDraft(e.target.value); setError(false); }}
          onBlur={(e) => {
            if (e.currentTarget.validity.badInput) setError(true);
            else commit();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              e.preventDefault();
              setDraft(minutes === null ? '' : String(minutes));
              setError(false);
            }
          }}
        />
        <span>דק׳</span>
      </label>
      <a className="btn driving-time__map" href={mapsUrl} target="_blank" rel="noopener noreferrer"
        aria-label={`פתיחת מסלול נסיעה מ${from} אל ${to} ב-Google Maps`}>
        🗺 Google Maps ↗
      </a>
      </div>
      {error && <span role="alert">הזינו דקות שלמות בין 0 ל־1440</span>}
    </div>
  );
}
