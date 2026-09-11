import { POOL, type ColumnDef } from '../trip.ts';
import { dayNote, hotelOf, type TripState } from './state.ts';

/** Use the same saved description and hotel as the day card. */
export function dayAssignmentLabel(state: TripState, column: ColumnDef): string {
  if (column.id === POOL) return column.title;
  const title = [column.title, column.dow].filter(Boolean).join(' · ');
  const note = dayNote(state, column.id);
  const hotel = hotelOf(state, column.id);
  return [title, note, hotel ? `🛏 ${hotel.he}` : ''].filter(Boolean).join(' — ');
}
