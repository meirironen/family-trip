import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hitTest } from '../src/lib/useDragDrop.ts';

function withColumn(collapsed: boolean, run: () => void) {
  const column = {
    dataset: { col: 'd1', dropCount: '2' },
    querySelector: () => collapsed ? null : {},
    querySelectorAll: () => [
      { dataset: { place: 'a' }, getBoundingClientRect: () => ({ top: 200, height: 60 }) },
      { dataset: { place: 'b' }, getBoundingClientRect: () => ({ top: 270, height: 60 }) },
    ],
  };
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { elementFromPoint: () => ({ closest: () => column }) },
  });
  try { run(); } finally {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else Reflect.deleteProperty(globalThis, 'document');
  }
}

test('first day accepts a drop over its header before the first card', () => {
  withColumn(false, () => assert.deepEqual(hitTest(100, 100, 'pool-place'), { col: 'd1', index: 0 }));
});

test('collapsed first day appends after existing places', () => {
  withColumn(true, () => assert.deepEqual(hitTest(100, 100, 'pool-place'), { col: 'd1', index: 2 }));
});

test('drop indices exclude the dragged card when reordering', () => {
  withColumn(false, () => assert.deepEqual(hitTest(100, 400, 'a'), { col: 'd1', index: 1 }));
});
