import { drivingSummary, formatDrivingMinutes } from '../lib/driving.ts';
import type { TripState } from '../lib/state.ts';
import type { ColumnId } from '../trip.ts';

export default function DrivingTotal({ state, day }: { state: TripState; day: ColumnId }) {
  const total = drivingSummary(state, day);
  if (!total.segments) return null;
  return <p className="driving-total" aria-live="polite">
    🚗 {total.missing ? 'זמן נסיעה שהוזן' : 'סה״כ נסיעה ביום'}: {formatDrivingMinutes(total.minutes)}
    {total.missing > 0 && <span> · חסר זמן ב־{total.missing} מקטעים</span>}
  </p>;
}
