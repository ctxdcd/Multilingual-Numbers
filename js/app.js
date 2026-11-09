(function () {
  'use strict';
  const D = window.NUMBERS_DATA;
  const app = document.getElementById('app');
  const langBar = document.getElementById('lang-bar');
  const aboutDialog = document.getElementById('about');
  const STORE = 'numbers-lang';
  const STORE_SCRIPT = 'numbers-script';
  const NEXT_DELAY = 1200; // ms before the next question

  // ---------- state ----------
  const state = { lang: 'ja', script: 'kana', view: 'home', scaleId: null, value: null, session: null };
  try {
    const saved = localStorage.getItem(STORE);
    if (D.languages.some(function (l) { return l.code === saved; })) state.lang = saved;
  } catch (e) { /* storage unavailable: keep default (Japanese) */ }
  try {
    if (localStorage.getItem(STORE_SCRIPT) === 'kanji') state.script = 'kanji';
  } catch (e) {}

  // ---------- helpers ----------
  const langOf = function (code) { return D.languages.find(function (l) { return l.code === code; }); };
  const scaleOf = function (id) { return D.scales.find(function (s) { return s.id === id; }); };
  const attrs = function (l) { return 'lang="' + l.code + '" dir="' + l.dir + '"'; };

  // Chevron icon used by the round back buttons
  const BACK_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Kanji is the text before " (" in the Japanese 3rd field, e.g. "四 (よん is most common)" -> "四"
  function kanjiOf(w) { return w.a.split(' (')[0]; }
  // The word to show / practise (kanji only for Japanese in kanji mode)
  function textOf(L, v, script) {
    const w = L.words[v];
    return (L.code === 'ja' && script === 'kanji') ? kanjiOf(w) : w.w;
  }
  // The small line under the word
  function readingOf(L, v, script) {
    const w = L.words[v];
    return (L.code === 'ja' && script === 'kanji') ? w.w + ' · ' + w.r : w.r;
  }

  function shuffle(a) { // Fisher-Yates
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = r[i]; r[i] = r[j]; r[j] = t;
    }
    return r;
  }

  // ---------- selectors ----------
  function renderScriptBar() {
    const bar = document.getElementById('script-bar');
    if (!bar) return;
    if (state.lang !== 'ja') { bar.innerHTML = ''; return; }
    const locked = !!state.session;
    bar.innerHTML = [['kana', 'Hiragana'], ['kanji', 'Kanji']].map(function (o) {
      return '<button class="chip" role="radio" aria-checked="' + (state.script === o[0]) + '" data-action="script" data-code="' + o[0] + '"' + (locked ? ' disabled' : '') + '>' + o[1] + '</button>';
    }).join('');
  }

  function renderLangBar() {
    const locked = !!state.session; // language is fixed during practice
    langBar.innerHTML = D.languages.map(function (l) {
      return '<button class="chip" role="radio" aria-checked="' + (l.code === state.lang) + '" data-action="lang" data-code="' + l.code + '"' + (locked ? ' disabled' : '') + '>' + l.name + '</button>';
    }).join('');
    renderScriptBar();
  }

  // ---------- views ----------
  function renderHome() {
    app.innerHTML = '<div class="grid">' + D.scales.map(function (s) {
      return '<button class="card" data-action="scale" data-id="' + s.id + '"><span class="scale-title">' + s.title + '</span><span class="muted">' + s.values.length + ' numbers</span></button>';
    }).join('') + '</div>';
  }

  function renderList() {
    const s = scaleOf(state.scaleId), L = langOf(state.lang);
    app.innerHTML =
      '<button class="back" data-action="home" aria-label="All scales">' + BACK_ICON + '</button>' +
      '<div class="head"><h2>' + s.title + ' · ' + L.name + '</h2><button class="btn primary" data-action="practice-scale">Practise this scale</button></div>' +
      '<div class="grid small">' + s.values.map(function (v) {
        const rd = readingOf(L, v, state.script);
        return '<button class="card num" data-action="detail" data-value="' + v + '"><span class="num-val">' + D.label(v) + '</span><span class="num-word" ' + attrs(L) + '>' + textOf(L, v, state.script) + '</span>' + (rd ? '<span class="num-rom">' + rd + '</span>' : '') + '</button>';
      }).join('') + '</div>' +
      '<p class="note">' + L.note + '</p>';
  }

  function renderDetail() {
    const L = langOf(state.lang), v = state.value, w = L.words[v];
    const rd = readingOf(L, v, state.script);
    app.innerHTML =
      '<button class="back" data-action="back-list" aria-label="Back to ' + scaleOf(state.scaleId).title + '">' + BACK_ICON + '</button>' +
      '<div class="card detail"><div class="big-val">' + D.label(v) + '</div>' +
      '<div class="big-word" ' + attrs(L) + '>' + textOf(L, v, state.script) + '</div>' +
      (rd ? '<div class="rom">' + rd + '</div>' : '') +
      (w.a ? '<div class="alt" ' + (L.code === 'ar' ? attrs(L) : '') + '>' + w.a + '</div>' : '') +
      '<div class="actions"><button class="btn primary" data-action="practice-number">Practise this number</button></div></div>' +
      '<p class="note">' + L.note + '</p>';
  }

  // ---------- recognition practice ----------
  function startSession(scope) {
    const s = scope.type === 'scale' ? scaleOf(scope.scaleId) : null;
    state.session = {
      lang: state.lang,                       // language, script and scope are locked for this session
      script: state.script,
      scope: scope,
      pool: s ? s.values : [scope.value],     // values that can be asked
      distractorPool: s ? s.values : D.allValues,
      title: s ? s.title : D.label(scope.value),
      correct: 0, wrong: 0, last: null, q: null, locked: false, timer: null
    };
    state.view = 'practice';
    nextQuestion();
    renderLangBar();
    renderPractice();
  }

  function nextQuestion() {
    const s = state.session, L = langOf(s.lang);
    const candidates = s.pool.length > 1 ? s.pool.filter(function (v) { return v !== s.last; }) : s.pool;
    const value = candidates[Math.floor(Math.random() * candidates.length)];
    const correctText = textOf(L, value, s.script);

    // three distractors: different numbers AND different words
    const seen = new Set([correctText]);
    const wrong = [];
    shuffle(s.distractorPool.filter(function (v) { return v !== value; })).forEach(function (v) {
      const t = textOf(L, v, s.script);
      if (wrong.length < 3 && !seen.has(t)) { seen.add(t); wrong.push({ value: v, text: t }); }
    });

    s.last = value;
    s.locked = false;
    // shuffle so the correct answer lands in a random slot; correctness is decided by value, not position
    s.q = { value: value, options: shuffle([{ value: value, text: correctText }].concat(wrong)) };
  }

  function renderPractice() {
    const s = state.session, L = langOf(s.lang), q = s.q;
    app.innerHTML =
      '<div class="bar"><button class="back" data-action="exit" aria-label="Exit practice">' + BACK_ICON + '</button><span class="muted">' + L.name + ' · ' + s.title + '</span></div>' +
      '<div class="counters" aria-live="polite"><div class="card counter"><span>True</span><strong id="c-true">' + s.correct + '</strong></div><div class="card counter"><span>False</span><strong id="c-false">' + s.wrong + '</strong></div></div>' +
      '<h2 class="question">What is ' + D.label(q.value) + ' in ' + L.name + '?</h2>' +
      '<div class="answers">' + q.options.map(function (o, i) {
        return '<button class="answer" data-action="answer" data-i="' + i + '"><span class="letter">' + 'ABCD'[i] + '</span><span class="answer-text" ' + attrs(L) + '>' + o.text + '</span></button>';
      }).join('') + '</div>';
  }

  function answer(i) {
    const s = state.session;
    if (!s || s.locked) return;          // only one answer per question
    s.locked = true;
    const chosen = s.q.options[i], ok = chosen.value === s.q.value;
    if (ok) s.correct++; else s.wrong++;
    document.getElementById('c-true').textContent = s.correct;
    document.getElementById('c-false').textContent = s.wrong;
    document.querySelectorAll('.answer').forEach(function (btn, idx) {
      const isCorrect = s.q.options[idx].value === s.q.value;
      btn.disabled = true;
      if (isCorrect) btn.classList.add('correct');
      else if (idx === i) btn.classList.add('wrong');
      else btn.classList.add('dim');
    });
    s.timer = setTimeout(function () {
      if (state.session !== s) return;  // session was exited meanwhile
      nextQuestion();
      renderPractice();
    }, NEXT_DELAY);
  }

  function exitPractice() {
    clearTimeout(state.session.timer);
    const wasNumber = state.session.scope.type === 'number';
    state.session = null;
    state.view = wasNumber ? 'detail' : 'list';
    render();
  }

  // ---------- routing ----------
  function render() {
    renderLangBar();
    if (state.view === 'home') renderHome();
    else if (state.view === 'list') renderList();
    else if (state.view === 'detail') renderDetail();
    else renderPractice();
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    switch (el.dataset.action) {
      case 'lang':
        if (state.session) return;
        state.lang = el.dataset.code;
        try { localStorage.setItem(STORE, state.lang); } catch (err) {}
        render(); break;
      case 'script':
        if (state.session) return;
        state.script = el.dataset.code;
        try { localStorage.setItem(STORE_SCRIPT, state.script); } catch (err) {}
        render(); break;
      case 'home': state.view = 'home'; render(); break;
      case 'scale': state.scaleId = el.dataset.id; state.view = 'list'; render(); break;
      case 'back-list': state.view = 'list'; render(); break;
      case 'detail': state.value = Number(el.dataset.value); state.view = 'detail'; render(); break;
      case 'practice-scale': startSession({ type: 'scale', scaleId: state.scaleId }); break;
      case 'practice-number': startSession({ type: 'number', value: state.value }); break;
      case 'answer': answer(Number(el.dataset.i)); break;
      case 'about': aboutDialog.showModal(); break;
      case 'close-about': aboutDialog.close(); break;
      case 'exit': exitPractice(); break;
    }
  });

  // Clicking the dark area outside the popup closes it
  aboutDialog.addEventListener('click', function (e) {
    if (e.target === aboutDialog) aboutDialog.close();
  });

  render();
})();