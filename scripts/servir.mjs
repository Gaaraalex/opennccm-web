// Servidor local para ver la web mientras se edita:  node scripts/servir.mjs  →  http://localhost:8080
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const PORT = Number(process.env.PORT) || 8080;
const TIPOS = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".txt": "text/plain", ".xml": "application/xml" };

createServer(async (req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (ruta.endsWith("/")) ruta += "index.html";
  const archivo = normalize(join(SITE, ruta));
  if (!archivo.startsWith(SITE)) { res.writeHead(403).end(); return; }
  try {
    const datos = await readFile(archivo);
    res.writeHead(200, { "Content-Type": TIPOS[extname(archivo)] || "application/octet-stream", "Cache-Control": "no-cache" }).end(datos);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" }).end(await readFile(join(SITE, "404.html")).catch(() => "No encontrado"));
  }
}).listen(PORT, () => console.log(`Web de OpenNCCM en http://localhost:${PORT}`));
