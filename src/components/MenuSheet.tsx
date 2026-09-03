import { useEffect, type ReactNode } from 'react';
import { MAP_URL, TYPES, type AreaId, type TypeKey } from '../trip.ts';
import { isHttpUrl, type TripState } from '../lib/state.ts';
import type { SyncStatus } from '../lib/useTripState.ts';
import { useAppVersion } from '../lib/useAppVersion.ts';

const STATUS_TEXT: Record<SyncStatus, string> = {
  loading: 'טוען…',
  synced: 'הכול מסונכרן',
  saving: 'שומר…',
  local: 'מקומי בלבד — אין שרת',
  error: 'שגיאת שמירה',
};

export interface FilterState {
  area: AreaId | null;
  type: TypeKey | null;
}

interface Props {
  state: TripState;
  status: SyncStatus;
  filter: FilterState;
  onFilter: (next: FilterState) => void;
  onAddPlace: () => void;
  onManageAreas: () => void;
  canInstall: boolean;
  onInstall: () => void;
  onClose: () => void;
}

/** Full-screen menu. Everything that isn't the board lives in here on mobile. */
export default function MenuSheet({
  state,
  status,
  filter,
  onFilter,
  onAddPlace,
  onManageAreas,
  canInstall,
  onInstall,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const total = Object.values(state.order).flat().length;
  const done = Object.keys(state.done).length;
  const version = useAppVersion();

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="sheet" role="dialog" aria-label="תפריט">
        <header className="sheet__head">
          <h2>תפריט</h2>
          <button type="button" className="sheet__close" aria-label="סגירה" onClick={onClose}>
            ✕
          </button>
        </header>

        <p className={`sync sync--${status}`}>
          <span className="sync__dot" aria-hidden="true" />
          {STATUS_TEXT[status]}
        </p>

        <p className="sheet__stat">
          {total} מקומות · {done} בוצעו
        </p>

        <section className="sheet__group">
          {isHttpUrl(MAP_URL) && (
            <a className="sheet__item" href={MAP_URL} target="_blank" rel="noopener noreferrer">
              🗺 המפה שלנו ב-Google Maps
            </a>
          )}
          <button type="button" className="sheet__item" onClick={onAddPlace}>
            ＋ הוספת מקום
          </button>
          <button type="button" className="sheet__item" onClick={onManageAreas}>
            🎨 ניהול אזורים
          </button>
          {canInstall && (
            <button type="button" className="sheet__item" onClick={onInstall}>
              ⬇ התקנת האפליקציה
            </button>
          )}
          <button type="button" className="sheet__item" onClick={() => window.print()}>
            🖨 הדפסה
          </button>
        </section>

        <section className="sheet__group">
          <h3 className="sheet__label">אזור</h3>
          <div className="sheet__chips">
            <Chip on={filter.area === null} onClick={() => onFilter({ ...filter, area: null })}>
              הכל
            </Chip>
            {Object.entries(state.areas).map(([id, area]) => (
              <Chip
                key={id}
                on={filter.area === id}
                color={area.color}
                onClick={() => onFilter({ ...filter, area: filter.area === id ? null : id })}
              >
                {area.he}
              </Chip>
            ))}
          </div>
        </section>

        <section className="sheet__group">
          <h3 className="sheet__label">סוג</h3>
          <div className="sheet__chips">
            <Chip on={filter.type === null} onClick={() => onFilter({ ...filter, type: null })}>
              הכל
            </Chip>
            {(Object.keys(TYPES) as TypeKey[]).map((key) => (
              <Chip
                key={key}
                on={filter.type === key}
                onClick={() => onFilter({ ...filter, type: filter.type === key ? null : key })}
              >
                {TYPES[key].icon} {TYPES[key].he}
              </Chip>
            ))}
          </div>
        </section>

        <footer className="sheet__version">
          <p>
            גרסה <code>{version.build}</code>
          </p>
          <p>
            {version.worker === 'active' && 'עובד גם ללא רשת ✓'}
            {version.worker === 'none' && 'ללא מצב אופליין (פיתוח או טעינה ראשונה)'}
            {version.worker === 'unsupported' && 'הדפדפן לא תומך באופליין'}
            {version.worker === 'update-ready' && 'קיימת גרסה חדשה'}
          </p>
          {version.worker === 'update-ready' && (
            <button type="button" className="btn btn--primary" onClick={version.applyUpdate}>
              עדכון עכשיו
            </button>
          )}
        </footer>
      </aside>
    </>
  );
}

function Chip({
  on,
  color,
  onClick,
  children,
}: {
  on: boolean;
  color?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`chip${on ? ' chip--on' : ''}`}
      aria-pressed={on}
      onClick={onClick}
    >
      {color && <span className="chip__dot" style={{ background: color }} aria-hidden="true" />}
      {children}
    </button>
  );
}
