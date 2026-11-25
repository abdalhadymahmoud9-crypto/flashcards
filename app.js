(function () {
  'use strict';
  var L = window.CardLogic;
  var KEY = 'flashcards-v1';
  var $ = function (id) { return document.getElementById(id); };
  var SAMPLE = [['persuade', 'يقنع'], ['achieve', 'يحقق'], ['environment', 'البيئة'], ['benefit', 'فايدة'], ['decrease', 'يقل'],
    ['improve', 'يحسّن'], ['avoid', 'يتجنب'], ['increase', 'يزيد'], ['reduce', 'يقلل'], ['require', 'يتطلب']];
  var state = load(), queue = [], shown = false;

  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.cards)) return { cards: s.cards, days: s.days || [] }; } catch (e) {}
    return { cards: [], days: [] };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function today() { return L.dateKey(new Date()); }

  function buildQueue() { queue = L.dueCards(state.cards, today()); shown = false; }

  function renderStats() {
    $('s-due').textContent = L.dueCards(state.cards, today()).length;
    $('s-total').textContent = state.cards.length;
    $('s-streak').textContent = L.streak(state.days, today());
  }

  function renderReview() {
    var empty = !queue.length;
    $('review-empty').hidden = !empty; $('review-live').hidden = empty;
    if (empty) {
      var upcoming = state.cards.filter(function (c) { return c.due > today(); }).map(function (c) { return c.due; }).sort()[0];
      $('empty-note').textContent = !state.cards.length ? 'ضيف بطاقات من تبويب «إضافة»، أو حمّل المجموعة التجريبية.'
        : 'أقرب مراجعة جاية: ' + upcoming + '.';
      return;
    }
    var c = queue[0];
    $('progress').textContent = 'باقي ' + queue.length + ' بطاقة · صندوق ' + c.box;
    $('front').textContent = c.front;
    $('ans').textContent = c.back; $('ans').hidden = !shown;
    $('side').textContent = shown ? 'الإجابة' : 'السؤال';
    $('answers').hidden = !shown;
  }

  function answer(ok) {
    if (!queue.length || !shown) return;
    var c = queue.shift(), t = today();
    var i = state.cards.findIndex(function (x) { return x.id === c.id; });
    state.cards[i] = L.review(c, ok, t);
    if (state.days.indexOf(t) < 0) state.days.push(t);
    if (!ok) { queue.push(state.cards[i]); queue[queue.length - 1].due = t; } // missed cards come back this session
    shown = false; save(); renderAll();
  }

  function renderCards() {
    var q = $('q').value.trim().toLowerCase();
    var counts = L.boxCounts(state.cards), max = Math.max.apply(null, counts.concat([1]));
    $('boxes').innerHTML = counts.map(function (n) { return '<div style="height:' + Math.max(6, n / max * 100) + '%"><span>' + n + '</span></div>'; }).join('');
    var list = $('list'); list.innerHTML = '';
    state.cards.filter(function (c) { return !q || (c.front + ' ' + c.back).toLowerCase().indexOf(q) >= 0; }).forEach(function (c) {
      var d = document.createElement('div'); d.className = 'item';
      var t = document.createElement('div'); t.className = 't';
      var b = document.createElement('b'); b.textContent = c.front;
      var s = document.createElement('span'); s.textContent = c.back;
      t.appendChild(b); t.appendChild(s);
      var bd = document.createElement('span'); bd.className = 'badge'; bd.textContent = 'صندوق ' + c.box + ' · ' + c.due;
      var del = document.createElement('button'); del.className = 'danger'; del.textContent = 'حذف'; del.setAttribute('aria-label', 'حذف ' + c.front);
      del.onclick = function () { state.cards = state.cards.filter(function (x) { return x.id !== c.id; }); save(); buildQueue(); renderAll(); };
      d.appendChild(t); d.appendChild(bd); d.appendChild(del); list.appendChild(d);
    });
    if (!list.children.length) list.innerHTML = '<p class="muted">مفيش بطاقات.</p>';
  }

  function renderAll() { renderStats(); renderReview(); renderCards(); }

  function addCards(rows) {
    var t = today(), n = 0, seen = {};
    state.cards.forEach(function (c) { seen[c.front + '\u0000' + c.back] = 1; });
    rows.forEach(function (r) {
      if (seen[r[0] + '\u0000' + r[1]]) return;
      seen[r[0] + '\u0000' + r[1]] = 1;
      state.cards.push(L.newCard(r[0], r[1], t, String(Date.now()) + '-' + (n++) + Math.random().toString(36).slice(2, 5)));
    });
    save(); buildQueue(); renderAll();
    return n;
  }

  function tab(name) {
    ['review', 'cards', 'add'].forEach(function (k) { $('pane-' + k).hidden = k !== name; $('tab-' + k).classList.toggle('on', k === name); });
  }
  ['review', 'cards', 'add'].forEach(function (k) { $('tab-' + k).onclick = function () { tab(k); }; });

  function reveal() { if (queue.length && !shown) { shown = true; renderReview(); } }
  $('flash').onclick = reveal;
  $('btn-yes').onclick = function () { answer(true); };
  $('btn-no').onclick = function () { answer(false); };
  document.addEventListener('keydown', function (e) {
    if ($('pane-review').hidden || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); reveal(); }
    else if (e.key === '1') answer(true); else if (e.key === '2') answer(false);
  });

  $('add').onclick = function () {
    var f = $('f-front').value.trim(), b = $('f-back').value.trim();
    if (!f || !b) { $('add-msg').textContent = 'اكتب السؤال والإجابة الأول.'; return; }
    var n = addCards([[f, b]]);
    $('add-msg').textContent = n ? 'اتضافت ✓' : 'البطاقة دي موجودة قبل كده.';
    $('f-front').value = ''; $('f-back').value = ''; $('f-front').focus();
  };
  $('import').onclick = function () {
    var rows = L.parseCSV($('paste').value), n = addCards(rows);
    $('imp-msg').textContent = rows.length ? 'اتضاف ' + n + ' من ' + rows.length + (n < rows.length ? ' (الباقي مكرر)' : '') : 'مالقيتش أسطر صالحة. لازم عمودين.';
    if (n) $('paste').value = '';
  };
  $('file').onchange = function (e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader(); r.onload = function () { $('paste').value = String(r.result); }; r.readAsText(f, 'utf-8');
  };
  $('sample').onclick = function () { var n = addCards(SAMPLE); $('imp-msg').textContent = n ? 'اتضاف ' + n + ' كلمة.' : 'المجموعة دي محمّلة قبل كده.'; };
  $('wipe').onclick = function () { if (confirm('تمسح كل البطاقات وسجل الأيام؟')) { state = { cards: [], days: [] }; save(); buildQueue(); renderAll(); } };
  $('q').oninput = renderCards;
  $('export').onclick = function () {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([L.toCSV(state.cards)], { type: 'text/csv;charset=utf-8' }));
    a.download = 'flashcards.csv'; a.click();
  };

  buildQueue(); renderAll();
})();
