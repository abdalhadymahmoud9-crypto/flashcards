const test = require('node:test');
const assert = require('node:assert');
const L = require('./logic.js');

test('addDays crosses month and year boundaries', () => {
  assert.strictEqual(L.addDays('2026-12-31', 1), '2027-01-01');
  assert.strictEqual(L.addDays('2026-03-01', -1), '2026-02-28');
});
test('correct answers climb boxes and push the due date out', () => {
  let c = L.newCard('a', 'b', '2026-11-25', 'x');
  c = L.review(c, true, '2026-11-25');
  assert.strictEqual(c.box, 2); assert.strictEqual(c.due, '2026-11-27');
  c = L.review(c, true, '2026-11-27');
  assert.strictEqual(c.box, 3); assert.strictEqual(c.due, '2026-12-01');
});
test('box never exceeds 5 and a miss resets to box 1', () => {
  let c = { id: 'x', front: 'a', back: 'b', box: 5, due: '2026-01-01' };
  assert.strictEqual(L.review(c, true, '2026-01-01').box, 5);
  const m = L.review(c, false, '2026-01-01');
  assert.strictEqual(m.box, 1); assert.strictEqual(m.due, '2026-01-02');
});
test('dueCards returns only cards due today or earlier, oldest first', () => {
  const cards = [
    { id: 1, box: 1, due: '2026-11-26' }, { id: 2, box: 2, due: '2026-11-24' }, { id: 3, box: 1, due: '2026-11-25' }];
  assert.deepStrictEqual(L.dueCards(cards, '2026-11-25').map(c => c.id), [2, 3]);
});
test('streak counts consecutive days and tolerates not having reviewed yet today', () => {
  assert.strictEqual(L.streak(['2026-11-23', '2026-11-24', '2026-11-25'], '2026-11-25'), 3);
  assert.strictEqual(L.streak(['2026-11-23', '2026-11-24'], '2026-11-25'), 2);
  assert.strictEqual(L.streak(['2026-11-20'], '2026-11-25'), 0);
});
test('parseCSV handles header, quotes, commas in answers and tabs', () => {
  const rows = L.parseCSV('front,back\n"hello, world",مرحبا\nافتح\topen\n,empty\n');
  assert.deepStrictEqual(rows, [['hello, world', 'مرحبا'], ['افتح', 'open']]);
});
test('toCSV round-trips through parseCSV', () => {
  const cards = [{ front: 'a "q"', back: 'b, c' }];
  assert.deepStrictEqual(L.parseCSV(L.toCSV(cards)), [['a "q"', 'b, c']]);
});
test('boxCounts tallies cards per box', () => {
  assert.deepStrictEqual(L.boxCounts([{ box: 1 }, { box: 1 }, { box: 3 }]), [2, 0, 1, 0, 0]);
});
