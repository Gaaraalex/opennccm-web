// Comprueba que cada enlace, imagen, script y hoja de estilo local de las páginas exista en site/.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
let errores = 0;
for (const pagina of readdirSync(SITE).filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(join(SITE, pagina), "utf8");
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const [, ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(ref)) continue;
    const [ruta, ancla] = ref.split("#");
    if (!ruta) { if (ancla && !ids.has(ancla)) { console.error(`${pagina}: falta el ancla #${ancla}`); errores++; } continue; }
    const destino = join(SITE, ruta.endsWith("/") || ruta === "." || ruta === "./" ? join(ruta, "index.html") : ruta);
    if (!existsSync(destino)) { console.error(`${pagina}: no existe ${ref}`); errores++; }
  }
}
const datos = JSON.parse(readFileSync(join(SITE, "data", "novedades.json"), "utf8"));
if (!datos.versiones?.length) { console.error("novedades.json sin versiones"); errores++; }
if (errores) process.exit(1);
console.log(`OK: enlaces correctos, ${datos.versiones.length} versiones`);
