import { ATTRACTIONS } from './data/attractions.ts';
import { FOOD } from './data/food.ts';
import { OTHER } from './data/other.ts';

/**
 * Trip configuration and the starting place list.
 * Days and areas are configured here; starter places live in src/data/.
 */

// ---------- types ----------

/**
 * Areas are user-editable, so this is a plain id rather than a union —
 * the set of valid areas lives in the shared state, not in the compiler.
 */
export type AreaId = string;

export interface Area {
  he: string;
  /** Hex colour of the card's edge bar. */
  color: string;
}

export type TypeKey = 'hotel' | 'attraction' | 'hike' | 'food' | 'shop' | 'drive';
export type DayId = 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7' | 'd8' | 'd9';
export type ColumnId = 'pool' | DayId;
export type PlaceId = string;

export interface Place {
  id: PlaceId;
  /** Display name, in Hebrew. */
  he: string;
  /** Original/English name — what we search Google Maps for. */
  orig?: string;
  type: TypeKey;
  area: AreaId;
  /** Free text, e.g. "3–4 שעות". */
  dur?: string;
  notes?: string;
  /** Explicit Maps link; when absent a search link is built from `orig`. */
  maps?: string;
  site?: string;
}

export interface Day {
  id: DayId;
  /** ISO date, used to highlight "today" during the trip. */
  date: string;
  label: string;
  dow: string;
  note: string;
}

export interface ColumnDef {
  id: ColumnId;
  title: string;
  dow?: string;
  note?: string;
  date?: string;
}

export interface Labelled {
  he: string;
}

// ---------- configuration ----------

/** Link to our shared Google Maps list. Paste the list's share URL here. */
export const MAP_URL = 'https://maps.app.goo.gl/UDCx6ie5pLeBcQ6X6';

export const TITLE = 'צפון איטליה';
export const SUBTITLE = '⁦22–30⁩ בספטמבר 2026 · 13 נוסעים';

export const POOL = 'pool' as const;

export const DAYS: readonly Day[] = [
  { id: 'd1', date: '2026-09-22', label: '22.9', dow: 'שלישי', note: 'נחיתה במלפנסה' },
  { id: 'd2', date: '2026-09-23', label: '23.9', dow: 'רביעי', note: 'אגם גרדה' },
  { id: 'd3', date: '2026-09-24', label: '24.9', dow: 'חמישי', note: 'אגם גרדה' },
  { id: 'd4', date: '2026-09-25', label: '25.9', dow: 'שישי', note: 'מעבר לדולמיטים' },
  { id: 'd5', date: '2026-09-26', label: '26.9', dow: 'שבת', note: 'דולמיטים' },
  { id: 'd6', date: '2026-09-27', label: '27.9', dow: 'ראשון', note: 'דולמיטים' },
  { id: 'd7', date: '2026-09-28', label: '28.9', dow: 'שני', note: 'דולמיטים' },
  { id: 'd8', date: '2026-09-29', label: '29.9', dow: 'שלישי', note: 'חזרה למלפנסה' },
  { id: 'd9', date: '2026-09-30', label: '30.9', dow: 'רביעי', note: 'טיסה הביתה' },
];

/** Seed areas. Editable in the app; the live set lives in the shared state. */
export const DEFAULT_AREAS: Record<AreaId, Area> = {
  garda: { he: 'אגם גרדה', color: '#2f7bbd' },
  dolomites: { he: 'דולמיטים', color: '#3f8f5e' },
  verona: { he: 'ורונה', color: '#8a5fb0' },
  venice: { he: 'ונציה', color: '#3f8f8a' },
  milan: { he: 'מילאנו', color: '#a4643a' },
};

/** Palette offered when adding an area. */
export const AREA_COLORS = [
  '#2f7bbd', '#3f8f5e', '#a4643a', '#8a5fb0', '#c1913a', '#3f8f8a', '#b4552d', '#6b7280',
] as const;

/** Colour used when a place points at an area that no longer exists. */
export const FALLBACK_COLOR = '#8b8378';

export const TYPES: Record<TypeKey, Labelled & { icon: string }> = {
  hotel: { he: 'מלון', icon: '🛏' },
  attraction: { he: 'אטרקציה', icon: '◎' },
  hike: { he: 'מסלול הליכה', icon: '⛰' },
  food: { he: 'אוכל', icon: '🍽' },
  shop: { he: 'קניות', icon: '🛍' },
  drive: { he: 'נסיעה', icon: '🚐' },
};

/** Starter places. New places can also be imported through the app. */
export const PLACES: readonly Place[] = [...ATTRACTIONS, ...FOOD, ...OTHER];

/** All columns, right-to-left: the unassigned pool first, then the days. */
export const COLUMNS: readonly ColumnDef[] = [
  { id: POOL, title: 'טרם שובצו' },
  ...DAYS.map((d): ColumnDef => ({ id: d.id, title: d.label, dow: d.dow, note: d.note, date: d.date })),
];

export const COLUMN_IDS: readonly ColumnId[] = COLUMNS.map((c) => c.id);
