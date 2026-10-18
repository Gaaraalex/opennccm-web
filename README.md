# Web de OpenNCCM

**https://opennccm.com** · Página pública de [OpenNCCM](https://github.com/Gaaraalex/opennccm). HTML, CSS y JavaScript sin
frameworks, publicada en GitHub Pages con dominio propio (DNS en Cloudflare; `opennccm.org` redirige a `opennccm.com`).

## Cómo se mantiene al día

- `scripts/build.mjs` trae del repositorio de OpenNCCM el `CHANGELOG.md`, las fechas de cada versión y las capturas
  del README, y genera `site/data/novedades.json` y `site/img/capturas/`.
- El flujo **Publicar la web** lo ejecuta y publica la web en cada cambio en `main`, cada 6 horas y cuando el
  repositorio de OpenNCCM envía el aviso `nueva-version`. Una versión nueva del sistema aparece en la web sola.
- Los cambios de diseño o de texto van por rama y pull request, igual que en el proyecto principal.

## Trabajar en local

```bash
node scripts/build.mjs        # novedades y capturas desde GitHub
node scripts/servir.mjs       # http://localhost:8080
node scripts/comprobar.mjs    # enlaces internos
```

Con una copia local del sistema: `OPENNCCM_SRC=../opennccm node scripts/build.mjs`.

## Estructura

```
site/index.html        portada: funciones, capturas, instalación, fabricantes, novedades, documentación
site/novedades.html    historial completo de versiones
site/css/estilo.css    estilos (tema oscuro, adaptable al teléfono)
site/js/web.js         menú, galería, copiar comandos y carga de novedades
```
