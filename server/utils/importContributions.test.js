import test from 'node:test';
import assert from 'node:assert/strict';
import { importContributions } from './importContributions.js';

 test('imports messy contributions, removes duplicates, merges names, and rejects invalid rows', () => {
  const pool = { members: [{ name: 'Rahul', paid: 0 }], settlements: [] };
  const report = importContributions(pool, `name,amount\nRahul, ₹1,000\nrahul,1000\nRAHUL,500\nAman, Rs. 750\n,300\nNeha,-50\nBad,not money`);
  assert.equal(report.totalRows, 7);
  assert.equal(report.importedRows, 3);
  assert.equal(report.duplicateRows, 1);
  assert.equal(report.rejectedRows, 3);
  assert.equal(report.importedAmount, 2250);
  assert.equal(pool.members.length, 2);
  assert.equal(pool.members[0].paid, 1500);
  assert.equal(pool.members[1].name, 'Aman');
  assert.equal(pool.members[1].paid, 750);
});
