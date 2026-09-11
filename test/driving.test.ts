import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyState, movePlace, normalize, removePlace } from '../src/lib/state.ts';
import { drivingKey, drivingMapsUrl, drivingLegs, drivingSummary, setDrivingMinutes } from '../src/lib/driving.ts';
import { DAYS, POOL } from '../src/trip.ts';

const day = DAYS[0].id;
function fixture() {
  let state = emptyState();
  const [a, b, c] = state.order[POOL];
  for (const id of [a, b, c]) state = movePlace(state, id, day);
  return { state, a, b, c };
}

test('manual times survive storage and distinguish zero, missing, and cleared values', () => {
  let { state, a, b, c } = fixture();
  state = setDrivingMinutes(state, day, a, b, 0);
  assert.deepEqual(drivingSummary(state, day), { minutes: 0, missing: 1, segments: 2 });
  state = setDrivingMinutes(state, day, b, c, 75);
  const saved = normalize(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(drivingSummary(saved, day), { minutes: 75, missing: 0, segments: 2 });
  state = setDrivingMinutes(saved, day, a, b, null);
  assert.equal(drivingLegs(state, day)[0].minutes, null);
  assert.equal(drivingSummary(state, day).missing, 1);
});

test('reordering never assigns an old duration to a new or reversed pair', () => {
  let { state, a, b, c } = fixture();
  state = setDrivingMinutes(state, day, a, b, 12);
  state = setDrivingMinutes(state, day, b, c, 23);
  state = movePlace(state, c, day, 1); // A → C → B
  assert.deepEqual(drivingLegs(state, day).map((leg) => leg.minutes), [null, null]);
  assert.equal(setDrivingMinutes(state, day, a, b, 99), state); // stale open input
  state = movePlace(state, c, day); // restore A → B → C
  assert.deepEqual(drivingLegs(state, day).map((leg) => leg.minutes), [12, 23]);
});

test('moving a place to another day excludes its old segments from totals', () => {
  let { state, a, b, c } = fixture();
  state = setDrivingMinutes(state, day, a, b, 15);
  state = setDrivingMinutes(state, day, b, c, 20);
  state = movePlace(state, b, DAYS[1].id);
  assert.deepEqual(drivingSummary(state, day), { minutes: 0, missing: 1, segments: 1 });
  assert.deepEqual(drivingSummary(state, DAYS[1].id), { minutes: 0, missing: 0, segments: 0 });
  assert.deepEqual(drivingSummary(state, POOL), { minutes: 0, missing: 0, segments: 0 });
});

test('deleting a place removes associated times but preserves other pairs', () => {
  let { state, a, b, c } = fixture();
  state = setDrivingMinutes(state, day, a, b, 15);
  state = setDrivingMinutes(state, day, b, c, 20);
  state = removePlace(state, a);
  assert.deepEqual(state.drivingMinutes, { [drivingKey(b, c)]: 20 });
});

test('legacy trips and malformed persisted times normalize safely', () => {
  const { state, a, b } = fixture();
  const { drivingMinutes: _, ...legacy } = state;
  assert.deepEqual(normalize(legacy).drivingMinutes, {});
  for (const value of [-1, 1.5, 1441, NaN, Infinity, '12', null]) {
    assert.deepEqual(normalize({ ...state, drivingMinutes: { [drivingKey(a, b)]: value } }).drivingMinutes, {});
  }
  assert.deepEqual(normalize({ ...state, drivingMinutes: {
    [drivingKey(a, b)]: 12, 'bad-json': 10, '[1,2]': 10,
    [drivingKey(a, 'unknown')]: 10, [drivingKey(a, a)]: 10,
  } }).drivingMinutes, { [drivingKey(a, b)]: 12 });
});

test('edits require a real consecutive pair and whole minutes from 0 through 1440', () => {
  const { state, a, b, c } = fixture();
  for (const value of [-1, 0.5, 1441, NaN, Infinity]) {
    assert.equal(setDrivingMinutes(state, day, a, b, value), state);
  }
  assert.equal(setDrivingMinutes(state, day, a, c, 10), state);
  assert.equal(setDrivingMinutes(state, POOL, a, b, 10), state);
  assert.equal(drivingLegs(setDrivingMinutes(state, day, a, b, 1440), day)[0].minutes, 1440);
});

test('Maps link uses the directed pair, driving mode, and safely encoded original names', () => {
  const url = new URL(drivingMapsUrl({ he: 'מלון', orig: 'Hotel A & B' }, { he: 'אגם בראייס', orig: 'Pragser Wildsee' }));
  assert.equal(url.origin + url.pathname, 'https://www.google.com/maps/dir/');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('travelmode'), 'driving');
  assert.equal(url.searchParams.get('origin'), 'Hotel A & B');
  assert.equal(url.searchParams.get('destination'), 'Pragser Wildsee');
  const fallback = new URL(drivingMapsUrl({ he: 'מוצא', orig: ' ' }, { he: 'יעד' }));
  assert.equal(fallback.searchParams.get('origin'), 'מוצא');
  assert.equal(fallback.searchParams.get('destination'), 'יעד');
});
