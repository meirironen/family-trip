import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PLACES } from '../src/trip.ts';
import { emptyState, movePlace, normalize, removePlace, updateMeta } from '../src/lib/state.ts';
import { duplicateStatus, importPlaces, parsePlaceCsv, type ImportRow } from '../src/lib/placeImport.ts';

const row = (patch: Partial<ImportRow> = {}): ImportRow => ({ name: 'New place', notes: '', maps: '', type: 'food', area: 'garda', ...patch });

test('CSV handles BOM, quoted commas, escaped quotes, Hebrew and multiline notes', () => {
  const rows = parsePlaceCsv('\uFEFFTitle,Note,URL\r\n"קפה, אגם","one\n""two""",https://example.com/place\r\n');
  assert.deepEqual(rows, [row({ name: 'קפה, אגם', notes: 'one\n"two"', maps: 'https://example.com/place', type: '', area: '' })]);
});

test('invalid or unsupported input reports an error instead of importing partial data', () => {
  for (const input of ['', 'Wrong,Note\nName,Note', 'Title,Note\n"unfinished,note', 'Title,Note\na,b,c', 'Title,URL\na,javascript:alert(1)', 'Title\n']) {
    assert.throws(() => parsePlaceCsv(input));
  }
  assert.throws(() => parsePlaceCsv('Title\n' + 'a\n'.repeat(501)));
  assert.equal(parsePlaceCsv('Title,Type\na,toString')[0].type, '');
});

test('sample file works and unknown classifications remain unset for review', () => {
  const rows = parsePlaceCsv(readFileSync(new URL('../public/examples/places.csv', import.meta.url), 'utf8'));
  assert.equal(rows.length, 3);
  assert.equal(rows[0].type, 'attraction');
  assert.equal(rows[1].type, 'food');
  assert.equal(rows[2].type, '');
});

test('imports only chosen rows and preserves day order, edits, completed and removed state through reload', () => {
  let state = movePlace(emptyState(), PLACES[0].id, 'd2');
  state = updateMeta(state, PLACES[0].id, { notes: 'Keep me' });
  state = { ...state, done: { [PLACES[0].id]: true } };
  const before = structuredClone(state);
  const { state: next, added } = importPlaces(state, [row()]);
  assert.equal(added, 1);
  assert.deepEqual(state, before);
  assert.deepEqual(next.order.d2, before.order.d2);
  assert.deepEqual(next.meta, before.meta);
  assert.deepEqual(next.done, before.done);
  assert.deepEqual(next.removed, before.removed);
  assert.equal(next.custom[0].type, 'food');
  assert.deepEqual(normalize(JSON.parse(JSON.stringify(next))), next);
  assert.equal(next.order.pool.at(-1), next.custom[0].id);
});

test('reimport and same-batch duplicates are skipped without overwriting edits', () => {
  const first = importPlaces(emptyState(), [row(), row()]);
  assert.equal(first.added, 1);
  assert.equal(first.skipped, 1);
  const edited = updateMeta(first.state, first.state.custom[0].id, { notes: 'My note' });
  const second = importPlaces(edited, [row({ notes: 'Replace me' })]);
  assert.equal(second.added, 0);
  assert.equal(second.state, edited);
});

test('matches seed Google Maps CID despite changed label or URL formatting', () => {
  const place = PLACES.find((p) => p.maps?.includes('0x'))!;
  const cid = place.maps!.match(/0x[\da-f]+:0x[\da-f]+/i)![0];
  const candidate = row({ name: 'Different title', maps: `https://www.google.com/maps/place/Another/data=!1s${cid}` });
  assert.equal(duplicateStatus(emptyState(), candidate), 'existing');
  const state = removePlace(emptyState(), place.id);
  assert.equal(duplicateStatus(state, candidate), 'removed');
  const result = importPlaces(state, [candidate]);
  assert.equal(result.added, 0);
  assert.deepEqual(result.state.removed, [place.id]);
});

test('same name in different areas with different URLs stays distinct', () => {
  const result = importPlaces(emptyState(), [row({ maps: 'https://example.com/one' }), row({ area: 'milan', maps: 'https://example.com/two' })]);
  assert.equal(result.added, 2);
});

test('invalid selections and oversized state are rejected atomically', () => {
  const state = emptyState();
  for (const invalid of [row({ type: '' }), row({ area: 'unknown' }), row({ area: '__proto__' }), row({ maps: 'javascript:alert(1)' })]) {
    assert.throws(() => importPlaces(state, [row(), invalid]));
  }
  assert.equal(state.custom.length, 0);
  const large = Array.from({ length: 150 }, (_, i) => row({ name: `Place ${i}`, notes: 'x'.repeat(2000) }));
  assert.throws(() => importPlaces(state, large));
  assert.equal(state.custom.length, 0);
});
