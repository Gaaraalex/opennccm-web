// Trae del repositorio de OpenNCCM lo que la web muestra y que cambia con cada versión:
// historial de versiones (CHANGELOG.md), última versión publicada y capturas del README.
//
//   node scripts/build.mjs                 → descarga de GitHub (rama main)
//   OPENNCCM_SRC=../opennccm node scripts/build.mjs  → usa una copia local del repositorio
//
// Escribe site/data/novedades.json y site/img/capturas/*.png. Sin dependencias: solo Node 20+.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "Gaaraalex/opennccm";
const RAW = `https://raw.githubusercontent.com/${REPO}/main/`;
const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const SRC = process.env.OPENNCCM_SRC;
const DOMINIO = "https://opennccm.com";
const CAPTURAS = ["hero", "panel", "equipo", "diff", "consola", "cumplimiento", "analisis", "temas"];

async function leer(ruta, binario = false) {
  if (SRC) return readFile(join(SRC, ruta), binario ? undefined : "utf8");
  const r = await fetch(RAW + ruta);
  if (!r.ok) throw new Error(`${ruta}: HTTP ${r.status}`);
  return binario ? Buffer.from(await r.arrayBuffer()) : r.text();
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Markdown en línea del CHANGELOG: **negrita**, `código` y [enlaces](url).
function enLinea(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>');
}

// Bloque de una versión: párrafos y listas con un nivel de anidación (sangría de 2 espacios).
function bloque(lineas) {
  const items = []; // { nivel, texto } o { parrafo }
  for (const l of lineas) {
    if (!l.trim()) continue;
    const m = l.match(/^(\s*)- (.*)$/);
    if (m) items.push({ nivel: m[1].length >= 2 ? 1 : 0, texto: m[2] });
    else if (items.length && !items.at(-1).parrafo) items.at(-1).texto += " " + l.trim();
    else items.push({ parrafo: l.trim() });
  }
  let html = "", abiertas = 0;
  const cerrarHasta = (n) => { while (abiertas > n) { html += "</li></ul>"; abiertas--; } };
  for (const it of items) {
    if (it.parrafo) { cerrarHasta(0); html += `<p>${enLinea(it.parrafo)}</p>`; continue; }
    const objetivo = it.nivel + 1;
    if (abiertas < objetivo) { while (abiertas < objetivo) { html += "<ul><li>"; abiertas++; } }
    else { cerrarHasta(objetivo); html += "</li><li>"; }
    html += enLinea(it.texto);
  }
  cerrarHasta(0);
  return html;
}

function parsearChangelog(md) {
  const versiones = [];
  let actual = null;
  for (const l of md.split(/\r?\n/)) {
    const m = l.match(/^## (\d+\.\d+\.\d+)/);
    if (m) { actual = { version: m[1], lineas: [] }; versiones.push(actual); }
    else if (actual) actual.lineas.push(l);
  }
  return versiones.map((v) => {
    const titulos = v.lineas.map((l) => l.match(/^- \*\*(.+?)\*\*/)).filter(Boolean).map((m) => m[1].replace(/[:.]$/, ""));
    return { version: v.version, destacados: titulos.slice(0, 4), html: bloque(v.lineas) };
  });
}

async function fechasDeVersiones() {
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, {
      headers: process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {},
    });
    if (!r.ok) return {};
    return Object.fromEntries((await r.json()).map((x) => [x.tag_name.replace(/^v/, ""), x.published_at]));
  } catch { return {}; }
}

const versiones = parsearChangelog(await leer("CHANGELOG.md"));
const fechas = await fechasDeVersiones();
for (const v of versiones) v.fecha = fechas[v.version] || null;

await mkdir(join(SITE, "data"), { recursive: true });
await mkdir(join(SITE, "img", "capturas"), { recursive: true });
await writeFile(join(SITE, "data", "novedades.json"), JSON.stringify({
  generado: new Date().toISOString(),
  ultima: versiones[0]?.version,
  versiones,
}, null, 1));
// El sitemap lleva la fecha de la última versión: así los buscadores saben cuándo cambió la web.
const ultimaFecha = (versiones[0]?.fecha || new Date().toISOString()).slice(0, 10);
// Cada página con sus traducciones (hreflang); x-default apunta a la versión en inglés.
const PAGINAS = [
  { es: "/", en: "/en/" },
  { es: "/novedades.html", en: "/en/changelog.html" },
];
const alternativas = (p) => ["es", "en"].map((l) =>
  `    <xhtml:link rel="alternate" hreflang="${l}" href="${DOMINIO}${p[l]}"/>`).join("\n") +
  `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${DOMINIO}${p.en}"/>`;
await writeFile(join(SITE, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${PAGINAS.flatMap((p) => ["es", "en"].map((l) => `  <url>
    <loc>${DOMINIO}${p[l]}</loc>
    <lastmod>${ultimaFecha}</lastmod>
${alternativas(p)}
  </url>`)).join("\n")}
</urlset>
`);
for (const c of CAPTURAS) {
  await writeFile(join(SITE, "img", "capturas", `${c}.png`), await leer(`docs/readme/${c}.png`, true));
}
console.log(`OK: ${versiones.length} versiones (última ${versiones[0]?.version}), ${CAPTURAS.length} capturas`);
