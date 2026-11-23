(function () {
  'use strict';

  // Мобильное меню
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });
  }

  // Подгрузка изображений: если файл лежит в папке img, он подставляется в карточку
  document.querySelectorAll('.card-media[data-img]').forEach(function (el) {
    var img = new Image();
    img.onload = function () {
      el.style.backgroundImage = 'url("' + el.getAttribute('data-img') + '")';
      el.classList.add('has-img');
    };
    img.src = el.getAttribute('data-img');
  });

  // Фильтр агентов по роли
  var filters = document.querySelectorAll('.filter');
  var agents = document.querySelectorAll('#agent-grid .agent');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var role = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.classList.toggle('active', b === btn); });
      agents.forEach(function (card) {
        card.hidden = role !== 'all' && card.getAttribute('data-role') !== role;
      });
    });
  });

  // Поиск по сайту
  var input = document.getElementById('site-search');
  var list = document.getElementById('search-results');
  if (input && list && window.SEARCH_INDEX) {
    var render = function (q) {
      q = q.trim().toLowerCase();
      list.innerHTML = '';
      if (!q) { list.hidden = true; return; }
      var found = window.SEARCH_INDEX.filter(function (e) {
        return (e.t + ' ' + e.s + ' ' + e.d).toLowerCase().indexOf(q) !== -1;
      }).slice(0, 8);
      if (!found.length) {
        var li = document.createElement('li');
        li.className = 'empty';
        li.textContent = 'Ничего не найдено';
        list.appendChild(li);
      }
      found.forEach(function (e) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = e.u;
        a.textContent = e.t;
        var s = document.createElement('small');
        s.textContent = e.s;
        a.appendChild(s);
        li.appendChild(a);
        list.appendChild(li);
      });
      list.hidden = false;
    };
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { input.value = ''; list.hidden = true; }
      if (ev.key === 'Enter') {
        var first = list.querySelector('a');
        if (first) { window.location.href = first.getAttribute('href'); }
      }
    });
    document.addEventListener('click', function (ev) {
      if (!ev.target.closest('.search')) { list.hidden = true; }
    });
  }
})();
