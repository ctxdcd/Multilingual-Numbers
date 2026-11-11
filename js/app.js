(function () {
  'use strict';
  const D = window.NUMBERS_DATA;
  const app = document.getElementById('app');
  const langBar = document.getElementById('lang-bar');
  const aboutDialog = document.getElementById('about');
  const STORE = 'numbers-lang';
  const STORE_SCRIPT = 'numbers-script';
  const NEXT_DELAY = 1200; // ms before the next question
  const TYPING_FEEDBACK_MS = 2000; // typing mode: how long Bingo! / Close, but nope. stays before the next question

  // ---------- state ----------
  const state = { lang: 'ja', script: 'kana', view: 'home', scaleId: null, value: null, session: null, pending: null };
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

  // ---------- typing-mode answer checking ----------
  // Normalise for comparison only: Unicode NFC, strip invisible direction marks, collapse
  // whitespace, trim, and lowercase. Accents and diacritics are never removed.
  // `locale` lets Turkish use its own I/ı and İ/i rules.
  function normalizeAnswer(str, locale) {
    let t = String(str).normalize('NFC')
      .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
      .replace(/\s+/g, ' ').trim();
    try { t = t.toLocaleLowerCase(locale); } catch (e) { t = t.toLowerCase(); }
    return t.normalize('NFC');
  }
  // Arabic short-vowel marks and tatweel are optional when typing (e.g. ألفًا vs ألفا)
  function foldArabic(t) { return t.replace(/[\u0640\u064B-\u065F\u0670]/g, ''); }

  // Everything accepted for a value, taken from the existing data only:
  //  - the displayed word, and each part of "a / b" alternatives (e.g. なな / しち)
  //  - "also X" / "also written X" notes in the data's 3rd field (e.g. hundert / einhundert)
  function acceptedAnswers(L, v, script) {
    const w = L.words[v], main = textOf(L, v, script);
    const out = [main];
    main.split('/').forEach(function (p) { out.push(p); });
    if (L.code !== 'ja' && w.a) {
      const m = w.a.match(/^also (?:written )?(.+)$/i);
      if (m) { out.push(m[1]); m[1].split('/').forEach(function (p) { out.push(p); }); }
    }
    return out.map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function isCorrectTyped(typed, accepted, code) {
    // Turkish is checked with Turkish casing and with standard casing, so "YEDI" typed on a
    // non-Turkish keyboard (plain capital I) still matches, while "sifir" still does not match "sıfır".
    const locales = code === 'tr' ? ['tr', 'en'] : [code];
    return locales.some(function (loc) {
      const t = normalizeAnswer(typed, loc);
      return accepted.some(function (a) {
        const n = normalizeAnswer(a, loc);
        return t === n || (code === 'ar' && foldArabic(t) === foldArabic(n));
      });
    });
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

  // ---------- mode selection ----------
  function renderModeSelect() {
    const p = state.pending, L = langOf(state.lang);
    const title = p.type === 'scale' ? scaleOf(p.scaleId).title : D.label(p.value);
    app.innerHTML =
      '<button class="back" data-action="mode-back" aria-label="Back">' + BACK_ICON + '</button>' +
      '<div class="head"><h2>Choose a mode</h2><span class="muted">' + L.name + ' · ' + title + '</span></div>' +
      '<div class="grid">' +
        '<button class="card" data-action="start-mode" data-mode="choice"><span class="scale-title">Multiple Choice</span><span class="muted">Pick the right answer from four options.</span></button>' +
        '<button class="card" data-action="start-mode" data-mode="typing"><span class="scale-title">Typing Mode</span><span class="muted">Type the written form yourself.</span></button>' +
      '</div>';
  }

  // ---------- recognition practice ----------
  function startSession(scope, mode) {
    const s = scope.type === 'scale' ? scaleOf(scope.scaleId) : null;
    state.session = {
      mode: mode === 'typing' ? 'typing' : 'choice',
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

    if (s.mode === 'typing') {            // no distractors needed: the answer is typed
      s.last = value;
      s.locked = false;
      s.q = { value: value, expected: correctText, accepted: acceptedAnswers(L, value, s.script) };
      return;
    }

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
    if (state.session.mode === 'typing') renderTyping(); else renderChoice();
  }

  function renderChoice() {
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
    showToast(ok, NEXT_DELAY);          // Bingo! / Close, but nope. for the moment before the next question
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

  // ---------- typing practice ----------
  function renderTyping() {
    const s = state.session, L = langOf(s.lang);
    const hint = L.code === 'ja' ? (s.script === 'kanji' ? 'Type in kanji' : 'Type in hiragana') : 'Type the ' + L.name + ' word';
    app.innerHTML =
      '<div class="bar"><button class="back" data-action="exit" aria-label="Exit practice">' + BACK_ICON + '</button><span class="muted">' + L.name + ' · ' + s.title + '</span></div>' +
      '<div class="counters" aria-live="polite"><div class="card counter"><span>True</span><strong id="c-true">' + s.correct + '</strong></div><div class="card counter"><span>False</span><strong id="c-false">' + s.wrong + '</strong></div></div>' +
      '<h2 class="question" id="t-question"></h2>' +
      '<form class="typing" id="t-form" action="javascript:void(0)" novalidate>' +
        '<input id="t-input" class="type-input" type="text" ' + attrs(L) + ' placeholder="' + hint + '" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="send" aria-label="Your answer">' +
      '</form>';
    showTypingQuestion();
  }

  // Updates the question in place (no full re-render) so the input and keyboard stay ready
  function showTypingQuestion() {
    const s = state.session, L = langOf(s.lang);
    const input = document.getElementById('t-input');
    document.getElementById('t-question').textContent = 'What is ' + D.label(s.q.value) + ' in ' + L.name + '?';
    input.value = '';
    input.readOnly = false;
    input.className = 'type-input';
    if (!s.kbOff) input.focus();   // keep the keyboard up unless the user dismissed it on purpose
  }

  function submitTyping() {
    const s = state.session;
    if (!s || s.mode !== 'typing' || s.locked) return;   // one submission per question
    const input = document.getElementById('t-input');
    if (!input.value.trim()) { input.focus(); return; }  // empty input is not an answer
    s.locked = true;
    s.lockedAt = Date.now();
    const L = langOf(s.lang), v = s.q.value, w = L.words[v];
    const ok = isCorrectTyped(input.value, s.q.accepted, s.lang);
    if (ok) s.correct++; else s.wrong++;
    document.getElementById('c-true').textContent = s.correct;
    document.getElementById('c-false').textContent = s.wrong;
    s.lockedValue = input.value;   // frozen via input guards below (readOnly would close the mobile keyboard)
    input.classList.add(ok ? 'correct' : 'wrong');
    showToast(ok);
    if (document.activeElement !== input && !s.kbOff) input.focus();   // keep the keyboard up
    s.timer = setTimeout(function () {
      if (state.session !== s) return;   // session was exited meanwhile
      advanceTyping();
    }, TYPING_FEEDBACK_MS);
  }

  // Floating "Bingo!" / "Close, but nope." message (typing and multiple choice). It fades itself
  // out via CSS in `ms`: the same time the next question waits for.
  function showToast(ok, ms) {
    let t = document.getElementById('t-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 't-toast';
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.className = 'toast';
    t.textContent = ok ? 'Bingo!' : 'Close, but nope.';
    t.style.animationDuration = (ms || TYPING_FEEDBACK_MS) + 'ms';
    void t.offsetWidth;                                   // restart the animation
    t.className = 'toast ' + (ok ? 'ok' : 'bad') + ' show';
  }
  function hideToast() {
    const t = document.getElementById('t-toast');
    if (t) t.className = 'toast';
  }

  function advanceTyping() {
    const s = state.session;
    if (!s || s.mode !== 'typing' || !s.locked) return;
    nextQuestion();
    showTypingQuestion();
  }

  function exitPractice() {
    clearTimeout(state.session.timer);
    hideToast();
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
    else if (state.view === 'mode') renderModeSelect();
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
      case 'practice-scale': state.pending = { type: 'scale', scaleId: state.scaleId }; state.view = 'mode'; render(); break;
      case 'practice-number': state.pending = { type: 'number', value: state.value }; state.view = 'mode'; render(); break;
      case 'mode-back': state.view = state.pending && state.pending.type === 'number' ? 'detail' : 'list'; render(); break;
      case 'start-mode': startSession(state.pending, el.dataset.mode); break;
      case 'answer': answer(Number(el.dataset.i)); break;
      case 'about': aboutDialog.showModal(); break;
      case 'close-about': aboutDialog.close(); break;
      case 'exit': exitPractice(); break;
    }
  });

  // Typing mode: Enter submits (the next question follows automatically). Ignored while an IME
  // (Japanese, etc.) is composing, and on other focused controls so Enter still
  // activates the exit / back buttons.
  document.addEventListener('keydown', function (e) {
    const s = state.session;
    if (!s || s.mode !== 'typing' || e.key !== 'Enter' || e.isComposing || e.keyCode === 229 || e.repeat) return;
    if (aboutDialog.open) return;
    const onInput = e.target && e.target.id === 't-input';
    if (!onInput && !(s.locked && e.target === document.body)) return;
    e.preventDefault();
    if (!s.locked) submitTyping();
  });

  // Typing mode keyboard handling. Pressing anything inside the typing area
  // must not take focus from the input; only tapping an empty area dismisses the keyboard.
  function typingActive() { const s = state.session; return !!s && s.mode === 'typing' && !aboutDialog.open; }
  document.addEventListener('mousedown', function (e) {
    if (typingActive() && e.target.closest('.typing') && e.target.id !== 't-input') e.preventDefault();
  });
  document.addEventListener('click', function (e) {
    if (!typingActive() || e.target.closest('.typing, button, a, dialog, [data-action]')) return;
    state.session.kbOff = true;                         // deliberate dismissal: don't pop it back up
    const input = document.getElementById('t-input');
    if (input) input.blur();
  });
  // Enter on a computer, or the Go / Send key on a phone, submits the answer
  document.addEventListener('submit', function (e) {
    if (e.target && e.target.id === 't-form') { e.preventDefault(); submitTyping(); }
  });
  document.addEventListener('focusin', function (e) {
    if (state.session && e.target && e.target.id === 't-input') state.session.kbOff = false;
  });
  // While Bingo! / Close, but nope. is showing, the submitted answer stays as it was
  function typingFrozen(e) { const s = state.session; return !!s && s.mode === 'typing' && s.locked && e.target && e.target.id === 't-input'; }
  document.addEventListener('beforeinput', function (e) { if (typingFrozen(e) && e.cancelable) e.preventDefault(); });
  document.addEventListener('input', function (e) { if (typingFrozen(e)) e.target.value = state.session.lockedValue; });

  // Clicking the dark area outside the popup closes it
  aboutDialog.addEventListener('click', function (e) {
    if (e.target === aboutDialog) aboutDialog.close();
  });

  render();
})();