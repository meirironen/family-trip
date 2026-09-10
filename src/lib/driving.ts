import { COLUMN_IDS, POOL, type ColumnId, type PlaceId, type Place } from '../trip.ts';
import type { TripState } from './state.ts';

export const MAX_DRIVING_MINUTES = 1440;
export const drivingKey = (from: PlaceId, to: PlaceId): string => JSON.stringify([from, to]);
export const validDrivingMinutes = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_DRIVING_MINUTES;

export function normalizeDrivingMinutes(input: unknown, known: Set<PlaceId>): Record<string, number> {
  const out: Record<string, number> = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
  for (const [key, value] of Object.entries(input)) {
    if (!validDrivingMinutes(value)) continue;
    try {
      const pair: unknown = JSON.parse(key);
      if (Array.isArray(pair) && pair.length === 2 && pair.every((id) => typeof id === 'string' && known.has(id)) && pair[0] !== pair[1]) {
        out[drivingKey(pair[0], pair[1])] = value;
      }
    } catch { /* ignore malformed saved keys */ }
  }
  return out;
}

/** Only real, consecutive places in a scheduled day are route segments. */
export function drivingLegs(state: TripState, day: ColumnId) {
  const ids = day === POOL ? [] : state.order[day] ?? [];
  return ids.slice(1).map((to, index) => {
    const from = ids[index];
    return { from, to, minutes: state.drivingMinutes[drivingKey(from, to)] ?? null };
  });
}

export function drivingSummary(state: TripState, day: ColumnId) {
  const legs = drivingLegs(state, day);
  return {
    minutes: legs.reduce((total, leg) => total + (leg.minutes ?? 0), 0),
    missing: legs.filter((leg) => leg.minutes === null).length,
    segments: legs.length,
  };
}

/** Reject stale edits if the pair was moved while the input was open. */
export function setDrivingMinutes(state: TripState, day: ColumnId, from: PlaceId, to: PlaceId, minutes: number | null): TripState {
  if (day === POOL || !COLUMN_IDS.includes(day) ||
      !drivingLegs(state, day).some((leg) => leg.from === from && leg.to === to) ||
      (minutes !== null && !validDrivingMinutes(minutes))) return state;
  const key = drivingKey(from, to);
  const drivingMinutes = { ...state.drivingMinutes };
  if (minutes === null) delete drivingMinutes[key];
  else drivingMinutes[key] = minutes;
  return { ...state, drivingMinutes };
}

export function formatDrivingMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} דק׳`;
  const remainder = minutes % 60;
  return `${Math.floor(minutes / 60)} שע׳${remainder ? ` ${remainder} דק׳` : ''}`;
}

/** Directions for this exact leg, using original place names for Maps searches. */
export function drivingMapsUrl(from: Pick<Place, 'he' | 'orig'>, to: Pick<Place, 'he' | 'orig'>): string {
  const params = new URLSearchParams({
    api: '1',
    travelmode: 'driving',
    origin: from.orig?.trim() || from.he,
    destination: to.orig?.trim() || to.he,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
