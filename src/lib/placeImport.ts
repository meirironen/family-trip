import { PLACES, POOL, type Place, type TypeKey } from '../trip.ts';
import { isHttpUrl, isTypeKey, type TripState } from './state.ts';

export interface ImportRow {
  name: string;
  notes: string;
  maps: string;
  type: TypeKey | '';
  area: string;
}

export const MAX_IMPORT_BYTES = 1024 * 1024;
const MAX_ROWS = 500;

/** RFC 4180-style CSV, including BOM, quoted commas, escaped quotes and newlines. */
function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false, closed = false;
  text = text.replace(/^\uFEFF/, '');
  const pushField = () => { row.push(field); field = ''; closed = false; };
  const pushRow = () => { pushField(); if (row.some((cell) => cell.trim())) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === ',') pushField();
    else if (c === '\n' || c === '\r') { pushRow(); if (c === '\r' && text[i + 1] === '\n') i++; }
    else if (c === '"' && field === '' && !closed) quoted = true;
    else if (closed || c === '"') throw new Error('מבנה CSV לא תקין: בדקו את המרכאות בקובץ.');
    else field += c;
  }
  if (quoted) throw new Error('מבנה CSV לא תקין: חסרות מרכאות סוגרות.');
  pushRow();
  return rows;
}

/** Saved-list CSV shape: Title, Note, URL. Optional type and area columns. */
export function parsePlaceCsv(text: string): ImportRow[] {
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) throw new Error('הקובץ גדול מדי. הגודל המרבי הוא 1MB.');
  const [header, ...rows] = csvRows(text);
  if (!header) throw new Error('הקובץ ריק.');
  const columns = header.map((h) => h.trim().toLowerCase());
  const index = (...names: string[]) => columns.findIndex((h) => names.includes(h));
  const title = index('title', 'name', 'he');
  const note = index('note', 'notes');
  const url = index('url', 'maps');
  const type = index('type');
  const area = index('area');
  if (title < 0) throw new Error('לא נמצאה עמודת Title או Name. העלו את קובץ ה-CSV של הרשימה.');
  if (!rows.length) throw new Error('לא נמצאו מקומות בקובץ.');
  if (rows.length > MAX_ROWS) throw new Error('ניתן לייבא עד 500 מקומות בכל פעם.');
  return rows.map((row, i) => {
    if (row.length !== header.length) throw new Error(`שורה ${i + 2}: מספר העמודות אינו תואם לכותרת.`);
    const get = (at: number) => at < 0 ? '' : (row[at] ?? '').trim();
    const name = get(title), notes = get(note), maps = get(url), kind = get(type);
    if (!name || name.length > 200) throw new Error(`שורה ${i + 2}: שם המקום נדרש ומוגבל ל-200 תווים.`);
    if (notes.length > 2000 || maps.length > 2048) throw new Error(`שורה ${i + 2}: ההערה או הקישור ארוכים מדי.`);
    if (maps && !isHttpUrl(maps)) throw new Error(`שורה ${i + 2}: נדרש קישור שמתחיל ב-http או https.`);
    return { name, notes, maps, type: isTypeKey(kind) ? kind : '', area: get(area) };
  });
}

function urlKey(value: string | undefined): string {
  if (!value || !isHttpUrl(value)) return '';
  const url = new URL(value);
  // Google Maps exports often identify the place by a hexadecimal CID pair.
  if (/(^|\.)google\.[a-z.]+$/.test(url.hostname) || url.hostname === 'maps.app.goo.gl') {
    const cid = value.match(/0x[\da-f]+:0x[\da-f]+/i)?.[0];
    if (cid) return cid.toLowerCase();
  }
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) if (key.startsWith('utm_')) url.searchParams.delete(key);
  url.searchParams.sort();
  return url.toString().replace(/\/$/, '');
}
const nameKey = (value: string) => value.normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g, ' ');

function matches(row: ImportRow, place: Place): boolean {
  const key = urlKey(row.maps);
  return !!(key && key === urlKey(place.maps)) ||
    (row.area === place.area && [place.he, place.orig ?? ''].some((n) => nameKey(n) === nameKey(row.name)));
}

/** Includes deleted records: importing must never silently resurrect one. */
export function duplicateStatus(state: TripState, row: ImportRow): 'existing' | 'removed' | null {
  const match = [...PLACES, ...state.custom].find((p) => matches(row, p) || matches(row, { ...p, ...state.meta[p.id] }));
  return match ? state.removed.includes(match.id) ? 'removed' : 'existing' : null;
}

export function importPlaces(state: TripState, rows: ImportRow[]): { state: TripState; added: number; skipped: number } {
  if (rows.length > MAX_ROWS) throw new Error('ניתן לייבא עד 500 מקומות בכל פעם.');
  let next = state, added = 0, skipped = 0;
  for (const row of rows) {
    if (!row.name.trim() || row.name.length > 200 || row.notes.length > 2000 || row.maps.length > 2048 ||
        (row.maps && !isHttpUrl(row.maps)) || !isTypeKey(row.type) || !Object.hasOwn(state.areas, row.area)) {
      throw new Error('יש לבחור סוג ואזור תקינים לכל מקום מסומן.');
    }
    if (duplicateStatus(next, row)) { skipped++; continue; }
    const place: Place = { id: `i_${crypto.randomUUID()}`, he: row.name, orig: row.name, type: row.type,
      area: row.area, notes: row.notes, maps: row.maps };
    next = { ...next, custom: [...next.custom, place], order: { ...next.order, [POOL]: [...next.order[POOL], place.id] } };
    added++;
  }
  // Leave room below the API's 256KB limit; reject the entire batch before updating.
  if (new TextEncoder().encode(JSON.stringify(next)).length > 240 * 1024) throw new Error('הטיול מלא מדי לייבוא הזה. בחרו פחות מקומות.');
  return { state: next, added, skipped };
}
