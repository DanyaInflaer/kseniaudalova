(function () {
  'use strict';
  var D = window.HUB;
  var page = document.body.getAttribute('data-page') || 'home';

  var NAV = [
    ['index.html', 'Home', 'home'],
    ['agents.html', 'Agents', 'agents'],
    ['maps.html', 'Maps', 'maps'],
    ['weapons.html', 'Weapons', 'weapons'],
    ['skins.html', 'Skins', 'skins'],
    ['modes.html', 'Game Modes', 'modes'],
    ['about.html', 'About', 'about']
  ];

  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9а-я]+/g, '-').replace(/^-|-$/g, ''); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }

  var LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="#FF4655" d="M2 6h8l6 11 6-11h8L16 28z"/></svg>';

  /* ---------- шапка и подвал ---------- */
  function renderChrome() {
    var links = NAV.map(function (n) {
      return '<a href="' + n[0] + '"' + (n[2] === page ? ' class="active"' : '') + '>' + n[1] + '</a>';
    }).join('');

    var header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML =
      '<div class="container header-inner">' +
      '<a class="logo" href="index.html">' + LOGO + '<span class="t">VALORANT <b>HUB</b></span></a>' +
      '<nav class="nav" id="nav" aria-label="Главное меню">' + links + '</nav>' +
      '<div class="search"><input id="q" type="search" placeholder="Поиск по сайту" autocomplete="off" aria-label="Поиск по сайту">' +
      '<div class="results" id="results"></div></div>' +
      '<button class="burger" id="burger" aria-label="Открыть меню"><span></span></button>' +
      '</div>';
    document.body.insertBefore(header, document.body.firstChild);

    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML =
      '<div class="container footer-inner">' +
      '<div><a class="logo" href="index.html">' + LOGO + '<span class="t">VALORANT <b>HUB</b></span></a>' +
      '<p>Информационный сайт о тактическом шутере VALORANT: агенты, карты, оружие и игровые режимы в одном месте.</p></div>' +
      '<div class="footer-links">' + links + '</div></div>' +
      '<div class="copy">© ' + new Date().getFullYear() + ' VALORANT HUB. Неофициальный фан-сайт. VALORANT и все связанные материалы — товарные знаки и собственность Riot Games, Inc. Сайт не связан с Riot Games.</div>';
    document.body.appendChild(footer);

    $('#burger').addEventListener('click', function () { $('#nav').classList.toggle('open'); });
  }

  /* ---------- поиск ---------- */
  function buildIndex() {
    var idx = NAV.map(function (n) { return { t: n[1], k: 'Раздел', u: n[0], s: n[1].toLowerCase() }; });
    D.agents.forEach(function (a) { idx.push({ t: a[0], k: 'Агент · ' + a[1], u: 'agents.html#' + slug(a[0]), s: (a[0] + ' ' + a[1] + ' ' + a[2]).toLowerCase() }); });
    D.maps.forEach(function (m) { idx.push({ t: m[0], k: 'Карта', u: 'maps.html#' + slug(m[0]), s: (m[0] + ' ' + m[1] + ' ' + m[2]).toLowerCase() }); });
    D.weapons.forEach(function (w) { idx.push({ t: w[0], k: 'Оружие · ' + w[1], u: 'weapons.html#' + slug(w[0]), s: (w[0] + ' ' + w[1] + ' ' + w[3]).toLowerCase() }); });
    D.modes.forEach(function (m) { idx.push({ t: m[0], k: 'Режим', u: 'modes.html#' + slug(m[0]), s: (m[0] + ' ' + m[2]).toLowerCase() }); });
    return idx;
  }
  function initSearch() {
    var idx = buildIndex(), input = $('#q'), box = $('#results'), skinsLoaded = false;
    function loadSkins() {
      if (skinsLoaded) return;
      skinsLoaded = true;
      api('weapons').then(function (list) {
        if (!list) { skinsLoaded = false; delete cache['weapons']; return; }
        list.forEach(function (w) {
          (w.skins || []).forEach(function (sk) {
            var n = sk.displayName || '';
            if (!n || /^standard /i.test(n) || /^random favorite/i.test(n)) return;
            idx.push({ t: n, k: 'Скин · ' + w.displayName, u: 'skins.html?q=' + encodeURIComponent(n), s: n.toLowerCase() });
          });
        });
        if (input.value.trim()) input.dispatchEvent(new Event('input'));
      });
    }
    input.addEventListener('focus', loadSkins);
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      if (!q) { box.classList.remove('open'); return; }
      var res = idx.filter(function (i) { return i.s.indexOf(q) !== -1; })
        .sort(function (a, b) { return (b.t.toLowerCase().indexOf(q) === 0) - (a.t.toLowerCase().indexOf(q) === 0); })
        .slice(0, 8);
      box.innerHTML = res.length
        ? res.map(function (r) { return '<a href="' + r.u + '"><span>' + esc(r.t) + '</span><small>' + esc(r.k) + '</small></a>'; }).join('')
        : '<p>Ничего не найдено</p>';
      box.classList.add('open');
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.search')) box.classList.remove('open'); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { box.classList.remove('open'); input.blur(); }
      if (e.key === 'Enter') { var f = $('a', box); if (f) location.href = f.getAttribute('href'); }
    });
  }

  /* ---------- данные с valorant-api.com (картинки) ---------- */
  var cache = {};
  function api(path) {
    if (!cache[path]) {
      cache[path] = fetch('https://valorant-api.com/v1/' + path)
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) { return j.data; })
        .catch(function () { return null; });
    }
    return cache[path];
  }
  function byName(list) {
    var m = {};
    (list || []).forEach(function (x) { m[x.displayName.toLowerCase()] = x; });
    return m;
  }
  function setImg(card, url, alt) {
    var media = $('.media', card);
    if (!media || !url) return;
    var img = document.createElement('img');
    img.alt = alt;
    img.decoding = 'async';
    // картинка вставляется сразу: если не загрузится — остаётся буква-заглушка
    img.onerror = function () { img.remove(); };
    img.src = url;
    media.insertBefore(img, media.firstChild);
  }

  /* ---------- карточки ---------- */
  function ph(name) { return '<div class="ph">' + esc(name.charAt(0)) + '</div>'; }

  function agentCard(a) {
    return '<article class="card" id="' + slug(a[0]) + '" data-name="' + esc(a[0]) + '" data-role="' + a[1] + '">' +
      '<div class="media agent">' + ph(a[0]) + '</div>' +
      '<div class="body"><span class="tag">' + a[1] + '</span><h3>' + esc(a[0]) + '</h3><p>' + esc(a[2]) + '</p></div></article>';
  }
  function mapCard(m) {
    return '<article class="card" id="' + slug(m[0]) + '" data-name="' + esc(m[0]) + '">' +
      '<div class="media map">' + ph(m[0]) + '</div>' +
      '<div class="body"><span class="tag">' + esc(m[1]) + '</span><h3>' + esc(m[0]) + '</h3><p>' + esc(m[2]) + '</p>' +
      '<p><b style="color:#fff">Особенности:</b> ' + esc(m[3]) + '</p></div></article>';
  }
  function weaponCard(w) {
    return '<article class="card" id="' + slug(w[0]) + '" data-name="' + esc(w[0]) + '" data-cat="' + w[1] + '">' +
      '<span class="price">' + (w[2] === 0 ? 'Free' : w[2]) + '</span>' +
      '<div class="media weapon">' + ph(w[0]) + '</div>' +
      '<div class="body"><span class="tag">' + w[1] + '</span><h3>' + esc(w[0]) + '</h3><p>' + esc(w[3]) + '</p></div></article>';
  }
  function modeCard(m, i) {
    return '<article class="card link-card" id="' + slug(m[0]) + '">' +
      '<span class="num">' + String(i + 1).padStart(2, '0') + '</span><span class="tag" style="align-self:flex-start">' + esc(m[1]) + '</span>' +
      '<h3>' + esc(m[0]) + '</h3><p>' + esc(m[2]) + '</p><p style="color:#fff;font-size:.85rem"><b class="accent">Правила:</b> ' + esc(m[3]) + '</p></article>';
  }

  function chips(list, onPick) {
    var wrap = document.createElement('div');
    wrap.className = 'filters';
    ['All'].concat(list).forEach(function (c, i) {
      var b = document.createElement('button');
      b.className = 'chip' + (i === 0 ? ' on' : '');
      b.textContent = c;
      b.addEventListener('click', function () {
        [].forEach.call(wrap.children, function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        onPick(c);
      });
      wrap.appendChild(b);
    });
    return wrap;
  }
  function uniq(arr) { return arr.filter(function (v, i) { return arr.indexOf(v) === i; }); }

  /* ---------- страницы ---------- */
  function pageAgents() {
    var root = $('#agents-root');
    var roles = uniq(D.agents.map(function (a) { return a[1]; }));
    var grid = document.createElement('div');
    grid.className = 'grid c4';
    grid.innerHTML = D.agents.map(agentCard).join('');
    root.parentNode.insertBefore(chips(roles, function (r) {
      [].forEach.call(grid.children, function (c) { c.style.display = (r === 'All' || c.dataset.role === r) ? '' : 'none'; });
    }), root);
    root.appendChild(grid);
    api('agents?isPlayableCharacter=true').then(function (list) {
      var m = byName(list);
      [].forEach.call(grid.children, function (c) {
        var a = m[c.dataset.name.toLowerCase()];
        if (a) setImg(c, a.fullPortrait || a.displayIcon, c.dataset.name);
      });
    });
  }
  function pageMaps() {
    var grid = $('#maps-root');
    grid.innerHTML = D.maps.map(mapCard).join('');
    api('maps').then(function (list) {
      var m = byName(list);
      [].forEach.call(grid.children, function (c) {
        var x = m[c.dataset.name.toLowerCase()];
        if (x) setImg(c, x.splash, c.dataset.name);
      });
    });
  }
  function pageWeapons() {
    var root = $('#weapons-root');
    var cats = uniq(D.weapons.map(function (w) { return w[1]; }));
    var grid = document.createElement('div');
    grid.className = 'grid c3';
    grid.innerHTML = D.weapons.map(weaponCard).join('');
    root.parentNode.insertBefore(chips(cats, function (r) {
      [].forEach.call(grid.children, function (c) { c.style.display = (r === 'All' || c.dataset.cat === r) ? '' : 'none'; });
    }), root);
    root.appendChild(grid);
    api('weapons').then(function (list) {
      var m = byName(list);
      [].forEach.call(grid.children, function (c) {
        var x = m[c.dataset.name.toLowerCase()];
        if (x) setImg(c, x.displayIcon, c.dataset.name);
      });
    });
  }
  function pageSkins() {
    var root = $('#skins-root'), more = $('#skins-more'), countEl = $('#skins-count');
    var qEl = $('#skin-q'), wEl = $('#skin-weapon'), tBox = $('#skin-tiers');
    var STEP = 48;
    root.innerHTML = '<p class="empty">Загрузка скинов…</p>';

    Promise.all([api('weapons'), api('contenttiers')]).then(function (r) {
      var weapons = r[0], tiers = r[1];
      if (!weapons) {
        delete cache['weapons']; delete cache['contenttiers'];
        root.innerHTML = '<p class="empty">Не удалось загрузить скины с valorant-api.com. Проверьте интернет и попробуйте ещё раз. <button class="btn" id="retry" type="button" style="margin-left:10px">Повторить</button></p>';
        $('#retry').addEventListener('click', pageSkins);
        return;
      }
      var tierMap = {};
      (tiers || []).forEach(function (t) {
        tierMap[String(t.uuid).toLowerCase()] = { name: (t.displayName || '').replace(/\s*Edition$/i, ''), color: t.highlightColor ? '#' + t.highlightColor.slice(0, 6) : '', rank: t.rank || 0 };
      });
      var all = [];
      weapons.forEach(function (w) {
        (w.skins || []).forEach(function (s) {
          var n = s.displayName || '';
          if (/^standard /i.test(n) || /^random favorite/i.test(n)) return;
          var img = s.displayIcon || (s.chromas && s.chromas[0] && (s.chromas[0].fullRender || s.chromas[0].displayIcon)) || (s.levels && s.levels[0] && s.levels[0].displayIcon);
          if (!img) return;
          var t = tierMap[String(s.contentTierUuid || '').toLowerCase()] || { name: 'Other', color: '', rank: -1 };
          all.push({ name: n, weapon: w.displayName, tier: t.name, color: t.color, rank: t.rank, img: img });
        });
      });
      all.sort(function (a, b) { return a.weapon.localeCompare(b.weapon) || a.name.localeCompare(b.name); });

      var weaponNames = uniq(all.map(function (s) { return s.weapon; })).sort();
      wEl.innerHTML = '<option value="">Всё оружие</option>' + weaponNames.map(function (n) { return '<option>' + esc(n) + '</option>'; }).join('');
      var tierNames = uniq(all.slice().sort(function (a, b) { return a.rank - b.rank; }).map(function (s) { return s.tier; }));
      var tier = 'All';
      tBox.innerHTML = '';
      tBox.appendChild(chips(tierNames, function (c) { tier = c; apply(); }));

      var list = [], shown = 0;
      function card(s) {
        return '<article class="card skin" style="--tier:' + (s.color || 'var(--red)') + '"><div class="media weapon">' +
          '<img src="' + esc(s.img) + '" alt="' + esc(s.name) + '" loading="lazy" decoding="async">' + ph(s.name) + '</div>' +
          '<div class="body"><span class="tag">' + esc(s.tier) + '</span><h3>' + esc(s.name) + '</h3><p>' + esc(s.weapon) + '</p></div></article>';
      }
      function draw() {
        var next = list.slice(shown, shown + STEP);
        root.insertAdjacentHTML('beforeend', next.map(card).join(''));
        shown += next.length;
        more.hidden = shown >= list.length;
        countEl.textContent = 'Показано ' + shown + ' из ' + list.length;
      }
      function apply() {
        var q = qEl.value.trim().toLowerCase(), w = wEl.value;
        list = all.filter(function (s) {
          return (!w || s.weapon === w) && (tier === 'All' || s.tier === tier) && (!q || s.name.toLowerCase().indexOf(q) !== -1);
        });
        root.innerHTML = ''; shown = 0;
        if (!list.length) { root.innerHTML = '<p class="empty">Ничего не найдено</p>'; more.hidden = true; countEl.textContent = ''; return; }
        draw();
      }
      try { var pq = new URLSearchParams(location.search).get('q'); if (pq) qEl.value = pq; } catch (e) {}
      root.addEventListener('error', function (e) { if (e.target.tagName === 'IMG') e.target.remove(); }, true);
      qEl.addEventListener('input', apply);
      wEl.addEventListener('change', apply);
      more.addEventListener('click', draw);
      apply();
    });
  }

  function pageModes() {
    $('#modes-root').innerHTML = D.modes.map(modeCard).join('');
  }
  function pageHome() {
    var art = $('#hero-art');
    var picks = ['Jett', 'Reyna', 'Sage', 'Omen', 'Phoenix', 'Sova', 'Raze', 'Killjoy'];
    api('agents?isPlayableCharacter=true').then(function (list) {
      if (!list) return;
      var m = byName(list);
      var chosen = picks.sort(function () { return Math.random() - .5; }).slice(0, 3);
      var cls = ['f1', 'f2', 'f3'];
      var html = chosen.map(function (n, i) {
        var a = m[n.toLowerCase()];
        return a && a.fullPortrait ? '<img class="fig ' + cls[i] + '" src="' + a.fullPortrait + '" alt="' + n + '">' : '';
      }).join('');
      if (html) art.innerHTML = html;
    });
    var vb = $('#trailer-box');
    if (vb) {
      var btn = $('.video-play', vb);
      btn.addEventListener('click', function () {
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + vb.getAttribute('data-yt') + '?autoplay=1&rel=0';
        f.title = 'Трейлер VALORANT';
        f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
        f.allowFullscreen = true;
        vb.replaceChild(f, btn);
      });
    }
    var cards = [
      ['agents.html', 'Agents', 'Персонажи игры: роли, способности и стиль каждого агента.'],
      ['maps.html', 'Maps', 'Карты со всего мира, их особенности и ключевые зоны.'],
      ['weapons.html', 'Weapons', 'Весь арсенал: пистолеты, винтовки, снайперки и цены.'],
      ['skins.html', 'Skins', 'Коллекция скинов для оружия с картинками и редкостью.'],
      ['modes.html', 'Game Modes', 'От рейтинговых матчей до быстрых и весёлых режимов.'],
      ['about.html', 'About', 'История игры, Riot Games и интересные факты.']
    ];
    $('#home-cards').innerHTML = cards.map(function (c, i) {
      return '<a class="card link-card" href="' + c[0] + '"><span class="num">0' + (i + 1) + '</span><h3>' + c[1] + '</h3><p>' + c[2] + '</p><span class="more">Открыть →</span></a>';
    }).join('');
  }

  renderChrome();
  initSearch();
  var fn = { home: pageHome, agents: pageAgents, maps: pageMaps, weapons: pageWeapons, skins: pageSkins, modes: pageModes }[page];
  if (fn) fn();

  // после динамической отрисовки перейти к якорю из поиска
  if (location.hash) {
    setTimeout(function () {
      var t = document.getElementById(location.hash.slice(1));
      if (t) t.scrollIntoView({ block: 'center' });
    }, 150);
  }
})();
