import { useCallback, useEffect, useMemo, useState } from 'react';
import DayRoute from './components/DayRoute.tsx';
import Header from './components/Header.tsx';
import Column from './components/Column.tsx';
import DayTabs from './components/DayTabs.tsx';
import MenuSheet, { type FilterState } from './components/MenuSheet.tsx';
import AreaManager from './components/AreaManager.tsx';
import PlaceEditor from './components/PlaceEditor.tsx';
import {
  COLUMNS,
  DAYS,
  POOL,
  TYPES,
  type ColumnDef,
  type ColumnId,
  type PlaceId,
} from './trip.ts';
import {
  addArea,
  addPlace,
  areaOf,
  columnOf,
  movePlace,
  newPlace,
  removeArea,
  removePlace,
  resolvePlace,
  setDayArea,
  setDayHotel,
  setDayNote,
  toggleDone,
  updateArea,
  updateMeta,
  type TripState,
} from './lib/state.ts';
import { useTripState } from './lib/useTripState.ts';
import { useDragDrop, type DragState } from './lib/useDragDrop.ts';
import { MOBILE_QUERY, useMediaQuery } from './lib/useMediaQuery.ts';

const COLLAPSE_KEY = 'family-trip:collapsed';
const POOL_OPEN_KEY = 'family-trip:pool-open';

type Overlay = 'menu' | 'areas' | null;

/** The event Chrome fires when the app is installable. Not in lib.dom yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function App() {
  const { state, status, update } = useTripState();
  const isMobile = useMediaQuery(MOBILE_QUERY);

  const [routeDay, setRouteDay] = useState<ColumnId | null>(null);
  const [editing, setEditing] = useState<PlaceId | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [filter, setFilter] = useState<FilterState>({ area: null, type: null });
  const [activeCol, setActiveCol] = useState<ColumnId>(DAYS[0].id);
  const [overview, setOverview] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => readJson(COLLAPSE_KEY, {}));
  // desktop: the unassigned rail is closed until you ask for it
  const [poolOpen, setPoolOpen] = useState<boolean>(() => readJson(POOL_OPEN_KEY, true));
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const today = useMemo(() => DAYS.find((d) => d.date === isoToday())?.id ?? null, []);

  // open on today's column during the trip
  useEffect(() => {
    if (today) setActiveCol(today);
  }, [today]);

  // While a filter is on the board shows a subset, so a drop index taken from
  // the rendered list wouldn't match the real one — append to the column instead.
  const filtering = filter.area !== null || filter.type !== null;
  const onDrop = useCallback(
    (id: PlaceId, col: ColumnId, index: number) =>
      update((s) => movePlace(s, id, col, filtering || (col === POOL && search.trim() !== '') ? null : index)),
    [update, filtering, search]
  );

  const { dragging, target, justDragged } = useDragDrop(onDrop);

  const toggleCollapse = (id: ColumnId) =>
    setCollapsed((c) => {
      const next = { ...c, [id]: !c[id] };
      writeJson(COLLAPSE_KEY, next);
      return next;
    });

  const togglePool = () =>
    setPoolOpen((open) => {
      writeJson(POOL_OPEN_KEY, !open);
      return !open;
    });

  const openEditor = (id: PlaceId) => {
    if (justDragged()) return;
    setEditing(id);
  };

  const startNewPlace = () => {
    const place = newPlace();
    update((s) => { const next = addPlace(s, place); return activeCol === POOL ? next : movePlace(next, place.id, activeCol); });
    setOverlay(null);
    setEditing(place.id);
  };

  const install = () => {
    void (async () => {
      if (!installEvent) return;
      await installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
      setOverlay(null);
    })();
  };

  if (!state) return <p className="loading">טוען…</p>;

  const shown = applyFilter(state, filter);
  const editingPlace = editing === null ? null : resolvePlace(state, editing);

  const poolColumn = COLUMNS.find((c) => c.id === POOL) as ColumnDef;
  const dayColumns = COLUMNS.filter((c) => c.id !== POOL);
  // The itinerary is primary; overview shows every day together.
  const boardColumns = overview ? dayColumns : COLUMNS.filter((c) => c.id === activeCol);
  const saved = { ...shown, order: { ...shown.order, [POOL]: shown.order[POOL].filter((id) => {
    const p = resolvePlace(state, id);
    return p && `${p.he} ${p.orig ?? ''} ${p.notes ?? ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase());
  }) } };

  const columnProps = {
    state: shown,
    areas: state.areas,
    dragging,
    target,
    onOpen: openEditor,
    onRoute: setRouteDay,
    onMove: (id: PlaceId, col: ColumnId) => update((s) => movePlace(s, id, col)),
    onToggleCollapse: toggleCollapse,
    onToggleDone: (id: PlaceId) => update((s) => toggleDone(s, id)),
    onSetDayArea: (day: ColumnId, area: string | null) => update((s) => setDayArea(s, day, area)),
    onSetDayNote: (day: ColumnId, note: string) => update((s) => setDayNote(s, day, note)),
    onSetDayHotel: (day: ColumnId, id: PlaceId | null) => update((s) => setDayHotel(s, day, id)),
  };

  return (
    <>
      <Header
        status={status}
        filtering={filtering}
        poolCount={state.order[POOL].length}
        poolOpen={poolOpen}
        onTogglePool={togglePool}
        onOpenMenu={() => setOverlay('menu')}
        onAddPlace={startNewPlace}
        onManageAreas={() => setOverlay('areas')}
        canInstall={installEvent !== null}
        onInstall={install}
      />

      <div className="trip-navigation">
        <DayTabs state={state} active={overview ? null : activeCol} today={today} onSelect={(id) => { setActiveCol(id); setOverview(false); }} />
        <button className={`btn${overview ? ' btn--primary' : ''}`} aria-pressed={overview} onClick={() => setOverview((v) => !v)}>מבט על הטיול</button>
      </div>
      <div className="view-heading"><div><p className="eyebrow">צפון איטליה · 22–30 בספטמבר</p><h2>{overview ? 'כל הטיול, במקום אחד' : activeCol === POOL ? 'רעיונות לטיול' : 'היום שלכם, בקצב שלכם'}</h2></div>
        <button className="btn" onClick={() => { setActiveCol(POOL); setOverview(false); }}>מקומות שמורים · {state.order[POOL].length}</button>
      </div>

      <div className={`workspace${!overview ? ' workspace--focused' : ''}`}>
        {!isMobile && poolOpen && activeCol !== POOL && (
          <aside className="pool-rail">
            <div className="saved-panel">
              <h2>מקומות שמורים</h2><p>רעיונות שמחכים ליום המתאים</p>
              <input className="saved-search" aria-label="חיפוש במקומות שמורים" placeholder="חיפוש מקום…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button className="btn" onClick={() => setOverlay('menu')}>סינון לפי אזור וסוג</button>
              <Column {...columnProps} state={saved} column={poolColumn} isToday={false} collapsed={false} addToDay={!overview ? activeCol : undefined} />
            </div>
          </aside>
        )}

        <main className={`board${!overview ? ' board--focused' : ''}`}>
          {!overview && activeCol === POOL && <div className="saved-toolbar"><input className="saved-search" aria-label="חיפוש במקומות שמורים" placeholder="חיפוש מקום…" value={search} onChange={(e) => setSearch(e.target.value)} /><button className="btn" onClick={() => setOverlay('menu')}>סינון לפי אזור וסוג</button></div>}
          {boardColumns.map((column) => (
            <Column
              {...columnProps}
              state={column.id === POOL ? saved : shown}
              key={column.id}
              column={column}
              isToday={column.id === today}
              collapsed={overview && collapsed[column.id] === true}
              focused={!overview}
              onAddPlace={startNewPlace}
              dayArea={state.dayAreas[column.id]}
            />
          ))}
        </main>
      </div>

      {isMobile && (
        <button type="button" className="fab" aria-label="הוספת מקום" onClick={startNewPlace}>
          ＋
        </button>
      )}

      {dragging && <DragGhost state={state} drag={dragging} />}

      {routeDay && <DayRoute state={state} column={COLUMNS.find((c) => c.id === routeDay)!} onClose={() => setRouteDay(null)} />}

      {overlay === 'menu' && (
        <MenuSheet
          state={state}
          status={status}
          filter={filter}
          onFilter={setFilter}
          onAddPlace={startNewPlace}
          onManageAreas={() => setOverlay('areas')}
          canInstall={installEvent !== null}
          onInstall={install}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === 'areas' && (
        <AreaManager
          state={state}
          onAdd={(he, color) => update((s) => addArea(s, he, color))}
          onUpdate={(id, he, color) => update((s) => updateArea(s, id, { he, color }))}
          onRemove={(id) => {
            update((s) => removeArea(s, id));
            setFilter((f) => (f.area === id ? { ...f, area: null } : f));
          }}
          onClose={() => setOverlay(null)}
        />
      )}

      {editingPlace && (
        <PlaceEditor
          place={editingPlace}
          areas={state.areas}
          column={columnOf(state, editingPlace.id)}
          onSave={(id, patch) => update((s) => updateMeta(s, id, patch))}
          onMove={(id, col) => {
            update((s) => movePlace(s, id, col));
            setActiveCol(col);
          }}
          onRemove={(id) => update((s) => removePlace(s, id))}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

/** The card that follows the pointer while dragging. */
function DragGhost({ state, drag }: { state: TripState; drag: DragState }) {
  const place = resolvePlace(state, drag.id);
  if (!place) return null;

  return (
    <div
      className="drag-ghost"
      style={{
        left: drag.x - drag.dx,
        top: drag.y - drag.dy,
        width: drag.width,
        borderInlineStartColor: areaOf(state, place).color,
      }}
      aria-hidden="true"
    >
      {TYPES[place.type].icon} {place.he}
    </div>
  );
}

/** Hides places that don't match the active filter, without changing the data. */
function applyFilter(state: TripState, filter: FilterState): TripState {
  if (filter.area === null && filter.type === null) return state;

  const order = {} as TripState['order'];
  for (const column of COLUMNS) {
    order[column.id] = (state.order[column.id] ?? []).filter((id) => {
      const p = resolvePlace(state, id);
      if (!p) return false;
      if (filter.area !== null && p.area !== filter.area) return false;
      if (filter.type !== null && p.type !== filter.type) return false;
      return true;
    });
  }
  return { ...state, order };
}

function isoToday(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

