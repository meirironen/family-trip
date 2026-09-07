import { useCallback, useEffect, useMemo, useState } from 'react';
import DayRoute from './components/DayRoute.tsx';
import PoolModal from './components/PoolModal.tsx';
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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => readJson(COLLAPSE_KEY, {}));
  const [poolOpen, setPoolOpen] = useState(false);
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
      update((s) => movePlace(s, id, col, filtering ? null : index)),
    [update, filtering]
  );

  const { dragging, target, justDragged } = useDragDrop(onDrop);

  const toggleCollapse = (id: ColumnId) =>
    setCollapsed((c) => {
      const next = { ...c, [id]: !c[id] };
      writeJson(COLLAPSE_KEY, next);
      return next;
    });

  const togglePool = () => setPoolOpen((open) => !open);

  const openEditor = (id: PlaceId) => {
    if (justDragged()) return;
    setEditing(id);
  };

  const startNewPlace = () => {
    const place = newPlace();
    update((s) => addPlace(s, place));
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

  const dayColumns = COLUMNS.filter((c) => c.id !== POOL);
  // The pool opens separately; the board always shows scheduled days.
  const boardColumns = isMobile ? dayColumns.filter((c) => c.id === activeCol) : dayColumns;

  const columnProps = {
    state: shown,
    areas: state.areas,
    dragging,
    target,
    onOpen: openEditor,
    onRoute: setRouteDay,
    onToggleCollapse: toggleCollapse,
    onToggleDone: (id: PlaceId) => update((s) => toggleDone(s, id)),
    onSetDayArea: (day: ColumnId, area: string | null) => update((s) => setDayArea(s, day, area)),
    onSetDayNote: (day: ColumnId, note: string) => update((s) => setDayNote(s, day, note)),
    onSetDayHotel: (day: ColumnId, id: PlaceId | null) => update((s) => setDayHotel(s, day, id)),
  };

  const editor = editingPlace && (
    <PlaceEditor
      place={editingPlace}
      areas={state.areas}
      column={columnOf(state, editingPlace.id)}
      onSave={(id, patch) => update((s) => updateMeta(s, id, patch))}
      onMove={(id, col) => {
        update((s) => movePlace(s, id, col));
        if (col !== POOL) setActiveCol(col);
      }}
      onRemove={(id) => update((s) => removePlace(s, id))}
      onClose={() => setEditing(null)}
    />
  );

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

      {isMobile && <DayTabs state={shown} active={activeCol} today={today} onSelect={setActiveCol} />}

      <div className="workspace">
        <main className={`board${isMobile ? ' board--single' : ''}`}>
          {boardColumns.map((column) => (
            <Column
              {...columnProps}
              key={column.id}
              column={column}
              isToday={column.id === today}
              collapsed={!isMobile && collapsed[column.id] === true}
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

      {poolOpen ? (
        <PoolModal
          state={shown}
          editing={editingPlace !== null}
          onOpen={openEditor}
          onToggleDone={columnProps.onToggleDone}
          onClose={() => setPoolOpen(false)}
        >
          {editor}
        </PoolModal>
      ) : editor}

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

