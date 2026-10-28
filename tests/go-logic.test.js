import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateBatch, calculateCredit, calculateShipping, isSecured } from '../lib/go-logic.js';

test('set becomes secured at the configured two-thirds threshold', () => {
  assert.equal(isSecured(2, 3, 2 / 3), true);
  assert.equal(isSecured(1, 3, 2 / 3), false);
});

test('batch allocation fills fixed batches first', () => {
  assert.deepEqual(allocateBatch(1, 2), { batch: 1, slot: 2, nextTotal: 2, batchComplete: true });
  assert.deepEqual(allocateBatch(2, 2), { batch: 2, slot: 1, nextTotal: 3, batchComplete: false });
});

test('overpayments become credit instead of disappearing', () => {
  assert.deepEqual(calculateCredit(70, 50, 0), { applied: 50, credit: 20, remaining: 0 });
  assert.deepEqual(calculateCredit(20, 50, 10), { applied: 30, credit: 0, remaining: 20 });
});

test('shipping calculator handles stamped and tracked NZ rates', () => {
  assert.equal(calculateShipping({ method: 'stamped', packages: 1, weightGrams: 250 }), 4.5);
  assert.equal(calculateShipping({ method: 'tracked', packages: 2, weightGrams: 750 }), 20.5);
});
