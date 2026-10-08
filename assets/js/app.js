/* Jornada II · CMm HER2- EN TIEMPOS DE IA — app */
(function () {
  "use strict";

  var D = window.JORNADA;
  var PREVIEW = !!window.__PREVIEW__;
  var ICS_INLINE = window.__ICS__ || null;
  var main = document.getElementById("main");
  var toastEl = document.getElementById("toast");
  var sesiones = D.sesiones;
  var total = sesiones.length;
  var firstLoad = true;
  var route = { view: "agenda" };
  var deferredPrompt = null;

  /* ---------- Utilidades ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // Evita cortes de línea dentro de «HER2-» o «HR+HER2-» sin alterar el texto.
  function t(s) {
    return esc(s).replace(/HR\+HER2-|HER2-/g, function (m) { return '<span class="nw">' + m + "</span>"; });
  }
  function icon(id, cls) {
    return '<svg class="' + (cls || "ico") + '" aria-hidden="true" focusable="false"><use href="#i-' + id + '"/></svg>';
  }
  function at(hhmm) { return new Date(D.fechaISO + "T" + hhmm + ":00" + D.desfase); }
  function iso(hhmm) { return D.fechaISO + "T" + hhmm + ":00" + D.desfase; }
  function minutes(s) { return Math.round((at(s.fin) - at(s.inicio)) / 60000); }
  function horario(s) { return s.inicio + " – " + s.fin; }
  function ponente(id) { for (var i = 0; i < D.ponentes.length; i++) if (D.ponentes[i].id === id) return D.ponentes[i]; return null; }
  function initials(name) {
    return name.replace(/^Dra?\.\s+/, "").split(/\s+/).filter(function (w) { return /^[A-ZÁÉÍÓÚÑ]/.test(w); })
      .slice(0, 2).map(function (w) { return w.charAt(0); }).join("");
  }
  function sessionsOf(id) { return sesiones.filter(function (s) { return s.ponentes.indexOf(id) !== -1; }); }
  var jornadaInicio = sesiones[0].inicio;
  var jornadaFin = sesiones[total - 1].fin;
  var jornadaHorario = jornadaInicio + " – " + jornadaFin;
  var lugarCompleto = D.lugar.hotel + ", " + D.lugar.direccion;

  var ua = navigator.userAgent || "";
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  function isStandalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  }

  // Hora de referencia. «?ahora=2026-10-08T18:40:00+02:00» permite simularla para pruebas.
  var nowOverride = (function () {
    try {
      var p = new URLSearchParams(location.search).get("ahora");
      var d = p ? new Date(p) : null;
      return d && !isNaN(d) ? d.getTime() : null;
    } catch (e) { return null; }
  })();
  var overrideStart = Date.now();
  function now() { return nowOverride !== null ? nowOverride + (Date.now() - overrideStart) : Date.now(); }

  function madridDate(ms) {
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: D.zonaHoraria, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
    } catch (e) { return D.fechaISO; }
  }

  /* ---------- Calendario ---------- */

  function icsFile(n) { return n ? "ics/sesion-" + n + ".ics" : "ics/jornada-completa.ics"; }
  function icsAttrs(n) {
    var file = icsFile(n);
    if (ICS_INLINE) return 'href="' + esc(ICS_INLINE[file]) + '" download="' + file.split("/")[1] + '"';
    var a = 'href="' + file + '"';
    if (isIOS) {
      // En iPhone, Safari abre el .ics con la hoja «Añadir al calendario».
      if (isStandalone()) a += ' target="_blank" rel="noopener"';
    } else {
      a += ' download="' + file.split("/")[1] + '"';
    }
    return a;
  }
  function gcalDate(hhmm) { return D.fechaISO.replace(/-/g, "") + "T" + hhmm.replace(":", "") + "00"; }
  function gcalUrl(s) {
    var title, details, start, end;
    if (s) {
      title = s.titulo + " · " + D.titulo;
      details = D.titulo + "\n" + D.subtitulo + "\n\n" + s.titulo + "\n" + horario(s) + " · Sesión " + s.n + " de " + total + "\n" +
        s.ponentes.map(function (id) { var p = ponente(id); return p.nombre + " | " + p.cargo; }).join("\n");
      start = s.inicio; end = s.fin;
    } else {
      title = D.titulo + " · " + D.subtitulo;
      details = D.subtitulo + "\n" + D.fechaTexto + "\n\n" +
        sesiones.map(function (x) { return horario(x) + " | " + x.titulo + "\n" + x.ponentesTexto; }).join("\n\n");
      start = jornadaInicio; end = jornadaFin;
    }
    return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(title) +
      "&dates=" + gcalDate(start) + "/" + gcalDate(end) +
      "&ctz=" + encodeURIComponent(D.zonaHoraria) +
      "&location=" + encodeURIComponent(lugarCompleto) +
      "&details=" + encodeURIComponent(details);
  }
  function calendarButtons(s) {
    var what = s ? "la sesión " + s.n : "la jornada completa";
    return '<div class="btn-row">' +
      '<a class="btn btn-primary" ' + icsAttrs(s ? s.n : 0) + ">" + icon("calendar-plus") +
      '<span>Añadir al calendario<span class="sr-only">: ' + what + " (archivo .ics)</span></span></a>" +
      '<a class="btn btn-glass" href="' + esc(gcalUrl(s)) + '" target="_blank" rel="noopener">' + icon("external") +
      '<span>Google Calendar<span class="sr-only">: ' + what + " (se abre en otra pestaña)</span></span></a>" +
      "</div>";
  }

  /* ---------- Mapas ---------- */

  var q = encodeURIComponent(lugarCompleto);
  var maps = {
    apple: "https://maps.apple.com/?q=" + encodeURIComponent(D.lugar.hotel) + "&address=" + encodeURIComponent(D.lugar.direccion),
    google: "https://www.google.com/maps/search/?api=1&query=" + q,
    waze: "https://waze.com/ul?q=" + q + "&navigate=yes",
    embed: "https://maps.google.com/maps?q=" + q + "&hl=es&z=16&output=embed"
  };

  /* ---------- Estado en directo ---------- */

  function sessionState(s, ms) {
    if (ms >= at(s.fin).getTime()) return "done";
    if (ms >= at(s.inicio).getTime()) return "live";
    return "upcoming";
  }
  function nextSession(ms) {
    for (var i = 0; i < total; i++) if (ms < at(sesiones[i].inicio).getTime()) return sesiones[i];
    return null;
  }
  function liveSession(ms) {
    for (var i = 0; i < total; i++) if (sessionState(sesiones[i], ms) === "live") return sesiones[i];
    return null;
  }
  function badgeFor(s, ms) {
    var st = sessionState(s, ms);
    if (st === "live") return '<span class="badge badge-live">Ahora</span>';
    if (st === "done") return '<span class="badge badge-done">Finalizada</span>';
    var nx = nextSession(ms);
    if (nx && nx.n === s.n && madridDate(ms) === D.fechaISO) return '<span class="badge badge-next">A continuación</span>';
    return "";
  }
  function statusInfo(ms) {
    var start = at(jornadaInicio).getTime();
    var end = at(jornadaFin).getTime();
    if (ms >= end) return { state: "done", text: "Jornada finalizada" };
    var live = liveSession(ms);
    if (live) return { state: "live", text: "En curso · Sesión " + live.n + " de " + total };
    var diff = start - ms;
    if (madridDate(ms) === D.fechaISO) {
      var m = Math.max(1, Math.ceil(diff / 60000));
      var h = Math.floor(m / 60), r = m % 60;
      var txt = h ? h + " h" + (r ? " " + r + " min" : "") : r + " min";
      return { state: "soon", text: "Hoy · empieza en " + txt };
    }
    var a = new Date(madridDate(ms) + "T00:00:00Z").getTime();
    var b = new Date(D.fechaISO + "T00:00:00Z").getTime();
    var days = Math.round((b - a) / 86400000);
    if (days === 1) return { state: "soon", text: "Mañana a las " + jornadaInicio };
    return { state: "soon", text: "Faltan " + days + " días" };
  }
  function refreshLive() {
    var ms = now();
    var st = document.getElementById("status");
    if (st) {
      var info = statusInfo(ms);
      st.setAttribute("data-state", info.state);
      st.querySelector(".status-text").textContent = info.text;
    }
    var cards = main.querySelectorAll("[data-live-n]");
    for (var i = 0; i < cards.length; i++) {
      var n = +cards[i].getAttribute("data-live-n");
      var s = sesiones[n - 1];
      cards[i].setAttribute("data-state", sessionState(s, ms));
      var slot = cards[i].querySelector(".badge-slot");
      var html = badgeFor(s, ms);
      if (slot && slot.innerHTML !== html) slot.innerHTML = html;
    }
  }

  /* ---------- Vistas ---------- */

  function viewAgenda() {
    var ms = now();
    var cards = sesiones.map(function (s) {
      return '<li><a class="session-card glass" href="#/sesion/' + s.n + '" data-live-n="' + s.n + '" data-state="' + sessionState(s, ms) + '">' +
        '<span class="session-time" aria-hidden="true"><span class="start">' + s.inicio + '</span><span class="end">' + s.fin + '</span><span class="dur">' + minutes(s) + " min</span></span>" +
        '<span class="session-body">' +
        '<span class="session-kicker"><span>Sesión ' + s.n + '</span><span class="sr-only">, ' + horario(s) + ", " + minutes(s) + ' minutos. </span><span class="badge-slot">' + badgeFor(s, ms) + "</span></span>" +
        '<h3 class="session-title">' + t(s.titulo) + "</h3>" +
        '<span class="session-speakers">' + icon("people") + "<span>" + esc(s.ponentesTexto) + "</span></span>" +
        "</span>" + icon("chevron-right") + "</a></li>";
    }).join("");
    var info = statusInfo(ms);
    return '<div class="view agenda-layout">' +
      '<section class="hero glass" aria-labelledby="t-hero">' +
      '<p class="eyebrow">' + icon("calendar") + '<span><span class="sr-only">Fecha: </span>' + esc(D.fechaTexto) + "</span></p>" +
      '<h1 id="t-hero" class="hero-title" tabindex="-1">' + t(D.titulo) + "</h1>" +
      '<p class="hero-sub">' + t(D.subtitulo) + "</p>" +
      '<ul class="chips">' +
      '<li class="chip">' + icon("clock") + '<span><span class="sr-only">Horario: </span>' + jornadaHorario + "</span></li>" +
      '<li class="chip">' + icon("pin") + '<span><span class="sr-only">Lugar: </span>' + esc(D.lugar.hotel) + "</span></li>" +
      "</ul>" +
      '<p class="status" id="status" data-state="' + info.state + '"><span class="dot" aria-hidden="true"></span><span class="status-text">' + esc(info.text) + "</span></p>" +
      calendarButtons(null) +
      '<div class="btn-row" style="margin-top:10px"><a class="btn btn-glass" href="#/ubicacion">' + icon("navigate") + "<span>Cómo llegar</span></a></div>" +
      "</section>" +
      '<section aria-labelledby="t-agenda">' +
      '<div class="agenda-head"><h2 id="t-agenda" class="section-title">Agenda</h2><p>' + total + " sesiones · " + jornadaHorario + "</p></div>" +
      '<ol class="timeline">' + cards + "</ol>" +
      "</section></div>";
  }

  function personItem(p) {
    return '<li><a class="person" href="#/ponentes/' + p.id + '">' +
      '<span class="avatar" aria-hidden="true">' + initials(p.nombre) + "</span>" +
      '<span><span class="person-name">' + esc(p.nombre) + '</span><span class="person-role">' + esc(p.cargo) + "</span></span>" +
      icon("chevron-right") + "</a></li>";
  }

  function viewSesion(n) {
    var s = sesiones[n - 1];
    var ms = now();
    var prev = sesiones[n - 2], next = sesiones[n];
    var stepper = sesiones.map(function (x) {
      return '<li><a href="#/sesion/' + x.n + '" aria-label="Sesión ' + x.n + ": " + esc(x.titulo) + '"' + (x.n === n ? ' aria-current="step"' : "") + ">" + x.n + "</a></li>";
    }).join("");
    var people = s.ponentes.map(function (id) { return personItem(ponente(id)); }).join("");
    var prevLink = prev
      ? '<a class="glass prev" href="#/sesion/' + prev.n + '" rel="prev">' + icon("chevron-left") + '<span class="pager-text"><small>Anterior · ' + prev.inicio + "</small><span>" + t(prev.titulo) + "</span></span></a>"
      : '<a class="glass prev" href="#/">' + icon("chevron-left") + '<span class="pager-text"><small>Volver</small><span>Agenda completa</span></span></a>';
    var nextLink = next
      ? '<a class="glass next" href="#/sesion/' + next.n + '" rel="next"><span class="pager-text"><small>Siguiente · ' + next.inicio + "</small><span>" + t(next.titulo) + "</span></span>" + icon("chevron-right") + "</a>"
      : '<a class="glass next" href="#/"><span class="pager-text"><small>Fin de la jornada</small><span>Agenda completa</span></span>' + icon("chevron-right") + "</a>";
    return '<div class="view">' +
      '<div class="detail-top"><a class="back-link" href="#/">' + icon("chevron-left") + "<span>Agenda</span></a>" +
      '<nav class="stepper" aria-label="Sesiones"><ol>' + stepper + "</ol></nav></div>" +
      '<article class="detail glass" aria-labelledby="t-detail" data-live-n="' + s.n + '" data-state="' + sessionState(s, ms) + '">' +
      '<div class="detail-kicker"><span class="eyebrow">Sesión ' + s.n + " de " + total + '</span><span class="chip">' + icon("clock") + "<span>" + minutes(s) + ' min</span></span><span class="badge-slot">' + badgeFor(s, ms) + "</span></div>" +
      '<p class="detail-time"><time datetime="' + iso(s.inicio) + '">' + s.inicio + '</time><span class="sep"> – </span><time datetime="' + iso(s.fin) + '">' + s.fin + "</time></p>" +
      '<h1 id="t-detail" class="detail-title" tabindex="-1">' + t(s.titulo) + "</h1>" +
      '<div class="detail-grid">' +
      '<section aria-labelledby="t-pon"><h2 id="t-pon" class="label">' + (s.ponentes.length > 1 ? "Ponentes" : "Ponente") + '</h2><ul class="person-list">' + people + "</ul></section>" +
      '<section aria-labelledby="t-lugar"><h2 id="t-lugar" class="label">Lugar</h2><div class="place-box">' + icon("pin") +
      "<div><strong>" + esc(D.lugar.hotel) + "</strong><span>" + esc(D.lugar.direccion) + '</span><a href="#/ubicacion">Cómo llegar</a></div></div></section>' +
      "</div>" +
      '<div class="detail-actions">' + calendarButtons(s) + "</div>" +
      '<p class="kbd-hint">Use <kbd>←</kbd> <kbd>→</kbd> para cambiar de sesión y <kbd>Esc</kbd> para volver a la agenda.</p>' +
      "</article>" +
      '<nav class="pager" aria-label="Sesión anterior y siguiente">' + prevLink + nextLink + "</nav>" +
      "</div>";
  }

  function viewPonentes() {
    var cards = D.ponentes.map(function (p) {
      var list = sessionsOf(p.id).map(function (s) {
        return '<li><a class="mini-session" href="#/sesion/' + s.n + '"><time datetime="' + iso(s.inicio) + '">' + s.inicio + "</time><span>" + t(s.titulo) + "</span>" + icon("chevron-right") + "</a></li>";
      }).join("");
      return '<li class="person-card glass" id="p-' + p.id + '">' +
        '<span class="avatar" aria-hidden="true">' + initials(p.nombre) + "</span>" +
        '<h2 tabindex="-1">' + esc(p.nombre) + "</h2>" +
        '<p class="role">' + esc(p.cargo) + "</p>" +
        '<h3 class="label">Participa en</h3><ul class="sessions">' + list + "</ul></li>";
    }).join("");
    return '<div class="view">' +
      '<header class="page-head"><p class="eyebrow">' + icon("people") + "<span>" + D.ponentes.length + ' ponentes</span></p><h1 class="page-title" tabindex="-1">Ponentes</h1></header>' +
      '<ul class="people-grid">' + cards + "</ul></div>";
  }

  function viewUbicacion() {
    var online = navigator.onLine !== false;
    return '<div class="view">' +
      '<header class="page-head"><p class="eyebrow">' + icon("navigate") + '<span>Cómo llegar</span></p><h1 class="page-title" tabindex="-1">Ubicación</h1></header>' +
      '<div class="place-layout">' +
      '<section class="place-card glass" aria-labelledby="t-hotel">' +
      '<span class="label">Lugar</span>' +
      '<h2 id="t-hotel">' + esc(D.lugar.hotel) + "</h2>" +
      '<p class="address" id="address">' + esc(D.lugar.direccion) + "</p>" +
      '<ul class="chips place-when">' +
      '<li class="chip">' + icon("calendar") + '<span><span class="sr-only">Fecha: </span>' + esc(D.fechaTexto) + "</span></li>" +
      '<li class="chip">' + icon("clock") + '<span><span class="sr-only">Horario: </span>' + jornadaHorario + "</span></li></ul>" +
      '<div class="btn-row"><button class="btn btn-primary" id="copy-btn" type="button">' + icon("copy") + '<span class="copy-label">Copiar dirección</span></button></div>' +
      '<h3 class="label" style="margin-top:28px">Abrir en</h3>' +
      '<ul class="maps-links">' +
      '<li><a class="map-link" href="' + esc(maps.apple) + '" target="_blank" rel="noopener">' + icon("map") + '<span>Mapas de Apple<span class="sr-only"> (se abre en otra pestaña)</span></span>' + icon("external", "ico ext") + "</a></li>" +
      '<li><a class="map-link" href="' + esc(maps.google) + '" target="_blank" rel="noopener">' + icon("map") + '<span>Google Maps<span class="sr-only"> (se abre en otra pestaña)</span></span>' + icon("external", "ico ext") + "</a></li>" +
      '<li><a class="map-link" href="' + esc(maps.waze) + '" target="_blank" rel="noopener">' + icon("navigate") + '<span>Waze<span class="sr-only"> (se abre en otra pestaña)</span></span>' + icon("external", "ico ext") + "</a></li>" +
      "</ul></section>" +
      '<section class="map-card glass" aria-labelledby="t-map"><h2 id="t-map" class="sr-only">Mapa</h2>' +
      '<div class="map-frame" id="map-frame"><div class="map-placeholder">' +
      '<span class="pin" aria-hidden="true">' + icon("pin") + "</span>" +
      '<p id="map-note">' + (online ? "El mapa interactivo se carga desde Google Maps al pulsar el botón." : "Sin conexión: el mapa no está disponible. La dirección y los enlaces siguen aquí.") + "</p>" +
      '<button class="btn btn-blue" id="map-btn" type="button" aria-describedby="map-note"' + (online ? "" : " disabled") + ">" + icon("map") + "<span>Mostrar mapa</span></button>" +
      "</div></div>" +
      '<p class="map-caption"><a href="' + esc(maps.google) + '" target="_blank" rel="noopener">' + icon("external") + '<span>Abrir en Google Maps<span class="sr-only"> (se abre en otra pestaña)</span></span></a></p>' +
      "</section>" +
      "</div></div>";
  }

  function viewInstalar() {
    var iosSteps =
      "<li><p>Abra esta página en <strong>Safari</strong>.</p></li>" +
      '<li><p>Toque <strong>Menú de página</strong> y después <strong>Compartir</strong> <span class="kbd-ico">' + icon("share") + "</span>. Si Compartir aparece directamente en la barra, tóquelo.</p></li>" +
      '<li><p>Desplácese por la lista y elija <strong>Añadir a pantalla de inicio</strong> <span class="kbd-ico">' + icon("plus-square") + "</span>. Si no aparece, vaya al final, toque <strong>Editar acciones</strong> y añada esa opción.</p></li>" +
      "<li><p>Deje activada <strong>Abrir como app web</strong>, si aparece, y toque <strong>Añadir</strong>.</p></li>";
    var androidSteps =
      "<li><p>Abra esta página en <strong>Chrome</strong>.</p></li>" +
      '<li><p>Toque el menú <span class="kbd-ico">' + icon("more-v") + "</span>, arriba a la derecha.</p></li>" +
      "<li><p>Elija <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.</p></li>" +
      "<li><p>Confirme con <strong>Instalar</strong>.</p></li>";
    var androidFirst = isAndroid && !isIOS;
    return '<div class="view">' +
      '<header class="page-head"><p class="eyebrow">' + icon("phone") + '<span>App</span></p><h1 class="page-title" tabindex="-1">Añadir a la pantalla de inicio</h1>' +
      '<p class="lead">Abra la agenda como una app, a pantalla completa. Después de la primera visita, funciona sin conexión.</p></header>' +
      '<div class="install-layout">' +
      '<div class="ready" id="ready" data-ok="false">' + icon("check") + '<span id="ready-text">Comprobando el modo sin conexión…</span></div>' +
      '<div class="install-card glass" id="native-install" hidden><p>Este navegador permite instalar la app directamente.</p>' +
      '<div class="btn-row" style="margin-top:14px"><button class="btn btn-primary" id="install-btn" type="button">' + icon("plus-square") + "<span>Instalar app</span></button></div></div>" +
      '<section class="install-card glass" aria-labelledby="t-guide">' +
      '<h2 id="t-guide" class="section-title">Paso a paso</h2>' +
      '<div class="segmented" role="tablist" aria-label="Tipo de móvil" style="margin-top:16px">' +
      '<button type="button" role="tab" id="tab-ios" aria-controls="panel-ios" aria-selected="' + !androidFirst + '" tabindex="' + (androidFirst ? -1 : 0) + '">iPhone</button>' +
      '<button type="button" role="tab" id="tab-android" aria-controls="panel-android" aria-selected="' + androidFirst + '" tabindex="' + (androidFirst ? 0 : -1) + '">Android</button>' +
      "</div>" +
      '<div role="tabpanel" id="panel-ios" aria-labelledby="tab-ios" tabindex="0"' + (androidFirst ? " hidden" : "") + '><ol class="steps">' + iosSteps + "</ol></div>" +
      '<div role="tabpanel" id="panel-android" aria-labelledby="tab-android" tabindex="0"' + (androidFirst ? "" : " hidden") + '><ol class="steps">' + androidSteps + "</ol></div>" +
      '<p class="note">Después, abra «Jornada II» desde la pantalla de inicio.</p>' +
      "</section></div></div>";
  }

  /* ---------- Enrutado ---------- */

  function parse() {
    var h = location.hash || "";
    if (h && h.indexOf("#/") !== 0) return null; // anclas internas, p. ej. #main
    var parts = h.replace(/^#\/?/, "").split("/");
    var a = parts[0], b = parts[1];
    if (!a) return { view: "agenda" };
    if (a === "sesion" && /^\d+$/.test(b) && +b >= 1 && +b <= total) return { view: "sesion", n: +b };
    if (a === "ponentes") return { view: "ponentes", id: b && ponente(b) ? b : null };
    if (a === "ubicacion") return { view: "ubicacion" };
    if (a === "instalar") return { view: "instalar" };
    return { view: "agenda" };
  }

  var baseTitle = D.titulo + " · Jornada II";
  function render() {
    var r = parse();
    if (!r) return;
    route = r;
    var html, title, tab;
    switch (r.view) {
      case "sesion":
        html = viewSesion(r.n); tab = "agenda";
        title = "Sesión " + r.n + " · " + sesiones[r.n - 1].titulo + " · Jornada II"; break;
      case "ponentes": html = viewPonentes(); tab = "ponentes"; title = "Ponentes · " + baseTitle; break;
      case "ubicacion": html = viewUbicacion(); tab = "ubicacion"; title = "Ubicación · " + baseTitle; break;
      case "instalar": html = viewInstalar(); tab = "instalar"; title = "Instalar · " + baseTitle; break;
      default: html = viewAgenda(); tab = "agenda"; title = baseTitle;
    }
    main.innerHTML = html;
    document.title = title;
    var links = document.querySelectorAll(".tabbar a[data-tab]");
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute("data-tab") === tab) links[i].setAttribute("aria-current", "page");
      else links[i].removeAttribute("aria-current");
    }
    bindView(r);
    var target = null;
    if (r.view === "ponentes" && r.id) {
      var card = document.getElementById("p-" + r.id);
      if (card) { card.classList.add("is-target"); target = card.querySelector("h2"); }
    }
    if (!firstLoad || target) {
      if (!target) { window.scrollTo(0, 0); target = main.querySelector("h1"); }
      if (target) {
        target.focus({ preventScroll: true });
        if (r.view === "ponentes" && r.id) target.closest(".person-card").scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
    }
    firstLoad = false;
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function go(hash) { if (location.hash !== hash) location.hash = hash; }

  /* ---------- Interacciones por vista ---------- */

  function bindView(r) {
    if (r.view === "ubicacion") {
      var copyBtn = document.getElementById("copy-btn");
      copyBtn.addEventListener("click", function () { copyAddress(copyBtn); });
      var mapBtn = document.getElementById("map-btn");
      mapBtn.addEventListener("click", loadMap);
    }
    if (r.view === "instalar") {
      bindTabs();
      var ib = document.getElementById("install-btn");
      ib.addEventListener("click", function () {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function () { deferredPrompt = null; updateInstallUI(); });
      });
      updateInstallUI();
      refreshReady();
    }
  }

  function bindTabs() {
    var tabs = Array.prototype.slice.call(main.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (x) {
        var on = x === tab;
        x.setAttribute("aria-selected", on ? "true" : "false");
        x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var k = e.key, j = null;
        if (k === "ArrowRight" || k === "ArrowDown") j = (i + 1) % tabs.length;
        else if (k === "ArrowLeft" || k === "ArrowUp") j = (i - 1 + tabs.length) % tabs.length;
        else if (k === "Home") j = 0;
        else if (k === "End") j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); e.stopPropagation(); select(tabs[j], true); }
      });
    });
  }

  function copyAddress(btn) {
    var text = D.lugar.direccion;
    var label = btn.querySelector(".copy-label");
    function done(ok) {
      if (ok) {
        btn.querySelector("use").setAttribute("href", "#i-check");
        label.textContent = "Dirección copiada";
        toast("Dirección copiada al portapapeles");
        clearTimeout(btn._t);
        btn._t = setTimeout(function () {
          if (!document.body.contains(btn)) return;
          btn.querySelector("use").setAttribute("href", "#i-copy");
          label.textContent = "Copiar dirección";
        }, 2500);
      } else {
        var el = document.getElementById("address");
        try {
          var range = document.createRange();
          range.selectNodeContents(el);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (e) { /* sin selección */ }
        toast("No se pudo copiar. La dirección está seleccionada para copiarla a mano.");
      }
    }
    function fallback() {
      var ok = false;
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
        btn.focus();
      } catch (e) { ok = false; }
      done(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    } else {
      fallback();
    }
  }

  function loadMap() {
    if (navigator.onLine === false) { toast("Sin conexión: el mapa no está disponible."); return; }
    var frame = document.getElementById("map-frame");
    frame.innerHTML = '<iframe title="Mapa de Google Maps: ' + esc(D.lugar.hotel) + '" src="' + esc(maps.embed) +
      '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
    toast("Cargando mapa…");
  }

  /* ---------- Teclado y gestos ---------- */

  // La ruta se lee de location.hash (se actualiza al instante) para no perder pulsaciones rápidas.
  function currentSession() { var r = parse(); return r && r.view === "sesion" ? r.n : 0; }

  document.addEventListener("keydown", function (e) {
    var n = currentSession();
    if (!n || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var tag = (e.target && e.target.tagName) || "";
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
    if (e.key === "ArrowLeft" && n > 1) { e.preventDefault(); go("#/sesion/" + (n - 1)); }
    else if (e.key === "ArrowRight" && n < total) { e.preventDefault(); go("#/sesion/" + (n + 1)); }
    else if (e.key === "Escape") { e.preventDefault(); go("#/"); }
  });

  var touch = null;
  main.addEventListener("touchstart", function (e) {
    if (route.view !== "sesion" || e.touches.length !== 1) { touch = null; return; }
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }, { passive: true });
  main.addEventListener("touchend", function (e) {
    if (!touch || route.view !== "sesion") return;
    var dx = e.changedTouches[0].clientX - touch.x;
    var dy = e.changedTouches[0].clientY - touch.y;
    var fast = Date.now() - touch.t < 600;
    touch = null;
    if (!fast || Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.8) return;
    var n = currentSession();
    if (!n) return;
    if (dx < 0 && n < total) go("#/sesion/" + (n + 1));
    else if (dx > 0 && n > 1) go("#/sesion/" + (n - 1));
  }, { passive: true });

  // Enlaces internos por JS: así también funcionan si la app se muestra dentro de un iframe (srcdoc).
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#/"]') : null;
    if (!a) return;
    e.preventDefault();
    go(a.getAttribute("href"));
  });

  var skip = document.querySelector(".skip-link");
  if (skip) skip.addEventListener("click", function (e) {
    e.preventDefault();
    main.focus();
  });

  /* ---------- Avisos ---------- */

  var toastTimer;
  function toast(msg, action) {
    clearTimeout(toastTimer);
    toastEl.textContent = "";
    var span = document.createElement("span");
    span.textContent = msg;
    toastEl.appendChild(span);
    if (action) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = action.label;
      b.addEventListener("click", action.fn);
      toastEl.appendChild(b);
    }
    toastEl.classList.add("show");
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("show");
      setTimeout(function () { if (!toastEl.classList.contains("show")) toastEl.textContent = ""; }, 400);
    }, action ? 10000 : 3000);
  }

  /* ---------- Conexión ---------- */

  var netEl = document.getElementById("net-status");
  function updateNet() {
    var off = navigator.onLine === false;
    netEl.hidden = !off;
    var mb = document.getElementById("map-btn");
    var note = document.getElementById("map-note");
    if (mb) {
      mb.disabled = off;
      if (note) note.textContent = off ? "Sin conexión: el mapa no está disponible. La dirección y los enlaces siguen aquí." : "El mapa interactivo se carga desde Google Maps al pulsar el botón.";
    }
  }
  window.addEventListener("online", updateNet);
  window.addEventListener("offline", updateNet);

  /* ---------- Instalación y modo sin conexión ---------- */

  var installTab = document.querySelector("[data-install-tab]");
  function updateInstallUI() {
    if (installTab) installTab.hidden = isStandalone();
    var box = document.getElementById("native-install");
    if (box) box.hidden = !deferredPrompt || isStandalone();
  }
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    updateInstallUI();
  });
  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    updateInstallUI();
    toast("App instalada");
  });

  function setReady(ok, text) {
    var box = document.getElementById("ready");
    if (!box) return;
    box.setAttribute("data-ok", ok ? "true" : "false");
    document.getElementById("ready-text").textContent = text;
  }
  function refreshReady() {
    if (!document.getElementById("ready")) return;
    if (PREVIEW) { setReady(false, "Vista previa: el modo sin conexión se activa en la versión publicada."); return; }
    if (!("serviceWorker" in navigator) || !("caches" in window)) {
      setReady(false, "Este navegador no permite el uso sin conexión.");
      return;
    }
    navigator.serviceWorker.getRegistration().then(function (reg) {
      if (!reg || !reg.active) { setReady(false, "Preparando el uso sin conexión…"); return; }
      return caches.keys().then(function (keys) {
        var k = keys.filter(function (x) { return x.indexOf("jornada-ii-") === 0; })[0];
        if (!k) { setReady(false, "Preparando el uso sin conexión…"); return; }
        return caches.open(k).then(function (c) {
          return c.match(new URL("assets/js/app.js", location.href).href);
        }).then(function (hit) {
          if (hit) setReady(true, isStandalone() ? "App instalada y disponible sin conexión." : "Disponible sin conexión en este dispositivo.");
          else setReady(false, "Preparando el uso sin conexión…");
        });
      });
    }).catch(function () { setReady(false, "No se pudo comprobar el modo sin conexión."); });
  }

  if (!PREVIEW && "serviceWorker" in navigator &&
      (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (hadController) toast("Hay una versión actualizada de la agenda.", { label: "Actualizar", fn: function () { location.reload(); } });
      hadController = true;
      refreshReady();
    });
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js", { scope: "./" }).then(function (reg) {
        reg.addEventListener("updatefound", function () {
          var w = reg.installing;
          if (w) w.addEventListener("statechange", function () { if (w.state === "activated") refreshReady(); });
        });
        return navigator.serviceWorker.ready;
      }).then(refreshReady).catch(function () { refreshReady(); });
    });
  }

  /* ---------- Arranque ---------- */

  window.addEventListener("hashchange", render);
  render();
  updateNet();
  updateInstallUI();
  setInterval(refreshLive, 20000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) refreshLive(); });
})();
