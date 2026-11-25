(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CardLogic = factory();
})(this, function () {
  'use strict';
  // Leitner boxes: a correct answer moves the card up one box, a wrong one sends it back to box 1.
  var INTERVALS = [1, 2, 4, 8, 16]; // days until next review for box 1..5
  var MAX_BOX = INTERVALS.length;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(key, n) {
    var p = key.split('-').map(Number);
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n));
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  function newCard(front, back, today, id) {
    return { id: id || String(Date.now()) + Math.random().toString(36).slice(2, 6),
             front: String(front).trim(), back: String(back).trim(), box: 1, due: today };
  }

  function review(card, correct, today) {
    var box = correct ? Math.min(card.box + 1, MAX_BOX) : 1;
    return { id: card.id, front: card.front, back: card.back, box: box, due: addDays(today, INTERVALS[box - 1]) };
  }

  function dueCards(cards, today) {
    return cards.filter(function (c) { return c.due <= today; })
      .sort(function (a, b) { return a.due < b.due ? -1 : a.due > b.due ? 1 : a.box - b.box; });
  }

  function boxCounts(cards) {
    var out = [0, 0, 0, 0, 0];
    cards.forEach(function (c) { out[c.box - 1]++; });
    return out;
  }

  // Number of consecutive days (ending today, or yesterday if nothing reviewed yet today) with at least one review.
  function streak(days, today) {
    var set = {};
    days.forEach(function (d) { set[d] = true; });
    var cur = set[today] ? today : addDays(today, -1), n = 0;
    while (set[cur]) { n++; cur = addDays(cur, -1); }
    return n;
  }

  function splitLine(line, sep) {
    var out = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === sep) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  }

  // CSV or TSV, two columns: front, back. A header row "front,back" is skipped. Quoted fields allowed.
  function parseCSV(text) {
    var lines = String(text).replace(/^\uFEFF/, '').split(/\r?\n/).filter(function (l) { return l.trim(); });
    var rows = [];
    lines.forEach(function (l) {
      var sep = l.indexOf('\t') >= 0 ? '\t' : ',';
      var f = splitLine(l, sep);
      if (f.length >= 2 && f[0].trim() && f[1].trim()) rows.push([f[0].trim(), f.slice(1).join(sep).trim()]);
    });
    if (rows.length && /^(front|question|term|الوجه|السؤال)$/i.test(rows[0][0]) ) rows.shift();
    return rows;
  }

  function toCSV(cards) {
    function q(s) { return '"' + String(s).replace(/"/g, '""') + '"'; }
    return 'front,back\n' + cards.map(function (c) { return q(c.front) + ',' + q(c.back); }).join('\n') + '\n';
  }

  return { INTERVALS: INTERVALS, dateKey: dateKey, addDays: addDays, newCard: newCard, review: review,
           dueCards: dueCards, boxCounts: boxCounts, streak: streak, parseCSV: parseCSV, toCSV: toCSV };
});
