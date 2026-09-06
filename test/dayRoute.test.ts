import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dayRouteLinks } from '../src/lib/dayRoute.ts';

const params = (url: string) => new URL(url).searchParams;

test('route starts at the chosen address and visits stops in order', () => {
  const [url] = dayRouteLinks(['A', 'B', 'C'], 'Hotel & Spa');
  assert.equal(params(url).get('origin'), 'Hotel & Spa');
  assert.equal(params(url).get('waypoints'), 'A|B');
  assert.equal(params(url).get('destination'), 'C');
  assert.equal(params(url).get('travelmode'), 'driving');
});

test('current location leaves the origin to Google Maps and supports one stop', () => {
  const [url] = dayRouteLinks(['A'], null);
  assert.equal(params(url).has('origin'), false);
  assert.equal(params(url).get('destination'), 'A');
});

test('long days retain every stop and connect route parts', () => {
  const stops = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  const links = dayRouteLinks(stops, 'Hotel');
  assert.equal(links.length, 3);
  assert.deepEqual(links.map((url) => params(url).get('origin')), ['Hotel', 'D', 'H']);
  const visited = links.flatMap((url) => {
    const p = params(url);
    return [...(p.get('waypoints')?.split('|') ?? []), p.get('destination')];
  });
  assert.deepEqual(visited, stops);
  assert.deepEqual(stops, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);
});

test('empty days have no route', () => assert.deepEqual(dayRouteLinks([], 'Hotel'), []));
