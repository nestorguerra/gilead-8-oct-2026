# CMm HER2- EN TIEMPOS DE IA · Jornada II

App web (PWA estática) con la agenda de la jornada del jueves 8 de octubre de 2026.
Todos los textos salen de `assets/js/data.js`, copiados literalmente de la agenda en Word.

## Publicar en GitHub Pages

1. Cree un repositorio llamado **`gilead-8-oct-2026`**.
2. Suba el contenido de esta carpeta a la raíz de la rama `main` (incluido el archivo oculto `.nojekyll`).
3. En **Settings → Pages**, elija **Deploy from a branch**, rama `main`, carpeta `/ (root)`.
4. La app quedará en `https://<usuario>.github.io/gilead-8-oct-2026/`.

Todas las rutas son relativas: funciona en esa subcarpeta sin configuración adicional.
Un sitio de GitHub Pages es público aunque el repositorio sea privado. La página incluye `noindex, nofollow`.

## Si cambia la agenda

1. Edite `assets/js/data.js`.
2. Ejecute `node tools/build.mjs` (Node 18+, sin dependencias). Regenera los `.ics`, el manifest, el contenido `<noscript>` y la versión del service worker.
3. Suba los cambios. Los móviles que ya tengan la app verán el aviso «Hay una versión actualizada de la agenda».

## Estructura

- `index.html` · estructura y navegación
- `assets/js/data.js` · datos de la jornada (fuente única)
- `assets/js/app.js` · vistas, calendario, mapas, copia de dirección e instalación
- `assets/css/app.css` · estilos (claro y oscuro)
- `ics/` · calendario por sesión y de la jornada completa (zona Europe/Madrid)
- `manifest.webmanifest`, `sw.js`, `assets/icons/` · PWA y uso sin conexión
- `404.html` · página de error de GitHub Pages

Para probar una hora concreta: añada `?ahora=2026-10-08T18:40:00+02:00` a la URL.
