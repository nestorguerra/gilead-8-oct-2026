(() => {
  'use strict';

  // Contenido literal de agenda.docx (única fuente).
  const EVENT = {
    title: 'CMm HER2- EN TIEMPOS DE IA',
    subtitle: 'Jornada II - TRODELVY en CMm HR+HER2-',
    dateLabel: 'Jueves 8 de octubre de 2026',
    date: '2026-10-08',
    utcOffset: '+02:00', // Madrid, horario de verano (CEST)
    venue: 'Hotel The Westin Madrid Cuzco',
    address: 'P.º de la Castellana, 133, Tetuán, 28046 Madrid'
  };

  const SPEAKERS = [
    { id: 'gion', initials: 'MG', name: 'Dra. María Gión Cortés', role: 'Oncología Médica, H.U. Ramón y Cajal' },
    { id: 'lopez', initials: 'AL', name: 'Dr. Alfonso López de Sa Lorenzo', role: 'Oncología Médica, H. Clínico San Carlos' },
    { id: 'garcia', initials: 'CG', name: 'Dra. Coral García Quevedo Suero', role: 'MIR Oncología Médica, H.U. Ramón y Cajal' },
    { id: 'guerra', initials: 'NG', name: 'Néstor Guerra', role: 'Experto en IA y transformación digital aplicable a la Oncología Médica' }
  ];

  const SESSIONS = [
    { n: 1, start: '18:00', end: '18:05', title: 'Bienvenida', speakers: ['gion'] },
    { n: 2, start: '18:05', end: '18:35', title: 'ADCs en CMm HR+ HER2-: ¿cuál, cuándo y por qué?', speakers: ['lopez'] },
    { n: 3, start: '18:35', end: '19:05', title: 'Resolviendo un caso clínico de CMm HR+ HER2- con TRODELVY', speakers: ['garcia'] },
    { n: 4, start: '19:05', end: '20:10', title: 'TALLER PRÁCTICO 2 – Oncología 2.0: crea tu propio agente de IA', speakers: ['guerra', 'gion'] },
    { n: 5, start: '20:10', end: '20:15', title: 'Conclusiones finales', speakers: ['gion'] }
  ];

  const MAPS_QUERY = `${EVENT.venue}, ${EVENT.address}`;
  const MAPS_APPLE = `https://maps.apple.com/?q=${encodeURIComponent(EVENT.venue)}&address=${encodeURIComponent(EVENT.address)}`;
  const MAPS_GOOGLE = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY)}`;

  const ROUTES = ['agenda', 'ponentes', 'lugar'];
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const speakerById = id => SPEAKERS.find(s => s.id === id);
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const isoTime = t => `${EVENT.date}T${t}${EVENT.utcOffset}`;

  function duration(s) {
    const d = toMin(s.end) - toMin(s.start);
    const h = Math.floor(d / 60);
    const m = d % 60;
    if (!h) return `${m} min`;
    return m ? `${h} h ${m} min` : `${h} h`;
  }

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value === true ? '' : value);
    }
    for (const child of children) {
      if (child != null) node.append(child);
    }
    return node;
  }

  function svgIcon(pathD, cls) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', cls);
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', pathD);
    svg.append(path);
    return svg;
  }

  function timeEl(t) {
    return el('time', { datetime: isoTime(t), text: t });
  }

  function avatar(sp, i) {
    return el('span', { class: `avatar avatar-${i % 2 ? 'red' : 'blue'}`, 'aria-hidden': 'true', text: sp.initials });
  }

  /* ---------- Contenido ---------- */

  function bindEventText() {
    const first = SESSIONS[0];
    const last = SESSIONS[SESSIONS.length - 1];
    const values = { ...EVENT, timeRange: `${first.start} – ${last.end}` };
    $$('[data-bind]').forEach(node => { node.textContent = values[node.dataset.bind]; });
    $('#maps-apple').href = MAPS_APPLE;
    $('#maps-google').href = MAPS_GOOGLE;
  }

  function renderSessions() {
    const list = $('#session-list');
    for (const s of SESSIONS) {
      const names = s.speakers.map(id => speakerById(id).name).join(', ');
      const button = el('button', {
        class: 'session glass',
        type: 'button',
        'data-session': s.n,
        'aria-haspopup': 'dialog'
      },
        el('span', { class: 'session-time' },
          el('strong', {}, timeEl(s.start)),
          el('span', { class: 'sr-only', text: ' a ' }),
          el('span', { class: 'session-end' }, timeEl(s.end))
        ),
        el('span', { class: 'session-body' },
          el('span', { class: 'live-badge', hidden: true }, el('span', { class: 'live-dot', 'aria-hidden': 'true' }), 'Ahora'),
          el('span', { class: 'session-title', text: s.title }),
          el('span', { class: 'session-speakers', text: names })
        ),
        el('span', { class: 'session-meta' },
          el('span', { class: 'session-duration', text: duration(s) }),
          svgIcon('M9 5l7 7-7 7', 'chevron')
        )
      );
      list.append(el('li', {}, button));
    }
  }

  function renderSpeakers() {
    const list = $('#speaker-list');
    SPEAKERS.forEach((sp, i) => {
      const sessions = SESSIONS.filter(s => s.speakers.includes(sp.id));
      const headingId = `sp-${sp.id}`;
      list.append(el('li', { class: 'speaker glass' },
        el('div', { class: 'speaker-head' },
          avatar(sp, i),
          el('div', {},
            el('h3', { class: 'speaker-name', id: headingId, text: sp.name }),
            el('p', { class: 'speaker-role', text: sp.role })
          )
        ),
        el('ul', { class: 'speaker-sessions', 'aria-label': `Sesiones de ${sp.name}` },
          ...sessions.map(s => el('li', {},
            el('button', { class: 'speaker-session', type: 'button', 'data-session': s.n, 'aria-haspopup': 'dialog' },
              el('span', { class: 'speaker-session-time' }, timeEl(s.start)),
              el('span', { class: 'speaker-session-title', text: s.title }),
              svgIcon('M9 5l7 7-7 7', 'chevron')
            )
          ))
        )
      ));
    });
  }

  /* ---------- Detalle de sesión ---------- */

  const sheet = $('#session-sheet');
  let lastTrigger = null;
  let restoreFocus = true;

  function openSession(n, trigger) {
    const s = SESSIONS.find(x => x.n === Number(n));
    if (!s) return;
    lastTrigger = trigger || null;
    restoreFocus = true;

    const time = $('#sheet-time');
    time.replaceChildren(timeEl(s.start), ' – ', timeEl(s.end), el('span', { class: 'sheet-duration', text: ` · ${duration(s)}` }));
    $('#sheet-title').textContent = s.title;
    $('#sheet-speakers-label').textContent = s.speakers.length > 1 ? 'Ponentes' : 'Ponente';
    $('#sheet-speakers').replaceChildren(...s.speakers.map(id => {
      const sp = speakerById(id);
      return el('li', { class: 'sheet-speaker' },
        avatar(sp, SPEAKERS.indexOf(sp)),
        el('span', {},
          el('strong', { text: sp.name }),
          el('span', { class: 'sheet-speaker-role', text: sp.role })
        )
      );
    }));
    const ics = $('#sheet-ics');
    ics.href = `sesion-${s.n}.ics`;
    ics.dataset.filename = `sesion-${s.n}-8-octubre-2026.ics`;
    applyDownloadName(ics);

    if (typeof sheet.showModal === 'function') {
      if (!sheet.open) sheet.showModal();
    } else {
      sheet.setAttribute('open', '');
    }
    document.documentElement.classList.add('has-sheet');
    $('#sheet-title').focus();
  }

  function closeSession() {
    if (!sheet.open) return;
    if (typeof sheet.close === 'function') sheet.close();
    else { sheet.removeAttribute('open'); onSheetClosed(); }
  }

  function onSheetClosed() {
    document.documentElement.classList.remove('has-sheet');
    if (restoreFocus && lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    lastTrigger = null;
  }

  function setupSheet() {
    sheet.addEventListener('close', onSheetClosed);
    $('#sheet-close').addEventListener('click', closeSession);
    // Clic fuera del panel (sobre el fondo) cierra el detalle.
    sheet.addEventListener('click', e => { if (e.target === sheet) closeSession(); });
    // Sin <dialog> nativo: Escape cierra igualmente.
    if (typeof sheet.showModal !== 'function') {
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.open) closeSession(); });
    }

    document.addEventListener('click', e => {
      const trigger = e.target.closest('[data-session]');
      if (trigger) openSession(trigger.dataset.session, trigger);
    });
  }

  /* ---------- Navegación ---------- */

  function currentRoute() {
    const r = location.hash.replace(/^#\/?/, '');
    return ROUTES.includes(r) ? r : 'agenda';
  }

  function showRoute(moveFocus) {
    const route = currentRoute();
    if (sheet.open) { restoreFocus = false; closeSession(); }
    $$('[data-view]').forEach(v => { v.hidden = v.dataset.view !== route; });
    $$('[data-route]').forEach(a => {
      if (a.dataset.route === route) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (moveFocus) {
      window.scrollTo(0, 0);
      $(`#h-${route}`).focus({ preventScroll: true });
    }
  }

  function setupRouter() {
    window.addEventListener('hashchange', () => {
      const r = location.hash.replace(/^#\/?/, '');
      if (!r || ROUTES.includes(r)) showRoute(true);
    });
    // Evita el salto del ancla y mantiene el historial limpio al repetir pestaña.
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      if (link.classList.contains('skip-link')) {
        e.preventDefault();
        $('#main').focus();
        return;
      }
      const target = link.getAttribute('href').slice(1);
      if (!ROUTES.includes(target)) return;
      e.preventDefault();
      if (currentRoute() === target && location.hash) showRoute(true);
      else location.hash = target;
    });
    showRoute(false);
  }

  /* ---------- Sesión en curso (hora de Madrid) ---------- */

  const madridFormat = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });

  function updateLive() {
    const p = Object.fromEntries(madridFormat.formatToParts(new Date()).map(x => [x.type, x.value]));
    const today = `${p.year}-${p.month}-${p.day}`;
    const now = Number(p.hour) * 60 + Number(p.minute);
    for (const s of SESSIONS) {
      const live = today === EVENT.date && now >= toMin(s.start) && now < toMin(s.end);
      const button = $(`#session-list [data-session="${s.n}"]`);
      button.classList.toggle('is-live', live);
      $('.live-badge', button).hidden = !live;
    }
  }

  /* ---------- Calendario, mapas, copiar ---------- */

  function applyDownloadName(link) {
    // En iOS se abre el .ics directamente para que Calendario ofrezca añadirlo.
    if (!isIOS && link.dataset.filename) link.setAttribute('download', link.dataset.filename);
    else link.removeAttribute('download');
  }

  const toastEl = $('#toast');
  let toastTimer;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-visible');
      toastTimer = setTimeout(() => { toastEl.textContent = ''; }, 400);
    }, 2800);
  }

  function legacyCopy(text) {
    const area = el('textarea', { readonly: true, 'aria-hidden': 'true', class: 'copy-buffer' });
    area.value = text;
    document.body.append(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    area.remove();
    return ok;
  }

  async function copyAddress() {
    const text = `${EVENT.venue}, ${EVENT.address}`;
    let ok = false;
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); ok = true; } catch (_) { ok = false; }
    }
    if (!ok) ok = legacyCopy(text);
    if (ok) {
      toast('Dirección copiada');
    } else {
      const range = document.createRange();
      range.selectNodeContents($('#venue-address'));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      toast('Dirección seleccionada: cópiala desde el menú');
    }
  }

  /* ---------- Instalación y sin conexión ---------- */

  function setupInstall() {
    const card = $('#install-card');
    const btn = $('#install-btn');
    if (isStandalone) { card.hidden = true; return; }
    let deferred = null;
    const hintIOS = $('#install-hint-ios');
    const hintOther = $('#install-hint-other');
    if (isIOS) hintIOS.hidden = false;
    else hintOther.hidden = false;

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferred = e;
      btn.hidden = false;
      hintOther.hidden = true;
    });
    btn.addEventListener('click', async () => {
      if (!deferred) return;
      deferred.prompt();
      try { await deferred.userChoice; } catch (_) { /* sin respuesta */ }
      deferred = null;
      btn.hidden = true;
      hintOther.hidden = false;
    });
    window.addEventListener('appinstalled', () => { card.hidden = true; });
  }

  function setupOffline() {
    const pill = $('#offline-pill');
    const update = () => { pill.hidden = navigator.onLine; };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();

    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      const firstInstall = !navigator.serviceWorker.controller;
      navigator.serviceWorker.register('./sw.js', { scope: './' }).then(reg => {
        const worker = reg.installing;
        if (!firstInstall || !worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') toast('Agenda guardada para consultarla sin conexión');
        });
      }).catch(() => { /* la web sigue funcionando en línea */ });
    });
  }

  /* ---------- Inicio ---------- */

  bindEventText();
  renderSessions();
  renderSpeakers();
  setupSheet();
  setupRouter();
  $$('.js-ics').forEach(applyDownloadName);
  $('#copy-address').addEventListener('click', copyAddress);
  setupInstall();
  setupOffline();
  updateLive();
  setInterval(updateLive, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateLive(); });
})();
