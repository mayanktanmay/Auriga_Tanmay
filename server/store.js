import { randomUUID } from 'node:crypto';

const pools = [];

export function createPool({ name, targetAmount, organizer }) {
  const pool = {
    _id: randomUUID(),
    name,
    targetAmount,
    organizer,
    members: [],
    settlements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  pools.push(pool);
  return pool;
}

export function findPool(poolId) {
  return pools.find((pool) => pool._id === poolId);
}

export function createMember(name) {
  return { _id: randomUUID(), name, paid: 0 };
}

export function createSettlement(settlement) {
  return { _id: randomUUID(), ...settlement };
}

export function touchPool(pool) {
  pool.updatedAt = new Date().toISOString();
  return pool;
}

export function resetStore() {
  pools.length = 0;
}

export { pools };
