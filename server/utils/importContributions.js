import { randomUUID } from 'node:crypto';

const money = (value) => Math.round(value * 100) / 100;
const cents = (value) => Math.round(value * 100);

export function normalizeName(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function distance(left, right) {
  const matrix = Array.from({ length: left.length + 1 }, (_, row) => [row]);
  for (let column = 0; column <= right.length; column += 1) matrix[0][column] = column;
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
      );
    }
  }
  return matrix[left.length][right.length];
}

function namesMatch(left, right) {
  if (left === right) return true;
  if (left.length < 4 || right.length < 4) return false;
  return distance(left, right) <= 1;
}

function parseAmount(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim().replace(/^(rs\.?|inr)\s*/i, '').replace(/[₹$€£,\s]/g, '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const amount = Number(text);
  return Number.isFinite(amount) && amount > 0 ? money(amount) : null;
}

function parseRow(raw, lineNumber) {
  const text = String(raw);
  const delimiter = text.includes(';') ? ';' : text.includes('\t') ? '\t' : ',';
  const separatorIndex = text.indexOf(delimiter);
  if (separatorIndex < 0) return { rejected: { line: lineNumber, raw: text, reason: 'Expected name and amount separated by a comma' } };
  const name = text.slice(0, separatorIndex).replace(/^['"]|['"]$/g, '').trim();
  const amount = parseAmount(text.slice(separatorIndex + 1).replace(/^['"]|['"]$/g, '').trim());
  if (!name) return { rejected: { line: lineNumber, raw: String(raw), reason: 'Name is empty' } };
  if (!amount) return { rejected: { line: lineNumber, raw: String(raw), reason: 'Amount must be a positive number' } };
  return { name, amount };
}

export function parseContributionText(text) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.flatMap((line, index) => {
    if (index === 0 && /^name\s*[,;\t]\s*(amount|paid)/i.test(line)) return [];
    return [parseRow(line, index + 1)];
  });
}

function findMember(members, canonicalName) {
  return members.find((member) => namesMatch(normalizeName(member.name), canonicalName));
}

export function importContributions(pool, text) {
  const parsedRows = parseContributionText(text);
  const report = {
    totalRows: parsedRows.length,
    importedRows: 0,
    importedAmount: 0,
    duplicateRows: 0,
    duplicates: [],
    mergedNames: [],
    rejectedRows: 0,
    rejected: []
  };
  const seenRows = new Set();
  const accepted = [];

  parsedRows.forEach((row) => {
    if (row.rejected) {
      report.rejectedRows += 1;
      report.rejected.push(row.rejected);
      return;
    }
    const canonicalName = normalizeName(row.name);
    const duplicateKey = `${canonicalName}:${cents(row.amount)}`;
    if (seenRows.has(duplicateKey)) {
      report.duplicateRows += 1;
      report.duplicates.push({ name: row.name, amount: row.amount });
      return;
    }
    seenRows.add(duplicateKey);
    accepted.push({ ...row, canonicalName });
  });

  accepted.forEach((row) => {
    let member = findMember(pool.members, row.canonicalName);
    if (!member) {
      pool.members.push({ _id: randomUUID(), name: row.name, paid: 0 });
      member = pool.members[pool.members.length - 1];
    } else if (normalizeName(member.name) !== row.canonicalName && !report.mergedNames.some((merge) => merge.from === row.name && merge.to === member.name)) {
      report.mergedNames.push({ from: row.name, to: member.name });
    }
    member.paid = money(member.paid + row.amount);
    report.importedRows += 1;
    report.importedAmount = money(report.importedAmount + row.amount);
  });

  pool.settlements = [];
  return report;
}
