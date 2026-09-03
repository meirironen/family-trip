import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  addArea,
  addPlace,
  areaOf,
  countInArea,
  removeArea,
  setDayArea,
  updateArea,
  columnOf,
  emptyState,
  isHttpUrl,
  mapsUrl,
  movePlace,
  newPlace,
  normalize,
  removePlace,
  resolvePlace,
  routeUrl,
  toggleDone,
  updateMeta,
} from '../src/lib/state.ts';
import { COLUMN_IDS, DEFAULT_AREAS, FALLBACK_COLOR, PLACES, POOL } from '../src/trip.ts';

// Tests work off whatever trip.ts holds, so re-importing the place list
// from Google Maps never breaks them.
const [A, B, C] = PLACES;
const nameOf = (p: (typeof PLACES)[number]) => p.orig || p.he;

test('empty state puts every place in the pool', () => {
  const s = emptyState();
  assert.equal(s.order[POOL].length, PLACES.length);
  assert.equal(s.order.d1.length, 0);
});

test('normalize repairs junk and never loses a place', () => {
  const s = normalize({ order: { pool: ['nope', A.id, A.id], d1: null }, meta: 'bad' });

  assert.equal(s.order[POOL].filter((id) => id === A.id).length, 1, 'dedupes');
  assert.ok(!s.order[POOL].includes('nope'), 'drops unknown ids');
  assert.deepEqual(Object.keys(s.order).sort(), [...COLUMN_IDS].sort());
  assert.equal(Object.values(s.order).flat().length, PLACES.length, 'each place placed once');
  assert.deepEqual(s.meta, {}, 'rejects a non-object meta');
});

test('normalize survives a round trip through JSON', () => {
  const moved = movePlace(emptyState(), A.id, 'd2', 0);
  const s = normalize(JSON.parse(JSON.stringify(moved)));
  assert.equal(columnOf(s, A.id), 'd2');
});

test('movePlace moves between columns and respects the index', () => {
  let s = emptyState();
  s = movePlace(s, A.id, 'd3');
  s = movePlace(s, B.id, 'd3', 0);
  assert.deepEqual(s.order.d3, [B.id, A.id]);
  assert.ok(!s.order[POOL].includes(A.id));

  s = movePlace(s, A.id, 'd3', 0);
  assert.deepEqual(s.order.d3, [A.id, B.id], 'reorders within a column');
});

test('movePlace clamps an out-of-range index instead of leaving a hole', () => {
  const s = movePlace(emptyState(), A.id, 'd3', 99);
  assert.deepEqual(s.order.d3, [A.id]);
});

test('meta edits override the base record, leaving other fields alone', () => {
  const s = updateMeta(emptyState(), A.id, { he: 'שם חדש', dur: 'יומיים' });
  const p = resolvePlace(s, A.id);
  assert.equal(p?.he, 'שם חדש');
  assert.equal(p?.dur, 'יומיים');
  assert.equal(p?.area, A.area, 'untouched fields survive');
});

test('done toggles both ways', () => {
  let s = toggleDone(emptyState(), A.id);
  assert.equal(s.done[A.id], true);
  s = toggleDone(s, A.id);
  assert.equal(s.done[A.id], undefined);
});

test('a custom place can be added and removed for good', () => {
  const p = newPlace();
  let s = addPlace(emptyState(), p);
  assert.equal(s.order[POOL][0], p.id);
  assert.ok(resolvePlace(s, p.id));

  s = removePlace(s, p.id);
  assert.equal(resolvePlace(s, p.id), null);
  assert.equal(normalize(s).order[POOL].includes(p.id), false, 'stays removed after normalize');
});

test('maps link falls back to a search and refuses a hostile url', () => {
  assert.match(mapsUrl({ he: 'ורונה', orig: 'Verona' }), /maps\/search.*Verona/);
  assert.ok(
    mapsUrl({ he: 'x', orig: 'x', maps: 'javascript:alert(1)' }).startsWith(
      'https://www.google.com/maps/search'
    )
  );
  assert.equal(mapsUrl({ he: 'x', maps: 'https://maps.app.goo.gl/abc' }), 'https://maps.app.goo.gl/abc');
});

test('route url needs two stops and chains the middle ones as waypoints', () => {
  let s = movePlace(emptyState(), A.id, 'd2', 0);
  assert.equal(routeUrl(s, 'd2'), null, 'one stop is not a route');

  s = movePlace(s, B.id, 'd2', 1);
  s = movePlace(s, C.id, 'd2', 2);

  const url = new URL(routeUrl(s, 'd2') as string);
  assert.equal(url.searchParams.get('origin'), nameOf(A));
  assert.equal(url.searchParams.get('destination'), nameOf(C));
  assert.equal(url.searchParams.get('waypoints'), nameOf(B), 'middle stops become waypoints');
});

test('isHttpUrl allows only http and https', () => {
  assert.equal(isHttpUrl('https://a.com'), true);
  assert.equal(isHttpUrl('http://a.com'), true);
  assert.equal(isHttpUrl('javascript:alert(1)'), false);
  assert.equal(isHttpUrl('data:text/html,x'), false);
  assert.equal(isHttpUrl(''), false);
  assert.equal(isHttpUrl(undefined), false);
  assert.equal(isHttpUrl(42), false);
});


// ---------- areas ----------

test('a fresh state carries the seed areas', () => {
  assert.deepEqual(Object.keys(emptyState().areas), Object.keys(DEFAULT_AREAS));
});

test('normalize falls back to the seeds rather than leaving no areas', () => {
  assert.deepEqual(Object.keys(normalize({ areas: {} }).areas), Object.keys(DEFAULT_AREAS));
  assert.deepEqual(Object.keys(normalize({ areas: 'nope' }).areas), Object.keys(DEFAULT_AREAS));
});

test('normalize drops malformed areas and repairs a bad colour', () => {
  const s = normalize({
    areas: { good: { he: 'טוב', color: '#123456' }, noname: { color: '#fff000' }, badcolor: { he: 'צבע', color: 'red' } },
  });
  assert.deepEqual(Object.keys(s.areas).sort(), ['badcolor', 'good']);
  assert.equal(s.areas.badcolor.color, FALLBACK_COLOR);
});

test('an area can be added and renamed', () => {
  let s = addArea(emptyState(), '  טוסקנה  ', '#8a5fb0');
  const id = Object.keys(s.areas).find((k) => s.areas[k].he === 'טוסקנה');
  assert.ok(id, 'name is trimmed and stored');
  assert.equal(s.areas[id!].color, '#8a5fb0');

  s = updateArea(s, id!, { he: 'טוסקנה הצפונית' });
  assert.equal(s.areas[id!].he, 'טוסקנה הצפונית');
  assert.equal(s.areas[id!].color, '#8a5fb0', 'colour survives a rename');
});

test('adding an area rejects a blank name and a bad colour', () => {
  const base = emptyState();
  assert.equal(addArea(base, '   ', '#123456'), base);
  const s = addArea(base, 'אזור', 'not-a-colour');
  const id = Object.keys(s.areas).find((k) => s.areas[k].he === 'אזור')!;
  assert.equal(s.areas[id].color, FALLBACK_COLOR);
});

test('deleting an area moves its places somewhere real, losing none', () => {
  const before = emptyState();
  const victim = A.area;
  assert.ok(countInArea(before, victim) > 0, 'the data has places in this area');

  const s = removeArea(before, victim);
  assert.ok(!(victim in s.areas));
  assert.equal(countInArea(s, victim), 0);

  // every place still resolves, and to an area that exists
  const all = Object.values(s.order).flat();
  assert.equal(all.length, PLACES.length, 'no place was dropped');
  for (const id of all) {
    const p = resolvePlace(s, id)!;
    assert.ok(p.area in s.areas, `${p.he} points at a live area`);
  }
});

test('the last area cannot be deleted', () => {
  let s = emptyState();
  for (const id of Object.keys(DEFAULT_AREAS)) s = removeArea(s, id);
  assert.equal(Object.keys(s.areas).length, 1, 'one always remains');
});

test('deleting an unknown area changes nothing', () => {
  const s = emptyState();
  assert.equal(removeArea(s, 'nope'), s);
});

test('areaOf falls back instead of throwing when the area is gone', () => {
  const s = emptyState();
  const orphan = { id: 'x', he: 'יתום', type: 'attraction' as const, area: 'deleted-area' };
  assert.equal(areaOf(s, orphan).color, FALLBACK_COLOR);
});


// ---------- area per day ----------

test('days start with no area', () => {
  assert.deepEqual(emptyState().dayAreas, {});
});

test('a day can be given an area and cleared again', () => {
  const area = Object.keys(DEFAULT_AREAS)[0];
  let s = setDayArea(emptyState(), 'd4', area);
  assert.equal(s.dayAreas.d4, area);

  s = setDayArea(s, 'd4', null);
  assert.equal(s.dayAreas.d4, undefined);
});

test('setDayArea rejects an unknown day or an unknown area', () => {
  const s = emptyState();
  assert.equal(setDayArea(s, 'nope' as 'd1', Object.keys(DEFAULT_AREAS)[0]), s);
  assert.equal(setDayArea(s, 'd1', 'no-such-area'), s);
});

test('deleting an area re-points the days that used it', () => {
  const [victim, other] = Object.keys(DEFAULT_AREAS);
  let s = setDayArea(emptyState(), 'd2', victim);
  s = setDayArea(s, 'd3', other);

  s = removeArea(s, victim);
  assert.ok(s.dayAreas.d2 && s.dayAreas.d2 in s.areas, 'd2 points at a live area');
  assert.equal(s.dayAreas.d3, other, 'untouched day keeps its area');
});

test('normalize drops day areas that no longer resolve', () => {
  const s = normalize({ dayAreas: { d1: 'garda', d2: 'ghost-area', nope: 'garda' } });
  assert.equal(s.dayAreas.d1, 'garda');
  assert.equal(s.dayAreas.d2, undefined, 'unknown area dropped');
  assert.equal((s.dayAreas as Record<string, string>).nope, undefined, 'unknown day dropped');
});
