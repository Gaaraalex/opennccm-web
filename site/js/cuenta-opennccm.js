// Cuenta de la comunidad en la cabecera de opennccm.com y docs.opennccm.com (sitios estáticos).
// La página trae «Entrar» y «Crear cuenta»; este script les pone «volver» a la página actual y pregunta a
// comunidad.opennccm.com/api/yo (cookie compartida de .opennccm.com). Si hay sesión, cambia «Entrar» por el menú
// de la cuenta según el rol; si la consulta tarda o falla, se queda «Entrar».
//   <div data-occ-cuenta data-comunidad="https://comunidad.opennccm.com">…Entrar / Crear cuenta…</div>
//   <div data-occ-cuenta-movil>…dentro del ☰…</div>   <span data-occ-avatar-movil></span> (junto al ☰)
(function () {
	var raiz = document.querySelector('[data-occ-cuenta]');
	if (!raiz) return;
	var C = (raiz.getAttribute('data-comunidad') || 'https://comunidad.opennccm.com').replace(/\/$/, '');
	var en = (document.documentElement.lang || '').slice(0, 2) === 'en';
	var aqui = location.href.split('#')[0];
	var q = en ? '&lang=en' : '';
	var T = en
		? { cuenta: 'My account', equipo: 'Team', tickets: 'My tickets', nueva: '1 new reply', nuevas: '{n} new replies', abrir: 'Open a ticket', susc: 'My account and subscription', temas: 'My forum topics', planes: 'See plans', bandeja: 'Support inbox', base: 'Knowledge base', admin: 'Administration', perfil: 'My profile and security', salir: 'Sign out', pro: 'Professional', emp: 'Enterprise', rolAdmin: 'admin', rolStaff: 'operator' }
		: { cuenta: 'Mi cuenta', equipo: 'Equipo', tickets: 'Mis tickets', nueva: '1 respuesta nueva', nuevas: '{n} respuestas nuevas', abrir: 'Abrir un ticket', susc: 'Mi cuenta y suscripción', temas: 'Mis temas en el foro', planes: 'Ver planes', bandeja: 'Bandeja', base: 'Base de conocimiento', admin: 'Administración', perfil: 'Mi perfil y seguridad', salir: 'Cerrar sesión', pro: 'Profesional', emp: 'Empresa', rolAdmin: 'admin', rolStaff: 'operador' };

	// Enlaces «Entrar» / «Crear cuenta» con vuelta a esta página.
	document.querySelectorAll('[data-occ-entrar]').forEach(function (a) { a.href = C + '/cuenta/entrar?volver=' + encodeURIComponent(aqui) + q; });
	document.querySelectorAll('[data-occ-crear]').forEach(function (a) { a.href = C + '/cuenta/crear?volver=' + encodeURIComponent(aqui) + q; });

	var el = function (tag, clase, texto) {
		var e = document.createElement(tag);
		if (clase) e.className = clase;
		if (texto != null) e.textContent = texto;
		return e;
	};
	var num = function (n) { return n > 0 ? el('span', 'occ-num', n > 99 ? '99+' : String(n)) : null; };
	var item = function (menu, href, texto, n, nota) {
		var a = el('a', null, texto);
		a.href = C + href + (href.indexOf('?') < 0 ? (en ? '?lang=en' : '') : q);
		a.setAttribute('role', 'menuitem');
		var x = num(n);
		if (x) a.appendChild(x);
		if (nota) a.appendChild(el('small', 'occ-nota', nota));
		menu.appendChild(a);
	};

	function menuDe(yo) {
		var staff = yo.rol === 'staff' || yo.rol === 'admin';
		var pago = yo.plan === 'profesional' || yo.plan === 'empresa';
		var av = yo.avisos || { tickets: 0, casos: 0 };
		var d = el('details', 'occ-menu');
		var s = el('summary');
		s.setAttribute('aria-label', staff ? T.equipo : T.cuenta);
		if (pago && !staff) s.appendChild(el('span', 'occ-plan', yo.plan === 'empresa' ? T.emp : T.pro));
		var quien = el('span', 'occ-quien', staff ? T.equipo : T.cuenta);
		var x = num(staff ? av.tickets + av.casos : av.tickets);
		if (x) quien.appendChild(x);
		quien.appendChild(el('span', 'occ-flecha', ' ▾'));
		s.appendChild(quien);
		var avatar = el('span', 'occ-avatar', yo.iniciales || '?');
		avatar.setAttribute('aria-hidden', 'true');
		s.appendChild(avatar);
		d.appendChild(s);
		var m = el('div', 'occ-lista');
		m.setAttribute('role', 'menu');
		var cab = el('p', 'occ-yo');
		cab.appendChild(el('b', null, yo.usuario));
		if (staff) cab.appendChild(el('small', null, yo.rol === 'admin' ? T.rolAdmin : T.rolStaff));
		m.appendChild(cab);
		if (staff) {
			item(m, '/bandeja', T.bandeja, av.tickets);
			if (yo.base) item(m, '/base', T.base, av.casos);
			if (yo.rol === 'admin') item(m, '/admin', T.admin);
			item(m, '/cuenta/perfil', T.perfil);
		} else if (pago) {
			item(m, '/tickets', T.tickets, 0, av.tickets === 1 ? T.nueva : av.tickets > 1 ? T.nuevas.replace('{n}', av.tickets) : '');
			item(m, '/tickets/nuevo', T.abrir);
			item(m, '/cuenta', T.susc);
			item(m, '/foro?de=yo', T.temas);
		} else {
			item(m, '/cuenta', T.cuenta);
			item(m, '/foro?de=yo', T.temas);
			item(m, '/soporte', T.planes);
		}
		// Cerrar sesión: en los tres sitios a la vez (cookie compartida) y de vuelta a esta página.
		var f = el('form');
		f.method = 'post';
		f.action = C + '/cuenta/salir';
		var v = el('input');
		v.type = 'hidden';
		v.name = 'volver';
		v.value = aqui;
		f.appendChild(v);
		var b = el('button', null, T.salir);
		b.type = 'submit';
		b.setAttribute('role', 'menuitem');
		f.appendChild(b);
		m.appendChild(f);
		d.appendChild(m);
		document.addEventListener('click', function (e) { if (!d.contains(e.target)) d.removeAttribute('open'); });
		document.addEventListener('keydown', function (e) { if (e.key === 'Escape') d.removeAttribute('open'); });
		return d;
	}

	var ctl = 'AbortController' in window ? new AbortController() : null;
	if (ctl) setTimeout(function () { ctl.abort(); }, 4000);
	fetch(C + '/api/yo', { credentials: 'include', signal: ctl ? ctl.signal : undefined })
		.then(function (r) { return r.ok ? r.json() : { sesion: false }; })
		.then(function (yo) {
			if (!yo || !yo.sesion) return;
			raiz.replaceChildren(menuDe(yo));
			raiz.classList.add('con-sesion');
			document.documentElement.classList.add('occ-con-sesion');
			// Móvil: el menú de la cuenta va junto al ☰ y desaparecen «Entrar / Crear cuenta» de dentro del ☰.
			var junto = document.querySelector('[data-occ-avatar-movil]');
			if (junto) junto.replaceChildren(menuDe(yo));
			document.querySelectorAll('[data-occ-cuenta-movil]').forEach(function (x) { x.hidden = true; });
		})
		.catch(function () {});
})();
