const cents = (value) => Math.round(value * 100);
const money = (value) => Math.round(value * 100) / 100;

export function buildSummary(pool) {
  const totalCollected = money(pool.members.reduce((sum, member) => sum + member.paid, 0));
  const equalShare = pool.members.length ? money(pool.targetAmount / pool.members.length) : 0;
  const members = pool.members.map((member) => ({
    id: member._id,
    name: member.name,
    paid: money(member.paid),
    balance: money(member.paid - equalShare)
  }));
  return {
    targetAmount: money(pool.targetAmount),
    totalCollected,
    remainingAmount: money(Math.max(pool.targetAmount - totalCollected, 0)),
    collectionPercentage: pool.targetAmount ? money((totalCollected / pool.targetAmount) * 100) : 0,
    equalShare,
    members
  };
}

export function createSettlements(pool) {
  const { equalShare, members } = buildSummary(pool);
  const creditors = members.filter((member) => member.balance > 0.009).map((member) => ({ ...member, cents: cents(member.balance) }));
  const debtors = members.filter((member) => member.balance < -0.009).map((member) => ({ ...member, cents: cents(-member.balance) }));
  const settlements = [];
  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const amount = Math.min(debtors[debtorIndex].cents, creditors[creditorIndex].cents);
    settlements.push({ from: debtors[debtorIndex].name, to: creditors[creditorIndex].name, amount: money(amount / 100), completed: false });
    debtors[debtorIndex].cents -= amount;
    creditors[creditorIndex].cents -= amount;
    if (debtors[debtorIndex].cents === 0) debtorIndex += 1;
    if (creditors[creditorIndex].cents === 0) creditorIndex += 1;
  }
  return { equalShare, settlements };
}
