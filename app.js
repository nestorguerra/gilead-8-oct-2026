'use strict';

// Contenido tomado literalmente de agenda.docx.
const PONENTES = {
  gion: { nombre: 'Dra. María Gión Cortés', rol: 'Oncología Médica, H.U. Ramón y Cajal' },
  lopez: { nombre: 'Dr. Alfonso López de Sa Lorenzo', rol: 'Oncología Médica, H. Clínico San Carlos' },
  garcia: { nombre: 'Dra. Coral García Quevedo Suero', rol: 'MIR Oncología Médica, H.U. Ramón y Cajal' },
  guerra: { nombre: 'Néstor Guerra', rol: 'Experto en IA y transformación digital aplicable a la Oncología Médica' }
};

const ORDEN_PONENTES = ['gion', 'lopez', 'garcia', 'guerra'];

const SESIONES = [
  { inicio: '18:00', fin: '18:05', titulo: 'Bienvenida', ponentes: ['gion'] },
  { inicio: '18:05', fin: '18:35', titulo: 'ADCs en CMm HR+ HER2-: ¿cuál, cuándo y por qué?', ponentes: ['lopez'] },
  { inicio: '18:35', fin: '19:05', titulo: 'Resolviendo un caso clínico de CMm HR+ HER2- con TRODELVY', ponentes: ['garcia'] },
  { inicio: '19:05', fin: '20:10', titulo: 'TALLER PRÁCTICO 2 – Oncología 2.0: crea tu propio agente de IA', ponentes: ['guerra', 'gion'] },
  { inicio: '20:10', fin: '20:15', titulo: 'Conclusiones finales', ponentes: ['gion'] }
];

const FECHA_EVENTO = '2026-10-08';
const DIRECCION_COMPLETA = 'Hotel The Westin Madrid Cuzco, P.º de la Castellana, 133, Tetuán, 28046 Madrid';
const VISTAS = ['agenda', 'ponentes', 'lugar'];

const $ = (selector) => document.querySelector(selector);

function crear(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

function aMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function duracion(sesion) {
  return aMinutos(sesion.fin) - aMinutos(sesion.inicio) + ' min';
}

function iniciales(nombre) {
  return nombre
    .replace(/^(Dra?\.)\s+/, '')
    .split(/\s+/)
    .filter((parte) => /^[A-ZÁÉÍÓÚÑ]/.test(parte))
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('');
}

function nombresPonentes(sesion) {
  return sesion.ponentes.map((id) => PONENTES[id].nombre).join(', ');
}

/* ---------- Sesión en curso (hora de Madrid) ---------- */

function ahoraEnMadrid() {
  try {
    const partes = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const valor = (tipo) => partes.find((p) => p.type === tipo).value;
    return {
      fecha: `${valor('year')}-${valor('month')}-${valor('day')}`,
      minutos: Number(valor('hour')) * 60 + Number(valor('minute'))
    };
  } catch (error) {
    return null;
  }
}

function indiceEnCurso() {
  const ahora = ahoraEnMadrid();
  if (!ahora || ahora.fecha !== FECHA_EVENTO) return -1;
  return SESIONES.findIndex((s) => ahora.minutos >= aMinutos(s.inicio) && ahora.minutos < aMinutos(s.fin));
}

function marcarEnCurso() {
  const actual = indiceEnCurso();
  document.querySelectorAll('.sesion').forEach((boton, indice) => {
    const enCurso = indice === actual;
    boton.classList.toggle('sesion--ahora', enCurso);
    boton.querySelector('.sesion__ahora').hidden = !enCurso;
  });
}

/* ---------- Render ---------- */

function pintarAgenda() {
  const lista = $('#lista-sesiones');
  SESIONES.forEach((sesion, indice) => {
    const item = crear('li');
    const boton = crear('button', 'sesion');
    boton.type = 'button';
    boton.dataset.indice = indice;
    boton.setAttribute('aria-haspopup', 'dialog');

    const hora = crear('span', 'sesion__hora');
    hora.append(crear('span', 'sesion__inicio', sesion.inicio), crear('span', 'sesion__fin', sesion.fin));
    hora.setAttribute('aria-label', `${sesion.inicio} a ${sesion.fin}`);

    const texto = crear('span', 'sesion__texto');
    const ahora = crear('span', 'sesion__ahora', 'Ahora');
    ahora.hidden = true;
    texto.append(ahora, crear('span', 'sesion__titulo', sesion.titulo), crear('span', 'sesion__ponentes', nombresPonentes(sesion)));

    const flecha = crear('span', 'sesion__flecha');
    flecha.setAttribute('aria-hidden', 'true');
    flecha.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>';

    boton.append(hora, texto, flecha);
    boton.addEventListener('click', () => abrirDetalle(indice, boton));
    item.append(boton);
    lista.append(item);
  });
  marcarEnCurso();
  setInterval(marcarEnCurso, 30000);
}

function pintarPonentes() {
  const lista = $('#lista-ponentes');
  ORDEN_PONENTES.forEach((id) => {
    const ponente = PONENTES[id];
    const item = crear('li', 'panel ponente');
    const avatar = crear('span', 'ponente__avatar', iniciales(ponente.nombre));
    avatar.setAttribute('aria-hidden', 'true');

    const cuerpo = crear('div', 'ponente__cuerpo');
    cuerpo.append(crear('h3', 'ponente__nombre', ponente.nombre), crear('p', 'ponente__rol', ponente.rol));

    const sesiones = crear('ul', 'ponente__sesiones');
    sesiones.setAttribute('aria-label', `Sesiones de ${ponente.nombre}`);
    SESIONES.forEach((sesion, indice) => {
      if (!sesion.ponentes.includes(id)) return;
      const li = crear('li');
      const boton = crear('button', 'chip');
      boton.type = 'button';
      boton.setAttribute('aria-haspopup', 'dialog');
      boton.append(crear('span', 'chip__hora', sesion.inicio), document.createTextNode(' ' + sesion.titulo));
      boton.addEventListener('click', () => abrirDetalle(indice, boton));
      li.append(boton);
      sesiones.append(li);
    });

    cuerpo.append(sesiones);
    item.append(avatar, cuerpo);
    lista.append(item);
  });
}

/* ---------- Detalle de sesión ---------- */

const dialogo = $('#detalle');
let indiceActual = 0;
let origenFoco = null;

function rellenarDetalle(indice) {
  const sesion = SESIONES[indice];
  indiceActual = indice;
  $('#detalle-contador').textContent = `Sesión ${indice + 1} de ${SESIONES.length}`;
  $('#detalle-hora').textContent = `${sesion.inicio} – ${sesion.fin} · ${duracion(sesion)}`;
  $('#detalle-titulo').textContent = sesion.titulo;

  const lista = $('#detalle-ponentes');
  lista.replaceChildren();
  sesion.ponentes.forEach((id) => {
    const ponente = PONENTES[id];
    const li = crear('li');
    const avatar = crear('span', 'ponente__avatar ponente__avatar--peque', iniciales(ponente.nombre));
    avatar.setAttribute('aria-hidden', 'true');
    const texto = crear('span');
    texto.append(crear('strong', '', ponente.nombre), crear('span', 'detalle__rol', ponente.rol));
    li.append(avatar, texto);
    lista.append(li);
  });

  $('#detalle-calendario').href = `ics/sesion-${indice + 1}.ics`;
  $('#detalle-anterior').disabled = indice === 0;
  $('#detalle-siguiente').disabled = indice === SESIONES.length - 1;
}

function abrirDetalle(indice, origen) {
  origenFoco = origen || document.activeElement;
  rellenarDetalle(indice);
  if (dialogo.open) return;
  if (typeof dialogo.showModal === 'function') {
    dialogo.showModal();
  } else {
    dialogo.setAttribute('open', '');
  }
  document.documentElement.classList.add('con-dialogo');
  $('#detalle-cerrar').focus();
}

function cerrarDetalle(devolverFoco = true) {
  if (!dialogo.open) return;
  if (typeof dialogo.close === 'function') {
    dialogo.close();
  } else {
    dialogo.removeAttribute('open');
    alCerrar();
  }
  if (!devolverFoco) origenFoco = null;
}

function alCerrar() {
  document.documentElement.classList.remove('con-dialogo');
  if (origenFoco && document.contains(origenFoco)) origenFoco.focus();
  origenFoco = null;
}

function moverDetalle(paso) {
  const nuevo = indiceActual + paso;
  if (nuevo < 0 || nuevo >= SESIONES.length) return;
  rellenarDetalle(nuevo);
  const boton = paso < 0 ? $('#detalle-anterior') : $('#detalle-siguiente');
  if (boton.disabled) $(paso < 0 ? '#detalle-siguiente' : '#detalle-anterior').focus();
  // El foco vuelve a la sesión mostrada en la lista al cerrar.
  origenFoco = document.querySelector(`.sesion[data-indice="${nuevo}"]`) || origenFoco;
}

function prepararDetalle() {
  $('#detalle-cerrar').addEventListener('click', () => cerrarDetalle());
  $('#detalle-anterior').addEventListener('click', () => moverDetalle(-1));
  $('#detalle-siguiente').addEventListener('click', () => moverDetalle(1));
  $('#detalle-lugar').addEventListener('click', () => cerrarDetalle(false));
  dialogo.addEventListener('close', alCerrar);

  // Cerrar al tocar fuera del panel.
  dialogo.addEventListener('click', (evento) => {
    if (evento.target !== dialogo) return;
    const caja = dialogo.getBoundingClientRect();
    const fuera = evento.clientX < caja.left || evento.clientX > caja.right ||
      evento.clientY < caja.top || evento.clientY > caja.bottom;
    if (fuera) cerrarDetalle();
  });

  dialogo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && typeof dialogo.showModal !== 'function') cerrarDetalle();
    if (evento.target.closest('a, button') && !evento.target.closest('.detalle__barra')) return;
    if (evento.key === 'ArrowLeft') moverDetalle(-1);
    if (evento.key === 'ArrowRight') moverDetalle(1);
  });
}

/* ---------- Navegación entre vistas ---------- */

function vistaDesdeHash() {
  const nombre = location.hash.replace('#', '');
  return VISTAS.includes(nombre) ? nombre : 'agenda';
}

function mostrarVista(moverFoco) {
  const actual = vistaDesdeHash();
  document.querySelectorAll('.vista').forEach((vista) => {
    vista.hidden = vista.dataset.vista !== actual;
  });
  document.querySelectorAll('.pestana').forEach((pestana) => {
    if (pestana.dataset.vista === actual) {
      pestana.setAttribute('aria-current', 'page');
    } else {
      pestana.removeAttribute('aria-current');
    }
  });
  if (moverFoco) {
    window.scrollTo(0, 0);
    $(`#titulo-${actual}`).focus({ preventScroll: true });
  }
}

function prepararNavegacion() {
  $('.saltar').addEventListener('click', (evento) => {
    evento.preventDefault();
    $('#contenido').focus();
    $('#contenido').scrollIntoView({ block: 'start' });
  });
  window.addEventListener('hashchange', () => mostrarVista(true));
  mostrarVista(false);
}

/* ---------- Lugar ---------- */

async function copiarTexto(texto) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(texto);
    return;
  }
  const campo = document.createElement('textarea');
  campo.value = texto;
  campo.setAttribute('readonly', '');
  campo.style.position = 'fixed';
  campo.style.opacity = '0';
  document.body.append(campo);
  campo.select();
  const ok = document.execCommand('copy');
  campo.remove();
  if (!ok) throw new Error('No se pudo copiar');
}

function prepararLugar() {
  const aviso = $('#copiado');
  let temporizador;
  $('#boton-copiar').addEventListener('click', async () => {
    try {
      await copiarTexto(DIRECCION_COMPLETA);
      aviso.textContent = 'Dirección copiada.';
    } catch (error) {
      aviso.textContent = 'No se pudo copiar. Dirección: ' + DIRECCION_COMPLETA;
    }
    clearTimeout(temporizador);
    temporizador = setTimeout(() => { aviso.textContent = ''; }, 4000);
  });
}

/* ---------- Sin conexión e instalación ---------- */

function prepararConexion() {
  const aviso = $('#aviso-conexion');
  const actualizar = () => {
    aviso.hidden = navigator.onLine;
    aviso.textContent = navigator.onLine ? '' : 'Sin conexión. Estás viendo la agenda guardada.';
  };
  window.addEventListener('online', actualizar);
  window.addEventListener('offline', actualizar);
  actualizar();

  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.serviceWorker.ready.then(() => {
    $('#estado-offline').textContent = 'Agenda guardada en este dispositivo: puedes consultarla sin conexión.';
  });
}

function prepararInstalacion() {
  const boton = $('#boton-instalar');
  const ayuda = $('#instalar-ayuda');
  const independiente = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let peticion = null;

  if (independiente) {
    ayuda.textContent = 'Ya la tienes en tu pantalla de inicio.';
  } else if (esIOS) {
    ayuda.textContent = 'Para añadirla a la pantalla de inicio, toca Compartir y después «Añadir a pantalla de inicio».';
  }

  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault();
    peticion = evento;
    boton.hidden = false;
  });

  boton.addEventListener('click', async () => {
    if (!peticion) return;
    peticion.prompt();
    await peticion.userChoice.catch(() => {});
    peticion = null;
    boton.hidden = true;
  });

  window.addEventListener('appinstalled', () => {
    boton.hidden = true;
    ayuda.textContent = 'Añadida a tu pantalla de inicio.';
  });
}

pintarAgenda();
pintarPonentes();
prepararDetalle();
prepararNavegacion();
prepararLugar();
prepararConexion();
prepararInstalacion();
