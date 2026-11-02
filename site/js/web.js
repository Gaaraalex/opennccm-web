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
        detalles: "Ver los detalles técnicos ({n})", sinCoincidencias: "Ninguna versión coincide con el filtro.",
        tipos: { nuevo: "Nuevo", mejora: "Mejora", arreglo: "Arreglo", seguridad: "Seguridad" }, version: "Versión",
        error: 'No se pudieron cargar las novedades. Véalas en <a href="https://github.com/Gaaraalex/opennccm/releases">GitHub</a>.' },
  en: { copiar: "Copy", copiado: "Copied ✓", manual: "Select and copy", ultima: "Latest", leer: "Read more →",
        mejoras: "Fixes and improvements", github: "On GitHub →", historial: "changelog.html",
        detalles: "See the technical details ({n})", sinCoincidencias: "No release matches the filter.",
        tipos: { nuevo: "New", mejora: "Improvement", arreglo: "Fix", seguridad: "Security" }, version: "Release",
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
  if (hist) historial(d.versiones, hist);
}).catch(() => {
  const msg = `<p style="color:var(--muted)">${T.error}</p>`;
  for (const id of ["versiones", "historial"]) { const el = document.getElementById(id); if (el) el.innerHTML = msg; }
});

// ---------- Historial de versiones (novedades.html / changelog.html) ----------
// Cada punto del CHANGELOG lleva un tipo. Con la etiqueta al principio («- [nuevo] **Título:** …», también [mejora],
// [arreglo] y [seguridad]) se usa esa; sin etiqueta, se deduce de las palabras del texto.
const TIPOS = ["nuevo", "mejora", "arreglo", "seguridad"];
function tipoDe(li) {
  const t = li.textContent.trim();
  const m = t.match(/^\[(nuevo|mejora|arreglo|seguridad)\]\s*/i);
  if (m) {
    const w = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) if (n.nodeValue.includes(m[0].trim())) { n.nodeValue = n.nodeValue.replace(/\[(nuevo|mejora|arreglo|seguridad)\]\s*/i, ""); break; }
    return m[1].toLowerCase();
  }
  const x = t.toLowerCase();
  // Seguridad = fallos de seguridad de OpenNCCM (no las funciones de CVE o cumplimiento, que son «nuevo» o «mejora»).
  if (/(\bxss\b|csrf|inyecci[oó]n|fuerza bruta|escalada de privilegios|fallo de seguridad|problema de seguridad|cabeceras de seguridad|secuestro de sesi)/.test(x)) return "seguridad";
  if (/(arregl|corrig|un fallo|\bfallaba|ya no se|ya no queda|no funcionaba|se quedaba|dejaba de|antes se|en la \d+\.\d+\.\d+ un)/.test(x)) return "arreglo";
  if (/^(nuevo|nueva)\b|\b(nuevo|nueva) (botón|página|pestaña|opción|menú)|ahora se puede|^botón/.test(x)) return "nuevo";
  return "mejora";
}
const prioridad = (tipos) => (tipos.includes("seguridad") ? "seguridad" : tipos.includes("nuevo") ? "nuevo" : tipos.includes("arreglo") ? "arreglo" : "mejora");
const fechaCorta = (iso) => iso ? new Date(iso).toLocaleDateString(LANG, { day: "numeric", month: "short" }) : "";

function historial(versiones, hist) {
  const lista = versiones.map((v) => {
    const doc = new DOMParser().parseFromString(`<div>${v.html}</div>`, "text/html").body.firstChild;
    const lis = [...doc.querySelectorAll(":scope > ul > li")];
    const puntos = lis.map((li) => {
      const tipo = tipoDe(li);
      const fuerte = li.querySelector(":scope > strong");
      const titulo = (fuerte ? fuerte.textContent : li.textContent.split(/[.:]/)[0]).replace(/[:.]\s*$/, "").trim();
      return { tipo, titulo, texto: li.textContent.trim() };
    });
    return { ...v, html: doc.innerHTML, puntos, tipo: prioridad(puntos.map((p) => p.tipo)) };
  });

  // Lo más importante del último mes: el primer punto de cada versión de los últimos 30 días (las novedades primero).
  const mes = $("#nov-mes");
  if (mes) {
    const ref = lista[0]?.fecha ? new Date(lista[0].fecha).getTime() : Date.now();
    const candidatos = lista.filter((v) => v.fecha && ref - new Date(v.fecha).getTime() < 30 * 864e5)
      .flatMap((v) => v.puntos.slice(0, 2).map((p, i) => ({ ...p, v, orden: (p.tipo === "nuevo" ? 0 : p.tipo === "seguridad" ? 1 : 2) * 10 + i })));
    const elegidos = [];
    for (const c of candidatos.sort((a, b) => a.orden - b.orden)) if (elegidos.length < 3 && !elegidos.some((e) => e.v === c.v)) elegidos.push(c);
    for (const c of candidatos) if (elegidos.length < 3 && !elegidos.includes(c)) elegidos.push(c);
    mes.innerHTML = elegidos.map((c) => `
      <a class="nov-tarjeta" href="#v${c.v.version}">
        <span class="nov-chip ${c.tipo}">${T.tipos[c.tipo]}</span>
        <b></b><p></p>
        <span class="nov-ver">${T.version} ${c.v.version} · ${fecha(c.v.fecha)}</span>
      </a>`).join("");
    [...mes.children].forEach((a, i) => {
      a.querySelector("b").textContent = elegidos[i].titulo;
      a.querySelector("p").textContent = elegidos[i].texto.slice(elegidos[i].titulo.length).replace(/^[\s:.,]+/, "").slice(0, 150) + "…";
    });
    if (!elegidos.length) mes.closest(".nov-mes").hidden = true;
  }

  // Índice lateral: versión, fecha y punto de color.
  $("#indice").innerHTML = lista.map((v) => `<a href="#v${v.version}" data-v="${v.version}"><i class="punto ${v.tipo}" title="${T.tipos[v.tipo]}"></i><span>${v.version}</span><small>${fechaCorta(v.fecha)}</small></a>`).join("");

  // Versiones: 3 puntos y los detalles técnicos plegados; las anteriores a las 6 últimas, en una línea.
  hist.innerHTML = lista.map((v, i) => {
    const tres = v.puntos.slice(0, 3).map((p) => `<li data-tipo="${p.tipo}"><span class="nov-chip ${p.tipo}">${T.tipos[p.tipo]}</span> <span class="t"></span></li>`).join("");
    const cuerpo = `
        <ul class="nov-tres">${tres || `<li>${T.mejoras}</li>`}</ul>
        <details class="nov-detalles"><summary>${T.detalles.replace("{n}", v.puntos.length || 1)}</summary><div class="cuerpo" lang="es">${v.html}</div></details>`;
    const cab = `<span class="num"><i class="punto ${v.tipo}"></i>${v.version}</span> <small>${fecha(v.fecha)}</small>`;
    return i < 6
      ? `<article id="v${v.version}" data-v="${v.version}"><h2>${cab}<a class="gh" href="https://github.com/Gaaraalex/opennccm/releases/tag/v${v.version}">${T.github}</a></h2>${cuerpo}</article>`
      : `<details class="nov-vieja" id="v${v.version}" data-v="${v.version}"><summary>${cab}<span class="linea"></span></summary><article>${cuerpo}<p><a class="gh" href="https://github.com/Gaaraalex/opennccm/releases/tag/v${v.version}">${T.github}</a></p></article></details>`;
  }).join("") + `<p class="nov-vacio" hidden>${T.sinCoincidencias}</p>`;
  lista.forEach((v) => {
    const el = hist.querySelector(`[data-v="${v.version}"]`);
    el.querySelectorAll(".nov-tres .t").forEach((t, i) => (t.textContent = v.puntos[i].titulo));
    const linea = el.querySelector(".linea");
    if (linea) linea.textContent = v.puntos.slice(0, 3).map((p) => p.titulo).join(" · ");
  });

  // Filtros por tipo y búsqueda.
  let tipo = "";
  const q = $("#nov-q");
  const aplicar = () => {
    const texto = (q?.value || "").trim().toLowerCase();
    let visibles = 0;
    lista.forEach((v) => {
      const el = hist.querySelector(`[data-v="${v.version}"]`);
      const porTipo = !tipo || v.puntos.some((p) => p.tipo === tipo);
      const porTexto = !texto || (v.version + " " + v.puntos.map((p) => p.texto).join(" ")).toLowerCase().includes(texto);
      const ver = porTipo && porTexto;
      el.hidden = !ver;
      $(`#indice [data-v="${v.version}"]`).hidden = !ver;
      el.querySelectorAll(".nov-tres li[data-tipo]").forEach((li) => li.classList.toggle("atenuado", !!tipo && li.dataset.tipo !== tipo));
      if (el.tagName === "DETAILS" && (tipo || texto)) el.open = ver;
      if (ver) visibles++;
    });
    hist.querySelector(".nov-vacio").hidden = visibles > 0;
  };
  $$(".nov-tipos button").forEach((b) => b.addEventListener("click", () => {
    tipo = b.dataset.tipo;
    $$(".nov-tipos button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    aplicar();
  }));
  q?.addEventListener("input", aplicar);

  // Un enlace a una versión vieja la abre.
  const abrir = () => { const el = location.hash && document.getElementById(location.hash.slice(1)); if (el) { if (el.tagName === "DETAILS") el.open = true; el.scrollIntoView(); } };
  addEventListener("hashchange", abrir);
  abrir();
}

// Formas de donar: desplegable del botón «Apoya OpenNCCM» de la barra
const donar = $(".donate"), donPop = $("#don-pop");
if (donar && donPop) {
  const cerrar = () => { donPop.hidden = true; donar.setAttribute("aria-expanded", "false"); };
  donar.addEventListener("click", (e) => {
    e.stopPropagation();
    const abrir = donPop.hidden;
    donPop.hidden = !abrir; donar.setAttribute("aria-expanded", String(abrir));
    if (abrir) donPop.querySelector("a")?.focus();
  });
  document.addEventListener("click", (e) => { if (!donPop.hidden && !donPop.contains(e.target)) cerrar(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !donPop.hidden) { cerrar(); donar.focus(); } });
}
