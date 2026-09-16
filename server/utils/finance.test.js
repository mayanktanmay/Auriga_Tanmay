import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSummary, createSettlements } from './finance.js';

const pool = { targetAmount: 900, members: [
  { _id: 'a', name: 'Rahul', paid: 0 },
  { _id: 'b', name: 'Aman', paid: 600 },
  { _id: 'c', name: 'Neha', paid: 300 }
] };

test('buildSummary calculates equal share and balances', () => {
  const summary = buildSummary(pool);
  assert.equal(summary.equalShare, 300);
  assert.equal(summary.totalCollected, 900);
  assert.equal(summary.members[0].balance, -300);
  assert.equal(summary.members[1].balance, 300);
});

test('createSettlements matches debtors to creditors', () => {
  const result = createSettlements(pool);
  assert.deepEqual(result.settlements, [{ from: 'Rahul', to: 'Aman', amount: 300, completed: false }]);
});
