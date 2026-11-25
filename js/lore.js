/* Раздел Lore. Данные — js/lore-data.js (у каждого факта есть уровень достоверности). */
(function () {
  'use strict';
  var L = window.LORE, X = window.HUBX, D = window.HUB;
  if (!L || !X) return;
  var esc = X.esc, $ = X.$;
  var sub = document.body.getAttribute('data-sub') || 'hub';
  var LV = { o: ['Riot', 'Официальный источник Riot Games'], w: ['Вики / пресса', 'Фанатская вики или пресса — не официальное подтверждение'], t: ['Теория', 'Предположение сообщества, не подтверждено'] };
  var NO = 'Нет подтверждённых данных.';
  var roles = {};
  D.agents.forEach(function (a) { roles[a[0]] = a[1]; });

  function badge(lv) { return '<span class="lvl ' + lv + '" title="' + esc(LV[lv][1]) + '">' + LV[lv][0] + '</span>'; }
  function srcs(list) {
    return list && list.length ? '<div class="src">Источники: ' + list.map(function (s) { return '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.t) + '</a>'; }).join('') + '</div>' : '';
  }
  function agentLink(n) { return D.agents.some(function (a) { return a[0] === n; }) ? '<a class="chip small" href="lore-agent.html?a=' + encodeURIComponent(n) + '">' + esc(n) + '</a>' : '<span class="chip small">' + esc(n) + '</span>'; }
  var legend = '<p class="legend">' + ['o', 'w', 't'].map(function (k) { return badge(k).replace('margin-left:8px', '') + ' ' + LV[k][1]; }).join(' · ') + '</p>';

  /* подразделы */
  var pages = [['lore.html', 'Обзор', 'hub'], ['lore-agents.html', 'Агенты', 'agents'], ['lore-factions.html', 'Фракции', 'factions'], ['lore-relations.html', 'Связи', 'relations'], ['lore-events.html', 'События', 'events']];
  var nav = $('#subnav');
  if (nav) nav.innerHTML = '<div class="container">' + pages.map(function (p) {
    return '<a class="chip' + (p[2] === sub || (sub === 'agent' && p[2] === 'agents') ? ' on' : '') + '" href="' + p[0] + '">' + p[1] + '</a>';
  }).join('') + '</div>';

  var portraits = null;
  function loadPortraits(cb) {
    X.api('agents?isPlayableCharacter=true').then(function (d) { portraits = X.byName(d || []); cb(); });
  }
  function portrait(el, name) {
    var a = portraits && portraits[name.toLowerCase()];
    var url = a && (a.fullPortrait || a.displayIcon);
    if (!url) return;
    var img = document.createElement('img'); img.alt = name; img.loading = 'lazy'; img.decoding = 'async';
    img.onerror = function () { img.remove(); }; img.src = url;
    el.insertBefore(img, el.firstChild);
  }

  /* ---------- обзор ---------- */
  function timelineHtml(items) {
    return items.map(function (t, i) {
      return '<div class="tl-item" tabindex="0" role="button" aria-expanded="false"><span class="meta">Шаг ' + (i + 1) + '</span><h3>' + esc(t.t) + badge(t.lv) + '</h3><p>' + esc(t.x) + '</p><div hidden>' + srcs(t.s) + '</div></div>';
    }).join('');
  }
  function bindTimeline(root) {
    root.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      var it = e.target.closest('.tl-item'); if (!it) return;
      var on = !it.classList.contains('act');
      it.classList.toggle('act', on); it.setAttribute('aria-expanded', on); it.querySelector('[hidden],div').hidden = !on;
    });
    root.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { if (e.target.classList.contains('tl-item')) { e.preventDefault(); e.target.click(); } } });
  }
  if (sub === 'hub') {
    var tl = $('#world-tl'); tl.innerHTML = timelineHtml(L.world); bindTimeline(tl);
    $('#hub-legend').innerHTML = legend;
  }

  /* ---------- каталог агентов ---------- */
  if (sub === 'agents') {
    var grid = $('#lore-grid'), q = $('#lore-q'), cnt = $('#lore-count'), role = 'Все';
    var list = D.agents.map(function (a) { return a[0]; });
    grid.innerHTML = list.map(function (n) {
      var d = L.agents[n] || {};
      return '<a class="card lore-agent" href="lore-agent.html?a=' + encodeURIComponent(n) + '" data-name="' + esc(n) + '" data-role="' + esc(roles[n]) + '" data-s="' + esc((n + ' ' + roles[n] + ' ' + (d.origin ? d.origin[0] : '')).toLowerCase()) + '">' +
        '<div class="media agent"><div class="ph">' + esc(n.charAt(0)) + '</div></div><div class="body"><span class="tag">' + esc(roles[n]) + '</span><h3>' + esc(n) + '</h3><p>' + esc(d.origin ? d.origin[0] : NO) + '</p></div></a>';
    }).join('');
    var rs = ['Все'].concat(Array.from(new Set(Object.keys(roles).map(function (k) { return roles[k]; }))));
    var fl = $('#lore-filters');
    fl.innerHTML = rs.map(function (r) { return '<button type="button" class="chip' + (r === 'Все' ? ' on' : '') + '" aria-pressed="' + (r === 'Все') + '">' + r + '</button>'; }).join('');
    fl.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      role = b.textContent;
      Array.prototype.forEach.call(fl.children, function (c) { var on = c === b; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
      apply();
    });
    function apply() {
      var s = q.value.trim().toLowerCase(), n = 0;
      Array.prototype.forEach.call(grid.children, function (c) {
        var ok = (role === 'Все' || c.dataset.role === role) && (!s || c.dataset.s.indexOf(s) !== -1);
        c.hidden = !ok; if (ok) n++;
      });
      cnt.textContent = 'Найдено: ' + n;
    }
    q.addEventListener('input', apply); apply();
    loadPortraits(function () { Array.prototype.forEach.call(grid.children, function (c) { portrait($('.media', c), c.dataset.name); }); });
  }

  /* ---------- страница агента ---------- */
  function relFor(n) { return L.relations.filter(function (r) { return r.a === n || r.b === n; }); }
  var TY = { ally: ['Союзники', '#3ecf8e'], rival: ['Соперники', '#ffb020'], shared: ['Общая история', '#5aa9ff'], conflict: ['Конфликт', '#FF4655'], family: ['Родственные', '#b48cff'] };
  function relHtml(r, me) {
    var o = r.a === me ? r.b : r.a; if (r.a === r.b) o = 'двойник из Omega Earth';
    var t = TY[r.ty];
    return '<div class="rel" style="--c:' + t[1] + '"><i>' + t[0] + '</i>' + badge(r.lv) + '<br><b>' + (r.a === r.b ? esc(o) : '<a href="lore-agent.html?a=' + encodeURIComponent(o) + '">' + esc(o) + '</a>') + '</b> — ' + esc(r.x) + '</div>';
  }
  if (sub === 'agent') {
    var name = new URLSearchParams(location.search).get('a') || '';
    var real = D.agents.filter(function (a) { return a[0].toLowerCase() === name.toLowerCase(); })[0];
    var root = $('#agent-root');
    if (!real) {
      root.innerHTML = '<div class="container"><p class="empty">Агент не найден. <a href="lore-agents.html">Открыть каталог агентов</a></p></div>';
    } else {
      name = real[0]; document.title = name + ' — Lore — VALORANT HUB';
      var d = L.agents[name];
      function field(label, f) { var no = f[0].indexOf('Нет') === 0 || f[0] === 'Засекречено'; return '<div class="field"><h3>' + label + (no ? '' : badge(f[1])) + '</h3><p' + (no ? ' class="empty"' : '') + '>' + esc(f[0]) + '</p></div>'; }
      var rel = relFor(name), ev = L.events.filter(function (e) { return e.c.indexOf(name) !== -1; });
      var idx = D.agents.map(function (a) { return a[0]; }).indexOf(name);
      root.innerHTML =
        '<section class="page-title"><div class="container"><div class="agent-hero"><div class="media agent"><div class="ph">' + esc(name.charAt(0)) + '</div></div><div>' +
        '<div class="eyebrow">Лор агента</div><h1 style="font-size:clamp(2rem,5vw,3.4rem)">' + esc(name) + '</h1>' +
        '<div class="facts"><div><span>Кодовое имя</span>' + esc(d.code) + '</div><div><span>Роль в игре</span>' + esc(real[1]) + '</div><div><span>Страна' + badge(d.origin[1]) + '</span>' + esc(d.origin[0]) + '</div><div><span>Настоящее имя' + badge(d.real[1]) + '</span>' + esc(d.real[0]) + '</div></div></div></div></div></section>' +
        '<section class="section"><div class="container">' + legend + '<div class="fields">' +
        field('Биография', d.bio) + field('История до Протокола', d.before) + field('Характер и особенности', d.pers) + field('Способности и связь с лором', d.abil) + field('Интересные факты', d.triv) + '</div>' +
        '<div class="section-head" style="margin-top:34px"><h2>Связи с <span class="accent">агентами</span></h2></div><div class="rel-list" style="max-height:none">' + (rel.length ? rel.map(function (r) { return relHtml(r, name); }).join('') : '<p class="empty">' + NO + '</p>') + '</div>' +
        '<div class="section-head" style="margin-top:34px"><h2>События <span class="accent">сюжета</span></h2></div>' + (ev.length ? '<div class="rel-list" style="max-height:none">' + ev.map(function (e) { return '<div class="rel" style="--c:#FF4655"><i>' + esc(e.p) + '</i>' + badge(e.lv) + '<br><b>' + esc(e.t) + '</b> — ' + esc(e.x) + '</div>'; }).join('') + '</div>' : '<p class="empty">' + NO + '</p>') +
        srcs(d.src) + '<p class="note">Если у поля нет значка уровня — данных нет. Ничего не додумываем: пробелы остаются пробелами.</p>' +
        '<p style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn ghost" href="lore-agents.html">← Все агенты</a><a class="btn ghost" href="agents.html#' + X.slug(name) + '">Карточка в игре</a></p></div></section>';
      loadPortraits(function () { portrait($('.media', root), name); });
    }
  }

  /* ---------- фракции ---------- */
  if (sub === 'factions') {
    $('#fac-legend').innerHTML = legend;
    $('#fac-grid').innerHTML = L.factions.map(function (f) {
      return '<article class="card lore-card" id="' + X.slug(f.n) + '"><h3>' + esc(f.n) + badge(f.lv) + '</h3><p>' + esc(f.x) + '</p><p><b style="color:#fff">Связанные агенты:</b> ' + esc(f.m) + '</p>' + srcs(f.s) + '</article>';
    }).join('');
  }

  /* ---------- связи ---------- */
  if (sub === 'relations') {
    $('#rel-legend').innerHTML = legend;
    var rels = L.relations, ty = 'all', sel = null;
    var names = []; rels.forEach(function (r) { if (r.a !== r.b) [r.a, r.b].forEach(function (n) { if (names.indexOf(n) < 0) names.push(n); }); });
    var W = 640, C = W / 2, R = 255, pos = {};
    names.forEach(function (n, i) { var a = i / names.length * Math.PI * 2 - Math.PI / 2; pos[n] = [C + R * Math.cos(a), C + R * Math.sin(a)]; });
    var svg = $('#graph');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + W);
    svg.innerHTML = rels.filter(function (r) { return r.a !== r.b; }).map(function (r, i) {
      return '<line class="e' + (r.lv === 't' ? ' t' : '') + '" data-i="' + rels.indexOf(r) + '" data-ty="' + r.ty + '" x1="' + pos[r.a][0] + '" y1="' + pos[r.a][1] + '" x2="' + pos[r.b][0] + '" y2="' + pos[r.b][1] + '" stroke="' + TY[r.ty][1] + '"/>';
    }).join('') + names.map(function (n) {
      return '<g class="n" data-n="' + esc(n) + '" tabindex="0" role="button" aria-label="' + esc(n) + '"><circle cx="' + pos[n][0] + '" cy="' + pos[n][1] + '" r="24"/><text x="' + pos[n][0] + '" y="' + (pos[n][1] + 4) + '">' + esc(n.length > 8 ? n.slice(0, 8) + '…' : n) + '</text></g>';
    }).join('');
    var fl2 = $('#rel-filters'), box = $('#rel-box');
    fl2.innerHTML = [['all', 'Все']].concat(Object.keys(TY).map(function (k) { return [k, TY[k][0]]; })).map(function (t) { return '<button type="button" class="chip' + (t[0] === 'all' ? ' on' : '') + '" data-t="' + t[0] + '" aria-pressed="' + (t[0] === 'all') + '">' + t[1] + '</button>'; }).join('');
    function draw() {
      var shown = rels.filter(function (r) { return (ty === 'all' || r.ty === ty) && (!sel || r.a === sel || r.b === sel); });
      Array.prototype.forEach.call(svg.querySelectorAll('.e'), function (e) {
        var r = rels[+e.dataset.i];
        e.classList.toggle('dim', !((ty === 'all' || r.ty === ty) && (!sel || r.a === sel || r.b === sel)));
      });
      Array.prototype.forEach.call(svg.querySelectorAll('.n'), function (g) {
        var n = g.dataset.n, rel = sel && (n === sel || rels.some(function (r) { return (r.a === sel && r.b === n) || (r.b === sel && r.a === n); }));
        g.classList.toggle('sel', n === sel); g.classList.toggle('dim', !!sel && !rel);
      });
      var head = sel ? '<p class="note" style="margin:0 0 6px">Выбран: <b>' + esc(sel) + '</b> · <a href="lore-agent.html?a=' + encodeURIComponent(sel) + '">страница агента</a> · <a href="#" id="rel-reset">сбросить</a></p>' : '';
      var fam = ty === 'family' ? '<p class="empty">Подтверждённых родственных связей между агентами нет. Известны лишь родные вне числа агентов: сестра Phoenix Мэри и сестра Reyna Лусия — по данным вики.</p>' : '';
      box.innerHTML = head + fam + (shown.length ? shown.map(function (r) { return relHtml(r, sel || r.a).replace(/<b>.*?<\/b> — /, '<b>' + esc(r.a === r.b ? r.a + ' ↔ двойник' : r.a + ' ↔ ' + r.b) + '</b> — '); }).join('') : (ty === 'family' ? '' : '<p class="empty">' + NO + '</p>'));
      var rr = $('#rel-reset'); if (rr) rr.onclick = function (e) { e.preventDefault(); sel = null; draw(); };
    }
    fl2.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; ty = b.dataset.t;
      Array.prototype.forEach.call(fl2.children, function (c) { var on = c === b; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
      draw();
    });
    function pick(e) { var g = e.target.closest('.n'); if (!g) return; sel = sel === g.dataset.n ? null : g.dataset.n; draw(); }
    svg.addEventListener('click', pick);
    svg.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e); } });
    draw();
  }

  /* ---------- события ---------- */
  if (sub === 'events') {
    $('#ev-legend').innerHTML = legend;
    var KS = { all: 'Все', world: 'Внутри сюжета', cinematic: 'Ролики и трейлеры', release: 'Анонсы агентов' }, kind = 'all';
    var evq = $('#ev-q'), evc = $('#ev-count'), evl = $('#ev-tl');
    $('#ev-filters').innerHTML = Object.keys(KS).map(function (k) { return '<button type="button" class="chip' + (k === 'all' ? ' on' : '') + '" data-k="' + k + '" aria-pressed="' + (k === 'all') + '">' + KS[k] + '</button>'; }).join('');
    evl.innerHTML = L.events.map(function (e, i) {
      return '<div class="tl-item" data-k="' + e.k + '" data-s="' + esc((e.t + ' ' + e.x + ' ' + e.c.join(' ') + ' ' + e.p).toLowerCase()) + '" tabindex="0" role="button" aria-expanded="false"><span class="meta">' + esc(e.p) + ' · ' + KS[e.k] + '</span><h3>' + esc(e.t) + badge(e.lv) + '</h3><p>' + esc(e.x) + '</p>' +
        '<div hidden><p><b style="color:#fff">Почему важно:</b> ' + esc(e.why) + '</p><div class="who">' + e.c.map(agentLink).join('') + '</div>' + srcs(e.s) + '</div></div>';
    }).join('');
    bindTimeline(evl);
    function ev() {
      var s = evq.value.trim().toLowerCase(), n = 0;
      Array.prototype.forEach.call(evl.children, function (c) { var ok = (kind === 'all' || c.dataset.k === kind) && (!s || c.dataset.s.indexOf(s) !== -1); c.hidden = !ok; if (ok) n++; });
      evc.textContent = 'Найдено: ' + n;
    }
    evq.addEventListener('input', ev);
    $('#ev-filters').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; kind = b.dataset.k;
      Array.prototype.forEach.call(b.parentNode.children, function (c) { var on = c === b; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
      ev();
    });
    ev();
  }
})();
