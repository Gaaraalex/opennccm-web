// Interacción de la web de OpenNCCM: menú móvil, galería, botones de copiar y novedades
// (site/data/novedades.json, generado por scripts/build.mjs desde el CHANGELOG del proyecto).
// Sirve para todas las versiones de idioma: <html lang> elige los textos y data-base la ruta a la raíz.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const LANG = document.documentElement.lang === "en" ? "en" : "es";
const BASE = document.documentElement.dataset.base || "";
const T = {
  es: { copiar: "Copiar", copiado: "Copiado ✓", manual: "Seleccione y copie", ultima: "Última", leer: "Leer más →",
        mejoras: "Correcciones y mejoras", github: "En GitHub →", historial: "novedades.html",
        error: 'No se pudieron cargar las novedades. Véalas en <a href="https://github.com/Gaaraalex/opennccm/releases">GitHub</a>.' },
  en: { copiar: "Copy", copiado: "Copied ✓", manual: "Select and copy", ultima: "Latest", leer: "Read more →",
        mejoras: "Fixes and improvements", github: "On GitHub →", historial: "changelog.html",
        error: 'Could not load the release notes. See them on <a href="https://github.com/Gaaraalex/opennccm/releases">GitHub</a>.' },
}[LANG];

const fecha = (iso) => iso
  ? new Date(iso).toLocaleDateString(LANG, { day: "numeric", month: "long", year: "numeric" })
  : "";

// Barra superior: borde al desplazarse y menú en el teléfono
const barra = $("#barra");
addEventListener("scroll", () => barra.classList.toggle("con-borde", scrollY > 8), { passive: true });
$("#abrir-menu")?.addEventListener("click", (e) => {
  const abierta = barra.classList.toggle("abierta");
  e.currentTarget.setAttribute("aria-expanded", abierta);
});
$$("#menu a").forEach((a) => a.addEventListener("click", () => barra.classList.remove("abierta")));

// Galería de capturas
const captura = (nombre) => `${BASE}img/capturas/${nombre}.png`;
const pestanas = $$(".pestanas [role=tab]");
pestanas.forEach((b, i) => {
  b.addEventListener("click", () => {
    pestanas.forEach((x) => x.setAttribute("aria-selected", x === b));
    const img = $("#captura");
    img.src = captura(b.dataset.img);
    img.alt = b.dataset.txt.replace(/<[^>]+>/g, "");
    $("#captura-txt").innerHTML = b.dataset.txt;
  });
  b.addEventListener("keydown", (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    const sig = pestanas[(i + d + pestanas.length) % pestanas.length];
    sig.focus(); sig.click();
  });
});
// Precarga las demás capturas cuando la página ya está lista
addEventListener("load", () => pestanas.forEach((b) => { new Image().src = captura(b.dataset.img); }));

// Copiar comandos
$$("[data-copiar]").forEach((b) => b.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(b.dataset.copiar);
    b.textContent = T.copiado; b.classList.add("ok");
  } catch { b.textContent = T.manual; }
  setTimeout(() => { b.textContent = T.copiar; b.classList.remove("ok"); }, 1800);
}));

// Novedades
fetch(`${BASE}data/novedades.json`, { cache: "no-cache" }).then((r) => r.json()).then((d) => {
  const v0 = d.versiones[0];
  $$("[data-version]").forEach((el) => (el.textContent = "v" + d.ultima));
  const dest = $("[data-destacado]");
  if (dest && v0?.destacados.length) dest.textContent = v0.destacados.slice(0, 3).map((t) => t.split(":")[0]).join(" · ");

  const cont = $("#versiones");
  if (cont) cont.innerHTML = d.versiones.slice(0, 3).map((v, i) => `
    <a class="version-card" href="${T.historial}#v${v.version}">
      <div class="cab"><span class="num">${v.version}${i === 0 ? `<span class="ultima">${T.ultima}</span>` : ""}</span><span class="fecha">${fecha(v.fecha)}</span></div>
      <ul lang="es">${(v.destacados.length ? v.destacados : [T.mejoras]).map((t) => `<li>${t}</li>`).join("")}</ul>
      <span class="ver">${T.leer}</span>
    </a>`).join("");

  const hist = $("#historial");
  if (hist) {
    $("#indice").innerHTML = d.versiones.map((v) => `<a href="#v${v.version}">${v.version}</a>`).join("");
    hist.innerHTML = d.versiones.map((v) => `
      <article id="v${v.version}">
        <h2>${v.version} <small>${fecha(v.fecha)}</small>
          <a class="gh" href="https://github.com/Gaaraalex/opennccm/releases/tag/v${v.version}">${T.github}</a></h2>
        <div class="cuerpo" lang="es">${v.html}</div>
      </article>`).join("");
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }
}).catch(() => {
  const msg = `<p style="color:var(--muted)">${T.error}</p>`;
  for (const id of ["versiones", "historial"]) { const el = document.getElementById(id); if (el) el.innerHTML = msg; }
});
