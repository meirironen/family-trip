import { MAP_URL } from "../trip.ts";
import { isHttpUrl } from '../lib/state.ts';
import type { SyncStatus } from '../lib/useTripState.ts';

const STATUS_TEXT: Record<SyncStatus, string> = {
  loading: 'טוען…',
  synced: 'מסונכרן',
  saving: 'שומר…',
  local: 'מקומי בלבד',
  error: 'שגיאת שמירה',
};

interface Props {
  status: SyncStatus;
  filtering: boolean;
  /** Desktop only: how many places are still unassigned, and the rail toggle. */
  poolCount: number;
  poolOpen: boolean;
  onTogglePool: () => void;
  onOpenMenu: () => void;
  onAddPlace: () => void;
  onManageAreas: () => void;
  canInstall: boolean;
  onInstall: () => void;
}

export default function Header({
  status,
  filtering,
  poolCount,
  poolOpen,
  onTogglePool,
  onOpenMenu,
  onAddPlace,
  onManageAreas,
  canInstall,
  onInstall,
}: Props) {
  return (
    <header className="topbar">
      <button
        type="button"
        className={`topbar__menu${filtering ? ' topbar__menu--active' : ''}`}
        aria-label="תפריט"
        onClick={onOpenMenu}
      >
        <span aria-hidden="true">☰</span>
      </button>

      <div className="topbar__brand">
        <h1>מסלול הטיול</h1>
        <p>
          <span className="sync__dot" data-status={status} aria-hidden="true" />
          {STATUS_TEXT[status]}
        </p>
      </div>

      {/* Desktop shortcuts; on mobile these live in the menu sheet. */}
      <div className="topbar__actions">
        <button
          type="button"
          className={`btn btn--pool${poolOpen ? ' btn--pool-open' : ''}`}
          aria-expanded={poolOpen}
          onClick={onTogglePool}
        >
          טרם שובצו <span className="btn__count">{poolCount}</span>
        </button>
        {isHttpUrl(MAP_URL) && (
          <a className="btn" href={MAP_URL} target="_blank" rel="noopener noreferrer">
            🗺 המפה שלנו
          </a>
        )}
        <button type="button" className="btn" onClick={onManageAreas}>
          אזורים
        </button>
        <button type="button" className="btn" onClick={onAddPlace}>
          ＋ מקום
        </button>
        {canInstall && (
          <button type="button" className="btn btn--primary" onClick={onInstall}>
            התקנה
          </button>
        )}
      </div>
    </header>
  );
}

