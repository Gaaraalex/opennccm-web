// Comprueba que cada enlace, imagen, script y hoja de estilo local de las páginas exista en site/,
// y que cada página con hreflang enlace a traducciones que existen.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const DOMINIO = "https://opennccm.com";
const paginas = readdirSync(SITE, { recursive: true }).filter((f) => f.endsWith(".html")).map((f) => join(SITE, f));
const destino = (dir, ruta) => {
  const d = ruta.startsWith("/") ? join(SITE, ruta) : join(dir, ruta);
  return ruta.endsWith("/") || ruta === "." || ruta === "./" || ruta === ".." || ruta === "../" ? join(d, "index.html") : d;
};

let errores = 0;
const error = (msg) => { console.error(msg); errores++; };
for (const archivo of paginas) {
  const pagina = relative(SITE, archivo);
  const html = readFileSync(archivo, "utf8");
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const [, ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (ref.startsWith(DOMINIO)) {
      if (!existsSync(destino(SITE, ref.slice(DOMINIO.length)))) error(`${pagina}: no existe ${ref}`);
      continue;
    }
    if (/^(https?:|mailto:|data:)/.test(ref)) continue;
    const [ruta, ancla] = ref.split("#");
    if (!ruta) { if (ancla && !ids.has(ancla)) error(`${pagina}: falta el ancla #${ancla}`); continue; }
    if (!existsSync(destino(dirname(archivo), ruta))) error(`${pagina}: no existe ${ref}`);
  }
  if (pagina !== "404.html" && !/hreflang="x-default"/.test(html)) error(`${pagina}: sin hreflang`);
}
const datos = JSON.parse(readFileSync(join(SITE, "data", "novedades.json"), "utf8"));
if (!datos.versiones?.length) error("novedades.json sin versiones");
if (errores) process.exit(1);
console.log(`OK: ${paginas.length} páginas con enlaces y traducciones correctos, ${datos.versiones.length} versiones`);
