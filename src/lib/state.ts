/**
 * Pure helpers for the shared itinerary state.
 * No React, no I/O — everything here is covered by test/state.test.ts.
 */
import {
  COLUMN_IDS,
  DEFAULT_AREAS,
  FALLBACK_COLOR,
  PLACES,
  POOL,
  TYPES,
  type Area,
  type AreaId,
  type ColumnId,
  type Place,
  type PlaceId,
  type TypeKey,
} from '../trip.ts';

/** The whole shared document. */
export interface TripState {
  order: Record<ColumnId, PlaceId[]>;
  /** Per-place edits made in the app, layered over the record in trip.ts. */
  meta: Record<PlaceId, Partial<Place>>;
  custom: Place[];
  removed: PlaceId[];
  done: Record<PlaceId, true>;
  /** Areas are edited in the app, so they travel with the state. */
  areas: Record<AreaId, Area>;
  /** Which area each day is based in. Days start unset, hence Partial. */
  dayAreas: Partial<Record<ColumnId, AreaId>>;
}

export function emptyState(): TripState {
  const order = Object.fromEntries(COLUMN_IDS.map((id) => [id, [] as PlaceId[]])) as Record<
    ColumnId,
    PlaceId[]
  >;
  order[POOL] = PLACES.map((p) => p.id);
  return {
    order,
    meta: {},
    custom: [],
    removed: [],
    done: {},
    areas: { ...DEFAULT_AREAS },
    dayAreas: {},
  };
}

/**
 * Repairs anything missing, duplicated or stale so the UI never sees a
 * malformed state — the document comes off the network, so assume nothing.
 */
export function normalize(input: unknown): TripState {
  const s = isRecord(input) ? input : {};

  const out: TripState = {
    order: {} as Record<ColumnId, PlaceId[]>,
    meta: isRecord(s.meta) ? (s.meta as TripState['meta']) : {},
    custom: Array.isArray(s.custom) ? s.custom.filter(isPlace) : [],
    removed: Array.isArray(s.removed) ? s.removed.filter(isId) : [],
    done: isRecord(s.done) ? (s.done as TripState['done']) : {},
    areas: readAreas(s.areas),
    dayAreas: {},
  };

  // keep only day→area pairs that still point at a real day and a real area
  if (isRecord(s.dayAreas)) {
    for (const [day, area] of Object.entries(s.dayAreas)) {
      if (COLUMN_IDS.includes(day as ColumnId) && isId(area) && area in out.areas) {
        out.dayAreas[day as ColumnId] = area;
      }
    }
  }

  const rawOrder = isRecord(s.order) ? s.order : {};
  const known = new Set(allPlaces(out).map((p) => p.id));
  const seen = new Set<PlaceId>();

  for (const col of COLUMN_IDS) {
    const src = rawOrder[col];
    out.order[col] = (Array.isArray(src) ? src : []).filter((id): id is PlaceId => {
      if (!isId(id) || !known.has(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  // anything not placed anywhere falls back into the pool
  for (const p of allPlaces(out)) {
    if (!seen.has(p.id)) out.order[POOL].push(p.id);
  }
  return out;
}

/** Areas from the document, falling back to the seeds — never an empty set. */
function readAreas(input: unknown): Record<AreaId, Area> {
  if (!isRecord(input)) return { ...DEFAULT_AREAS };

  const areas: Record<AreaId, Area> = {};
  for (const [id, value] of Object.entries(input)) {
    if (!isId(id) || !isRecord(value)) continue;
    if (typeof value.he !== 'string' || value.he.trim() === '') continue;
    areas[id] = {
      he: value.he.slice(0, 60),
      color: isHexColor(value.color) ? value.color : FALLBACK_COLOR,
    };
  }
  return Object.keys(areas).length > 0 ? areas : { ...DEFAULT_AREAS };
}

/** The area a place belongs to, or a neutral stand-in if it was deleted. */
export function areaOf(state: TripState, place: Place): Area {
  return state.areas[place.area] ?? { he: '', color: FALLBACK_COLOR };
}

export function allPlaces(state: Pick<TripState, 'custom' | 'removed'>): Place[] {
  const removed = new Set(state.removed);
  return [...PLACES, ...state.custom].filter((p) => !removed.has(p.id));
}

/** A place with any user edits applied on top of the base record. */
export function resolvePlace(state: TripState, id: PlaceId): Place | null {
  const base = allPlaces(state).find((p) => p.id === id);
  return base ? { ...base, ...(state.meta[id] ?? {}) } : null;
}

export function columnOf(state: TripState, id: PlaceId): ColumnId | null {
  return COLUMN_IDS.find((col) => state.order[col]?.includes(id)) ?? null;
}

// ---------- transitions (each returns a new state) ----------

export function movePlace(
  state: TripState,
  id: PlaceId,
  toCol: ColumnId,
  toIndex: number | null = null
): TripState {
  if (!COLUMN_IDS.includes(toCol)) return state;

  const order = {} as Record<ColumnId, PlaceId[]>;
  for (const col of COLUMN_IDS) order[col] = state.order[col].filter((x) => x !== id);

  const target = order[toCol];
  const at = toIndex === null || toIndex < 0 || toIndex > target.length ? target.length : toIndex;
  target.splice(at, 0, id);

  return { ...state, order };
}

export function updateMeta(state: TripState, id: PlaceId, patch: Partial<Place>): TripState {
  return { ...state, meta: { ...state.meta, [id]: { ...(state.meta[id] ?? {}), ...patch } } };
}

export function toggleDone(state: TripState, id: PlaceId): TripState {
  const done = { ...state.done };
  if (done[id]) delete done[id];
  else done[id] = true;
  return { ...state, done };
}

export function addPlace(state: TripState, place: Place): TripState {
  return {
    ...state,
    custom: [...state.custom, place],
    order: { ...state.order, [POOL]: [place.id, ...state.order[POOL]] },
  };
}

export function removePlace(state: TripState, id: PlaceId): TripState {
  const order = {} as Record<ColumnId, PlaceId[]>;
  for (const col of COLUMN_IDS) order[col] = state.order[col].filter((x) => x !== id);

  const done = { ...state.done };
  delete done[id];

  return { ...state, order, done, removed: [...state.removed, id] };
}

export function newPlace(): Place {
  const id = `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return { id, he: 'מקום חדש', orig: '', type: 'attraction', area: 'garda', dur: '', notes: '' };
}

// ---------- areas ----------

/** Sets (or with null, clears) the area a day is based in. */
export function setDayArea(state: TripState, day: ColumnId, area: AreaId | null): TripState {
  if (!COLUMN_IDS.includes(day)) return state;

  const dayAreas = { ...state.dayAreas };
  if (area === null) delete dayAreas[day];
  else if (area in state.areas) dayAreas[day] = area;
  else return state;

  return { ...state, dayAreas };
}

export function addArea(state: TripState, he: string, color: string): TripState {
  const name = he.trim();
  if (name === '') return state;

  const id = `a_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    ...state,
    areas: {
      ...state.areas,
      [id]: { he: name.slice(0, 60), color: isHexColor(color) ? color : FALLBACK_COLOR },
    },
  };
}

export function updateArea(state: TripState, id: AreaId, patch: Partial<Area>): TripState {
  const current = state.areas[id];
  if (!current) return state;

  const next: Area = {
    he: typeof patch.he === 'string' && patch.he.trim() !== '' ? patch.he.trim().slice(0, 60) : current.he,
    color: isHexColor(patch.color) ? patch.color : current.color,
  };
  return { ...state, areas: { ...state.areas, [id]: next } };
}

/**
 * Deletes an area and moves everything that was in it to another one, so no
 * place is left pointing at nothing. The last remaining area can't be deleted.
 */
export function removeArea(state: TripState, id: AreaId): TripState {
  const ids = Object.keys(state.areas);
  if (!ids.includes(id) || ids.length <= 1) return state;

  const fallback = ids.find((other) => other !== id) as AreaId;

  const meta = { ...state.meta };
  for (const place of allPlaces(state)) {
    const effective = meta[place.id]?.area ?? place.area;
    if (effective === id) meta[place.id] = { ...(meta[place.id] ?? {}), area: fallback };
  }

  const areas = { ...state.areas };
  delete areas[id];

  const dayAreas: TripState['dayAreas'] = {};
  for (const [day, area] of Object.entries(state.dayAreas)) {
    dayAreas[day as ColumnId] = area === id ? fallback : area;
  }

  return { ...state, areas, meta, dayAreas };
}

/** How many places sit in an area — shown before deleting one. */
export function countInArea(state: TripState, id: AreaId): number {
  return allPlaces(state).filter((p) => (state.meta[p.id]?.area ?? p.area) === id).length;
}

// ---------- links ----------

export function mapsUrl(place: Pick<Place, 'he' | 'orig' | 'maps'>): string {
  if (isHttpUrl(place.maps)) return place.maps;
  const query = place.orig || place.he;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** One Google Maps route through every stop of a day, in order. */
export function routeUrl(state: TripState, colId: ColumnId): string | null {
  const stops = (state.order[colId] ?? [])
    .map((id) => resolvePlace(state, id))
    .filter((p): p is Place => p !== null)
    .map((p) => p.orig || p.he);

  if (stops.length < 2) return null;

  const params = new URLSearchParams({
    api: '1',
    origin: stops[0],
    destination: stops[stops.length - 1],
  });
  const waypoints = stops.slice(1, -1);
  if (waypoints.length > 0) params.set('waypoints', waypoints.join('|'));

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Only ever render links we know are plain web URLs.
 * Narrows to `string`, so a checked value can be used directly as an href —
 * this is what keeps `javascript:` out of the DOM.
 */
export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value === '') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// ---------- guards ----------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isId(v: unknown): v is PlaceId {
  return typeof v === 'string' && v.length > 0 && v.length <= 64;
}

function isPlace(v: unknown): v is Place {
  return (
    isRecord(v) &&
    isId(v.id) &&
    typeof v.he === 'string' &&
    v.he.length <= 200 &&
    isTypeKey(v.type) &&
    isId(v.area)
  );
}

export function isTypeKey(v: unknown): v is TypeKey {
  return typeof v === 'string' && v in TYPES;
}

function isHexColor(v: unknown): v is string {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
}
