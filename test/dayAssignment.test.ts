import test from 'node:test';
import assert from 'node:assert/strict';
import { COLUMNS } from '../src/trip.ts';
import { emptyState, hotels, setDayHotel, setDayNote, updateMeta } from '../src/lib/state.ts';
import { dayAssignmentLabel } from '../src/lib/dayAssignment.ts';

test('assignment label follows saved day descriptions, including an intentionally empty description', () => {
  const day = COLUMNS.find((c) => c.id === 'd2')!;
  let state = emptyState();
  assert.ok(dayAssignmentLabel(state, day).includes(day.note!));
  state = setDayNote(state, 'd2', 'התיאור המעודכן שלנו');
  assert.equal(dayAssignmentLabel(state, day), `${day.title} · ${day.dow} — התיאור המעודכן שלנו`);
  state = setDayNote(state, 'd2', '');
  assert.equal(dayAssignmentLabel(state, day), `${day.title} · ${day.dow}`);
});

test('each day shows its assigned hotel, including edited names, across the three trip hotels', () => {
  let state = emptyState();
  const tripHotels = hotels(state);
  assert.equal(tripHotels.length, 3);
  const days = ['d1', 'd2', 'd3'] as const;
  tripHotels.forEach((hotel, i) => { state = setDayHotel(state, days[i], hotel.id); });
  state = updateMeta(state, tripHotels[1].id, { he: 'שם מלון מעודכן' });
  days.forEach((id, i) => {
    const label = dayAssignmentLabel(state, COLUMNS.find((c) => c.id === id)!);
    assert.ok(label.endsWith(`🛏 ${i === 1 ? 'שם מלון מעודכן' : tripHotels[i].he}`));
  });
  state = setDayHotel(state, 'd2', null);
  assert.ok(!dayAssignmentLabel(state, COLUMNS.find((c) => c.id === 'd2')!).includes('🛏'));
  assert.equal(dayAssignmentLabel(state, COLUMNS[0]), COLUMNS[0].title);
});
