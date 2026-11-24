/* ==========================================================================
   Gothic Lily — общий скрипт для всех страниц
   1) шапка и подвал (рисуются отсюда, чтобы менять меню в одном месте)
   2) вход-заглушка (без сервера, данные хранятся в браузере)
   3) слайдер на главной
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Меню ------------------------------------------------------ */
  // auth: страница доступна только после входа (текст — для окна входа)
  var NAV = [
    { id: 'philosophy', label: 'философия',    href: 'philosophy.html' },
    { id: 'masters',    label: 'мастера',      href: 'masters.html' },
    { id: 'portfolio',  label: 'портфолио',    href: 'portfolio.html' },
    { id: 'categories', label: 'категории',    href: 'categories.html' },
    { id: 'booking',    label: 'запись',       href: 'booking.html', auth: 'записаться на сеанс' },
    { id: 'account',    label: 'личная лилия', href: 'account.html', auth: 'открыть личный кабинет', footerLabel: 'личный кабинет' }
  ];

  // Контакты в подвале. Ссылки на соцсети поменяйте на настоящие.
  var CONTACTS = [
    { text: '+7-966-(864)-52-67', href: 'tel:+79668645267' },
    { text: '+7-911-(143)-77-88', href: 'tel:+79111437788' },
    { text: '@gothic_lily_help',  href: 'https://t.me/gothic_lily_help' },
    { text: 'inst* - @goth_lillly',        href: 'https://www.instagram.com/goth_lillly' },
    { text: 'tik tok* - @gothictatoolily', href: 'https://www.tiktok.com/@gothictatoolily' }
  ];

  var LEGAL = '*Деятельность организации Meta Platforms Inc. (Facebook, Instagram) запрещена на территории Российской Федерации';

  var page = document.body.getAttribute('data-page') || '';

  /* ---------- Вход (заглушка) ------------------------------------------- */
  var KEY = 'gl_user';
  var memoryUser = null; // запасной вариант, если браузер не даёт localStorage

  var Auth = {
    get: function () {
      try { return JSON.parse(localStorage.getItem(KEY)) || memoryUser; }
      catch (e) { return memoryUser; }
    },
    set: function (user) {
      memoryUser = user;
      try { localStorage.setItem(KEY, JSON.stringify(user)); } catch (e) {}
    },
    clear: function () {
      memoryUser = null;
      try { localStorage.removeItem(KEY); } catch (e) {}
    }
  };

  // Страницы с body data-auth="required" без входа отправляют на главную
  if (document.body.getAttribute('data-auth') === 'required' && !Auth.get()) {
    window.location.replace('index.html?login=' + encodeURIComponent(page));
    return;
  }

  /* ---------- Шапка ----------------------------------------------------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function navItem(n) {
    var cls = page === n.id ? ' class="is-active" aria-current="page"' : '';
    var auth = n.auth ? ' data-auth-reason="' + esc(n.auth) + '"' : '';
    return '<li><a href="' + n.href + '"' + cls + auth + '>' + n.label + '</a></li>';
  }

  function renderHeader() {
    var host = document.getElementById('site-header');
    if (!host) return;
    var logo = function (extra) {
      return '<a class="logo ' + extra + '" href="index.html" aria-label="Gothic Lily — на главную">' +
             '<img src="img/logo.png" alt="" width="98" height="97"></a>';
    };
    host.outerHTML =
      '<header class="site-header" id="site-header">' +
        '<div class="bar">' +
          '<button class="burger" type="button" aria-label="Меню" aria-expanded="false" aria-controls="main-nav">' +
            '<span></span><span></span><span></span></button>' +
          logo('logo-mobile') +
          '<nav aria-label="Основное меню">' +
            '<ul class="nav-list" id="main-nav">' +
              NAV.slice(0, 3).map(navItem).join('') +
              '<li class="logo-li">' + logo('') + '</li>' +
              NAV.slice(3).map(navItem).join('') +
            '</ul>' +
          '</nav>' +
          '<div class="auth">' +
            '<button class="auth-btn" type="button" aria-haspopup="true" aria-expanded="false"></button>' +
            '<div class="auth-menu" hidden></div>' +
          '</div>' +
        '</div>' +
      '</header>';
  }

  function renderFooter() {
    var host = document.getElementById('site-footer');
    if (!host) return;
    var links = [{ label: 'главная', href: 'index.html', id: 'home' }].concat(NAV.map(function (n) {
      return { label: n.footerLabel || n.label, href: n.href, id: n.id, auth: n.auth };
    }));
    host.outerHTML =
      '<footer class="footer">' +
        '<div class="footer-inner">' +
          '<div><h2>Навигация</h2><ul>' +
            links.map(function (l) {
              return '<li><a href="' + l.href + '"' + (l.auth ? ' data-auth-reason="' + esc(l.auth) + '"' : '') + '>' + l.label + '</a></li>';
            }).join('') +
          '</ul></div>' +
          '<div><h2>Контакты</h2><ul>' +
            CONTACTS.map(function (c) {
              return '<li><a href="' + c.href + '">' + c.text + '</a></li>';
            }).join('') +
          '</ul><p class="legal">' + LEGAL + '</p></div>' +
          '<div class="footer-map"><img src="img/map.jpg" alt="Карта: Токио" width="828" height="641"></div>' +
        '</div>' +
      '</footer>';
  }

  renderHeader();
  renderFooter();

  var header = document.getElementById('site-header');
  var burger = header.querySelector('.burger');
  var authBtn = header.querySelector('.auth-btn');
  var authMenu = header.querySelector('.auth-menu');

  burger.addEventListener('click', function () {
    var open = header.classList.toggle('nav-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* ---------- Окно входа ------------------------------------------------ */
  var modal = null;
  var lastFocus = null;
  var afterLogin = null;

  function buildModal() {
    var el = document.createElement('div');
    el.className = 'modal';
    el.hidden = true;
    el.innerHTML =
      '<div class="modal-backdrop" data-close></div>' +
      '<form class="modal-card" role="dialog" aria-modal="true" aria-labelledby="login-title" novalidate>' +
        '<button class="modal-x" type="button" aria-label="Закрыть" data-close>&times;</button>' +
        '<h2 class="modal-title" id="login-title">вход</h2>' +
        '<p class="modal-note" data-note></p>' +
        '<label class="field">Как к вам обращаться' +
          '<input name="name" type="text" maxlength="24" autocomplete="given-name" placeholder="Ваше имя" required></label>' +
        '<label class="field">Telegram' +
          '<input name="tg" type="text" maxlength="33" autocomplete="off" placeholder="@username" required></label>' +
        '<label class="field">Возраст <small>(необязательно)</small>' +
          '<input name="age" type="text" inputmode="numeric" maxlength="3" placeholder="23"></label>' +
        '<p class="modal-error" role="alert" data-error></p>' +
        '<button class="btn-pill" type="submit">войти</button>' +
        '<p class="modal-hint">Демо-вход без пароля: данные хранятся только в этом браузере.</p>' +
      '</form>';
    document.body.appendChild(el);

    el.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close')) closeLogin();
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeLogin(); return; }
      if (e.key !== 'Tab') return;           // не выпускаем фокус из окна
      var f = el.querySelectorAll('button, input');
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    el.querySelector('form').addEventListener('submit', onSubmit);
    return el;
  }

  function openLogin(reason, next) {
    if (!modal) modal = buildModal();
    afterLogin = next || null;
    lastFocus = document.activeElement;
    modal.querySelector('[data-note]').textContent =
      reason ? 'Войдите, чтобы ' + reason + '.' : 'Войдите, чтобы записываться и видеть личный кабинет.';
    modal.querySelector('[data-error]').textContent = '';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('input[name="name"]').focus();
  }

  function closeLogin() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onSubmit(e) {
    e.preventDefault();
    var f = e.target;
    var name = f.name.value.trim();
    var tg = f.tg.value.trim().replace(/^@/, '');
    var age = f.age.value.trim();
    var err = f.querySelector('[data-error]');
    [f.name, f.tg, f.age].forEach(function (i) { i.removeAttribute('aria-invalid'); });

    if (name.length < 2)              { f.name.setAttribute('aria-invalid', 'true'); err.textContent = 'Введите имя (минимум 2 буквы).'; f.name.focus(); return; }
    if (!/^[A-Za-z0-9_]{4,32}$/.test(tg)) { f.tg.setAttribute('aria-invalid', 'true'); err.textContent = 'Telegram: 4–32 символа, латиница, цифры и «_».'; f.tg.focus(); return; }
    if (age && !(/^\d{1,3}$/.test(age) && +age >= 1 && +age <= 120)) { f.age.setAttribute('aria-invalid', 'true'); err.textContent = 'Возраст — число от 1 до 120.'; f.age.focus(); return; }

    Auth.set({ name: name, tg: '@' + tg, age: age ? +age : null });
    var next = afterLogin;
    closeLogin();
    refreshAuthUI();
    if (next) window.location.href = next;
  }

  /* ---------- Состояние «вошёл / не вошёл» ------------------------------ */
  function closeAuthMenu() {
    authMenu.hidden = true;
    authBtn.setAttribute('aria-expanded', 'false');
  }

  function refreshAuthUI() {
    var user = Auth.get();

    // замочки у закрытых страниц
    document.querySelectorAll('.nav-list a[data-auth-reason]').forEach(function (a) {
      a.classList.toggle('is-locked', !user);
    });

    closeAuthMenu();
    if (user) {
      authBtn.classList.add('is-in');
      authBtn.setAttribute('aria-label', 'Профиль: ' + user.name);
      authBtn.title = user.name;
      authBtn.innerHTML = '<span class="auth-initial">' + esc(user.name.charAt(0)) + '</span>';
      authMenu.innerHTML =
        '<p class="auth-hello">Вы вошли как<br><strong>' + esc(user.name) + '</strong> · ' + esc(user.tg) + '</p>' +
        '<a href="account.html">личный кабинет</a>' +
        '<a href="booking.html">записаться</a>' +
        '<button type="button" data-logout>выйти</button>';
    } else {
      authBtn.classList.remove('is-in');
      authBtn.removeAttribute('title');
      authBtn.setAttribute('aria-label', 'Войти');
      authBtn.textContent = 'войти';
      authMenu.innerHTML = '';
    }
  }

  authBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!Auth.get()) { openLogin(); return; }
    var open = authMenu.hidden;
    authMenu.hidden = !open;
    authBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  authMenu.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-logout')) {
      Auth.clear();
      refreshAuthUI();
      if (document.body.getAttribute('data-auth') === 'required') window.location.replace('index.html');
    }
  });

  document.addEventListener('click', function (e) {
    if (!authMenu.hidden && !e.target.closest('.auth')) closeAuthMenu();
    // закрытые страницы без входа -> окно входа
    var link = e.target.closest('a[data-auth-reason]');
    if (link && !Auth.get()) {
      e.preventDefault();
      header.classList.remove('nav-open');
      openLogin(link.getAttribute('data-auth-reason'), link.getAttribute('href'));
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAuthMenu();
  });

  refreshAuthUI();

  // Пришли на главную с закрытой страницы
  var params = new URLSearchParams(window.location.search);
  if (params.get('login')) {
    var target = NAV.filter(function (n) { return n.id === params.get('login'); })[0];
    if (target && target.auth && !Auth.get()) openLogin(target.auth, target.href);
    if (window.history.replaceState) window.history.replaceState(null, '', window.location.pathname);
  }

  window.GL = { Auth: Auth, openLogin: openLogin };

  /* ---------- Кнопки-заглушки ("читать дальше" и т.п.) ---------------- */
  var toast = null, toastTimer = null;
  function showToast(text) {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 2400);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-stub]');
    if (b) { e.preventDefault(); showToast(b.getAttribute('data-stub') || 'Скоро здесь появится больше информации'); }
  });
  window.GL.toast = showToast;

  /* ---------- Слайдер --------------------------------------------------- */
  var AUTOPLAY_MS = 0; // например 7000 — листать само каждые 7 секунд; 0 — выключено

  var sliderRoot = document.querySelector('[data-slider]');
  if (sliderRoot) {
    var slides = Array.prototype.slice.call(sliderRoot.querySelectorAll('.slide'));
    var dotsBox = sliderRoot.querySelector('.dots');
    var index = 0;
    var timer = null;

    var dots = slides.map(function (_, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'dot';
      b.setAttribute('aria-label', 'Слайд ' + (k + 1) + ' из ' + slides.length);
      b.addEventListener('click', function () { show(k); restart(); });
      dotsBox.appendChild(b);
      return b;
    });

    function show(n) {
      index = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        var on = k === index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        if ('inert' in s) s.inert = !on;
      });
      dots.forEach(function (d, k) {
        d.classList.toggle('is-active', k === index);
        d.setAttribute('aria-current', k === index ? 'true' : 'false');
      });
    }
    function restart() {
      if (timer) clearInterval(timer);
      if (AUTOPLAY_MS > 0) timer = setInterval(function () { show(index + 1); }, AUTOPLAY_MS);
    }

    sliderRoot.querySelector('.arrow-prev').addEventListener('click', function () { show(index - 1); restart(); });
    sliderRoot.querySelector('.arrow-next').addEventListener('click', function () { show(index + 1); restart(); });

    sliderRoot.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { show(index - 1); restart(); }
      if (e.key === 'ArrowRight') { show(index + 1); restart(); }
    });

    // свайп на телефоне
    var startX = null;
    var hero = sliderRoot.querySelector('.hero');
    hero.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) { show(index + (dx < 0 ? 1 : -1)); restart(); }
    }, { passive: true });

    show(0);
    restart();
  }
})();
