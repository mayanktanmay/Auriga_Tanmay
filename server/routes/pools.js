import { Router } from 'express';
import { buildSummary, createSettlements } from '../utils/finance.js';
import { importContributions } from '../utils/importContributions.js';
import { createMember, createPool, createSettlement, findPool, touchPool } from '../store.js';

const router = Router();
const cleanName = (value) => typeof value === 'string' && value.trim().length > 0;
const validAmount = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
const getPool = async (req, res) => {
  const pool = findPool(req.params.poolId);
  if (!pool) { res.status(404).json({ message: 'Pool not found' }); return null; }
  return pool;
};

router.post('/', async (req, res, next) => {
  try {
    const { name, targetAmount, organizer } = req.body;
    if (!cleanName(name) || !cleanName(organizer) || !validAmount(targetAmount)) return res.status(400).json({ message: 'Name, organizer and a positive target amount are required' });
    const pool = createPool({ name: name.trim(), organizer: organizer.trim(), targetAmount: Number(targetAmount) });
    res.status(201).json(pool);
  } catch (error) {
    next(error);
  }
});

router.get('/:poolId', async (req, res) => {
  const pool = await getPool(req, res);
  if (pool) res.json(pool);
});

router.get('/:poolId/summary', async (req, res) => {
  const pool = await getPool(req, res);
  if (pool) res.json(buildSummary(pool));
});

router.post('/:poolId/import', async (req, res, next) => {
  try {
    const pool = await getPool(req, res);
    if (!pool) return;
    if (typeof req.body.text !== 'string' || !req.body.text.trim()) return res.status(400).json({ message: 'Paste at least one contribution row' });
    const report = importContributions(pool, req.body.text);
    if (!report.importedRows && !report.duplicateRows) return res.status(400).json({ message: 'No valid contribution rows were found', report });
    touchPool(pool);
    res.json({ report, summary: buildSummary(pool) });
  } catch (error) {
    next(error);
  }
});

router.post('/:poolId/members', async (req, res) => {
  const pool = await getPool(req, res);
  if (!pool) return;
  if (!cleanName(req.body.name)) return res.status(400).json({ message: 'Member name is required' });
  pool.members.push(createMember(req.body.name.trim()));
  pool.settlements = [];
  touchPool(pool);
  res.status(201).json(pool.members.at(-1));
});

router.put('/:poolId/members/:memberId', async (req, res) => {
  const pool = await getPool(req, res);
  if (!pool) return;
  const member = pool.members.find((item) => item._id === req.params.memberId);
  if (!member) return res.status(404).json({ message: 'Member not found' });
  if (!cleanName(req.body.name)) return res.status(400).json({ message: 'Member name is required' });
  member.name = req.body.name.trim();
  pool.settlements = [];
  touchPool(pool);
  res.json(member);
});

router.delete('/:poolId/members/:memberId', async (req, res) => {
  const pool = await getPool(req, res);
  if (!pool) return;
  const memberIndex = pool.members.findIndex((item) => item._id === req.params.memberId);
  const member = pool.members[memberIndex];
  if (!member) return res.status(404).json({ message: 'Member not found' });
  pool.members.splice(memberIndex, 1);
  pool.settlements = [];
  touchPool(pool);
  res.status(204).end();
});

router.put('/:poolId/members/:memberId/payment', async (req, res) => {
  const pool = await getPool(req, res);
  if (!pool) return;
  const member = pool.members.find((item) => item._id === req.params.memberId);
  if (!member) return res.status(404).json({ message: 'Member not found' });
  if (!Number.isFinite(Number(req.body.paid)) || Number(req.body.paid) < 0) return res.status(400).json({ message: 'Paid amount cannot be negative' });
  member.paid = Number(req.body.paid);
  pool.settlements = [];
  touchPool(pool);
  res.json(member);
});

router.get('/:poolId/settlement', async (req, res) => {
  const pool = await getPool(req, res);
  if (pool) res.json({ settlements: pool.settlements });
});

router.post('/:poolId/settlement', async (req, res) => {
  const pool = await getPool(req, res);
  if (!pool) return;
  const { settlements } = createSettlements(pool);
  pool.settlements = settlements.map(createSettlement);
  touchPool(pool);
  res.json({ settlements: pool.settlements });
});

router.patch('/:poolId/settlement/:settlementId', async (req, res) => {
  const pool = await getPool(req, res);
  if (!pool) return;
  const settlement = pool.settlements.find((item) => item._id === req.params.settlementId);
  if (!settlement) return res.status(404).json({ message: 'Settlement not found' });
  settlement.completed = Boolean(req.body.completed);
  touchPool(pool);
  res.json(settlement);
});

export default router;
