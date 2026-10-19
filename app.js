import { store } from "./store.js";
import { auth } from "./auth.js";
import { esc, icon, leagueMark, countdown, roleLabel } from "./utils.js";
import { openModal, closeModal, toast, openSheet, formValues } from "./ui.js";
import { field } from "./views/shared.js";

import HomeView from "./views/home.js";
import MatchesView from "./views/matches.js";
import StandingsView from "./views/standings.js";
import TeamsView from "./views/teams.js";
import PlayersView from "./views/players.js";
import MarketView from "./views/market.js";
import DraftView from "./views/draft.js";
import FantasyView from "./views/fantasy.js";
import NewsView from "./views/news.js";
import RulesView from "./views/rules.js";
import AuthView from "./views/auth.js";
import AccountView from "./views/account.js";
import AdminView from "./views/admin.js";

const NAV = [
  ["inicio", "Inicio", "#/"],
  ["partidos", "Partidos", "#/partidos"],
  ["clasificacion", "Tabla", "#/clasificacion"],
  ["equipos", "Clubes", "#/equipos"],
  ["jugadores", "Jugadores", "#/jugadores"],
  ["mercado", "Mercado", "#/mercado"],
  ["draft", "Draft", "#/draft"],
  ["fantasy", "Fantasy", "#/fantasy"],
  ["noticias", "Noticias", "#/noticias"]
];

const ROUTES = [
  { re: /^$/, view: HomeView, nav: "inicio", title: "Inicio" },
  { re: /^partidos$/, view: MatchesView, nav: "partidos", title: "Partidos" },
  { re: /^partidos\/([^/]+)$/, view: MatchesView, nav: "partidos", title: "Partido", keys: ["id"] },
  { re: /^clasificacion$/, view: StandingsView, nav: "clasificacion", title: "Clasificación" },
  { re: /^equipos$/, view: TeamsView, nav: "equipos", title: "Clubes" },
  { re: /^equipo\/([^/]+)$/, view: TeamsView, nav: "equipos", title: "Club", keys: ["id"] },
  { re: /^jugadores$/, view: PlayersView, nav: "jugadores", title: "Jugadores" },
  { re: /^jugador\/([^/]+)$/, view: PlayersView, nav: "jugadores", title: "Jugador", keys: ["id"] },
  { re: /^mercado$/, view: MarketView, nav: "mercado", title: "Mercado" },
  { re: /^draft$/, view: DraftView, nav: "draft", title: "Draft y subasta" },
  { re: /^fantasy$/, view: FantasyView, nav: "fantasy", title: "Fantasy" },
  { re: /^noticias$/, view: NewsView, nav: "noticias", title: "Noticias" },
  { re: /^reglas$/, view: RulesView, nav: "", title: "Reglamento" },
  { re: /^acceso$/, view: AuthView, nav: "", title: "Acceder" },
  { re: /^cuenta$/, view: AccountView, nav: "cuenta", title: "Mi cuenta", auth: true },
  { re: /^admin$/, view: AdminView, nav: "admin", title: "Panel", auth: true, admin: true }
];

let current = null;
let routing = false;

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [pathPart, queryPart = ""] = raw.split("?");
  const path = pathPart.replace(/\/+$/, "");
  return { path, query: Object.fromEntries(new URLSearchParams(queryPart)) };
}

function resolve(path) {
  for (const route of ROUTES) {
    const match = path.match(route.re);
    if (!match) continue;
    const params = {};
    (route.keys || []).forEach((key, index) => {
      params[key] = decodeURIComponent(match[index + 1] || "");
    });
    return { route, params };
  }
  return { route: null, params: {} };
}

function syncState() {
  const config = store.getSupabaseConfig();
  if (store.remoteReady) return { label: "En vivo", live: true };
  if (config.url) return { label: store.remoteError ? "Sin conexión" : "Supabase", live: false };
  return { label: "Local", live: false };
}

function renderHeader() {
  const header = document.getElementById("siteHeader");
  if (!header) return;
  const user = store.user;
  const active = current?.route?.nav || "";
  const sync = syncState();
  const team = user?.teamId ? store.team(user.teamId) : null;
  header.innerHTML = `<div class="container header__inner">
    <a class="brand" href="#/" aria-label="IMEX League, inicio">
      ${leagueMark(34)}
      <span class="brand__word">IMEX LEAGUE<span>KINGS LEAGUE · ${esc(store.state.league.season.replace(/\D/g, ""))}</span></span>
    </a>
    <nav class="main-nav" aria-label="Navegación principal">
      ${NAV.map(([key, label, href]) => `<a class="${active === key ? "is-active" : ""}" href="${href}" ${active === key ? 'aria-current="page"' : ""}>${label}</a>`).join("")}
    </nav>
    <div class="header__actions">
      <button class="sync-chip ${sync.live ? "is-live" : ""}" type="button" data-sync title="Estado de sincronización">
        <span class="sync-chip__dot" aria-hidden="true"></span><span>${esc(sync.label)}</span>
      </button>
      ${user?.role === "ADMIN" ? `<a class="icon-btn" href="#/admin" aria-label="Panel del organizador" title="Panel del organizador">${icon("sliders", 18)}</a>` : ""}
      ${user ? `<div class="user-wrap">
        <button class="user-btn" type="button" data-user-toggle aria-expanded="false" aria-haspopup="menu">
          <span class="avatar">${esc(user.name.slice(0, 2).toUpperCase())}</span>
          <span class="user-btn__name">${esc(user.name.split(" ")[0])}</span>
          ${icon("chevron", 14)}
        </button>
        <div class="user-menu" data-user-menu role="menu" hidden>
          <div class="user-menu__head"><strong>${esc(user.name)}</strong><span>${esc(user.email)}</span><span class="tiny muted" style="margin-top:3px">${esc(roleLabel(user.role))}${team ? ` · ${esc(team.short)}` : ""}</span></div>
          <a href="#/cuenta" role="menuitem">${icon("user", 16)} Mi cuenta</a>
          ${team ? `<a href="#/equipo/${esc(team.id)}" role="menuitem">${icon("shield", 16)} Mi club</a>` : ""}
          <a href="#/fantasy" role="menuitem">${icon("star", 16)} Mi Fantasy</a>
          ${user.role === "ADMIN" ? `<a href="#/admin" role="menuitem">${icon("sliders", 16)} Panel organizador</a>` : ""}
          <button type="button" class="is-danger" data-logout role="menuitem">${icon("logout", 16)} Cerrar sesión</button>
        </div>
      </div>` : `<a class="btn btn--primary btn--sm" href="#/acceso">Acceder</a>`}
      <button class="icon-btn menu-btn" type="button" data-menu aria-label="Abrir menú de navegación">${icon("menu", 18)}</button>
    </div>
  </div>`;
}

function renderMobileNav() {
  const nav = document.getElementById("mobileNav");
  if (!nav) return;
  const active = current?.route?.nav || "";
  const user = store.user;
  const items = [
    ["inicio", "Inicio", "#/", "home"],
    ["partidos", "Partidos", "#/partidos", "calendar"],
    ["clasificacion", "Tabla", "#/clasificacion", "table"],
    ["fantasy", "Fantasy", "#/fantasy", "star"],
    [user ? "cuenta" : "cuenta", user ? "Cuenta" : "Acceder", user ? "#/cuenta" : "#/acceso", "user"]
  ];
  nav.innerHTML = items.map(([key, label, href, iconName]) => `<a class="mobile-nav__item ${active === key ? "is-active" : ""}" href="${href}">${icon(iconName, 20)}<span>${label}</span></a>`).join("");
}

function renderFooter() {
  const footer = document.getElementById("siteFooter");
  if (!footer) return;
  const admin = store.user?.role === "ADMIN";
  footer.innerHTML = `<div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        ${leagueMark(42, "lime")}
        <strong style="font-family:var(--font-display);font-size:22px;font-weight:900;letter-spacing:-.03em;color:var(--bg)">IMEX LEAGUE</strong>
        <p>${esc(store.state.league.officialName)}. Ocho clubes, una temporada y una plataforma para vivirlo todo: resultados, mercado, Fantasy y tarjetas oficiales.</p>
      </div>
      <div class="footer__col"><h3>Liga</h3><a href="#/">Inicio</a><a href="#/partidos">Partidos</a><a href="#/clasificacion">Clasificación</a><a href="#/equipos">Clubes</a><a href="#/jugadores">Jugadores</a></div>
      <div class="footer__col"><h3>Competición</h3><a href="#/mercado">Mercado</a><a href="#/fantasy">Fantasy</a><a href="#/noticias">Noticias</a><a href="#/reglas">Reglamento</a></div>
      <div class="footer__col"><h3>Cuenta</h3>${store.user ? `<a href="#/cuenta">Mi cuenta</a>` : `<a href="#/acceso">Acceder</a><a href="#/acceso?tab=crear">Crear cuenta</a>`}${admin ? `<a href="#/admin">Panel organizador</a>` : ""}<a href="mailto:prensa@imexleague.mx">prensa@imexleague.mx</a></div>
    </div>
    <div class="footer__bottom"><span>© ${new Date().getFullYear()} IMEX League · Plataforma oficial</span><span>${esc(store.state.league.season)} · ${esc(store.state.league.venue)}</span></div>
  </div>`;
}

function notFound() {
  return `<div class="container page"><div class="empty-state">
    ${leagueMark(36)}
    <h3>Página no encontrada</h3>
    <p>La dirección que abriste no existe. Vuelve al inicio para seguir la liga.</p>
    <a class="btn btn--primary" href="#/">Ir al inicio</a>
  </div></div>`;
}

function renderRoute({ scroll = true } = {}) {
  if (routing) return;
  const { path, query } = parseHash();
  const { route, params } = resolve(path);
  if (!route) {
    const view = document.getElementById("view");
    if (view) view.innerHTML = notFound();
    current = { route: { nav: "", title: "No encontrada" }, params: {}, query };
    renderHeader();
    renderMobileNav();
    renderFooter();
    if (scroll) window.scrollTo(0, 0);
    return;
  }
  if (route.auth && !store.user) {
    location.hash = `#/acceso?next=${encodeURIComponent(path)}`;
    return;
  }
  if (route.admin && store.user?.role !== "ADMIN") {
    toast("Necesitas permisos de organizador para entrar al panel.", "warning");
    location.hash = "#/";
    return;
  }
  routing = true;
  try {
    current = { route, params, query };
    const view = document.getElementById("view");
    const output = route.view.render({ params, query, path });
    view.innerHTML = typeof output === "string" ? output : output?.html || "";
    route.view.bind?.(view, { params, query });
    document.title = `${route.title} · IMEX League`;
    renderHeader();
    renderMobileNav();
    renderFooter();
    if (scroll) window.scrollTo({ top: 0, behavior: "auto" });
  } finally {
    routing = false;
  }
}

function rerenderCurrent() {
  if (!current || !current.route?.view) return;
  if (current.route.auth && !store.user) {
    location.hash = "#/acceso";
    return;
  }
  if (current.route.admin && store.user?.role !== "ADMIN") {
    location.hash = "#/";
    return;
  }
  const view = document.getElementById("view");
  if (!view) return;
  const output = current.route.view.render({ params: current.params, query: current.query });
  view.innerHTML = typeof output === "string" ? output : output?.html || "";
  current.route.view.bind?.(view, { params: current.params, query: current.query });
}

function scheduleRerender() {
  const active = document.activeElement;
  const typing = active && active.closest?.("#view") && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName);
  if (typing) return;
  const y = window.scrollY;
  rerenderCurrent();
  window.scrollTo(0, y);
}

function closeUserMenu() {
  const menu = document.querySelector("[data-user-menu]");
  const toggle = document.querySelector("[data-user-toggle]");
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  toggle?.setAttribute("aria-expanded", "false");
}

function openMobileMenu() {
  const links = [...NAV.map(([key, label, href]) => [label, href]), ["Reglamento", "#/reglas"]];
  if (store.user) {
    links.push(["Mi cuenta", "#/cuenta"]);
    if (store.user.role === "ADMIN") links.push(["Panel organizador", "#/admin"]);
  } else {
    links.push(["Acceder", "#/acceso"], ["Crear cuenta", "#/acceso?tab=crear"]);
  }
  const close = openSheet({
    title: "Navegación IMEX",
    body: `<div style="display:flex;flex-direction:column;gap:2px">
      ${links.map(([label, href]) => `<a href="${href}" style="display:flex;align-items:center;justify-content:space-between;padding:13px 10px;border-bottom:1px solid var(--border);font-size:13px;font-weight:600">${esc(label)}${icon("chevron", 15)}</a>`).join("")}
      ${store.user ? `<button type="button" data-logout style="display:flex;align-items:center;gap:8px;padding:13px 10px;border:0;background:transparent;color:var(--danger);font-size:13px;font-weight:600">${icon("logout", 16)} Cerrar sesión</button>` : ""}
    </div>`
  });
  document.querySelectorAll("#sheetRoot a").forEach((link) => link.addEventListener("click", close));
}

function openSyncModal() {
  const sync = syncState();
  const config = store.getSupabaseConfig();
  const admin = store.isAdmin();
  openModal({
    title: "Sincronización",
    eyebrow: "Estado de la plataforma",
    size: "md",
    body: `<div class="detail-list">
      <div class="detail-list__row"><span>Modo</span><strong>${sync.live ? "Supabase Realtime" : config.url ? "Supabase" : "Local"}</strong></div>
      <div class="detail-list__row"><span>Estado</span><strong>${esc(sync.label)}</strong></div>
      <div class="detail-list__row"><span>Autenticación</span><strong>${auth.mode === "supabase" ? "Supabase Auth" : "Local cifrada"}</strong></div>
      <div class="detail-list__row"><span>Última actualización</span><strong>${esc(new Date(store.state.updatedAt).toLocaleString("es-MX"))}</strong></div>
      <div class="detail-list__row"><span>Cliente</span><strong class="mono tiny">${esc(store.clientId)}</strong></div>
    </div>
    ${store.remoteError ? `<p class="notice notice--danger">${icon("alert", 16)}<span>${esc(store.remoteError)}</span></p>` : ""}
    ${admin ? `<form data-sync-form class="form-grid">${field({ label: "Project URL", name: "url", value: config.url, placeholder: "https://xxxx.supabase.co", full: true })}${field({ label: "Anon key", name: "key", type: "password", value: config.key, placeholder: "eyJhbGciOi…", full: true })}<p class="field__hint field--full">Para multijugador real conecta Supabase y ejecuta <span class="mono">supabase-schema.sql</span>. El modo local sincroniza solo este navegador.</p></form>` : `<p class="notice">${icon("info", 16)}<div><strong>¿Cómo funciona?</strong><span>Ahora mismo la plataforma sincroniza pestañas de este navegador. El organizador puede conectar Supabase desde el panel de datos para compartir resultados entre dispositivos en tiempo real.</span></div></p>`}
    `,
    footer: admin
      ? `<button class="btn btn--ghost" type="button" data-modal-close>Cerrar</button><a class="btn btn--ghost" href="#/admin?tab=datos" data-sync-panel>Panel de datos</a><button class="btn btn--primary" type="button" data-sync-save>Guardar y recargar</button>`
      : `<button class="btn btn--primary" type="button" data-modal-close>Cerrar</button>`,
    onMount(root, close) {
      root.querySelector("[data-sync-panel]")?.addEventListener("click", close);
      root.querySelector("[data-sync-save]")?.addEventListener("click", () => {
        const form = root.querySelector("[data-sync-form]");
        if (!form) return;
        const values = formValues(form);
        if (!values.url || !values.key) {
          toast("Introduce la URL y la anon key de Supabase.", "danger");
          return;
        }
        store.configureSupabase(values.url.trim(), values.key.trim());
      });
    }
  });
}

async function handleGlobalClick(event) {
  const toggle = event.target.closest("[data-user-toggle]");
  if (toggle) {
    event.preventDefault();
    const menu = toggle.parentElement.querySelector("[data-user-menu]");
    if (menu) {
      const open = menu.hidden;
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    }
    return;
  }
  if (!event.target.closest(".user-wrap")) closeUserMenu();

  const logout = event.target.closest("[data-logout]");
  if (logout) {
    event.preventDefault();
    if (logout.dataset.busy) return;
    logout.dataset.busy = "1";
    await auth.signOut();
    closeModal();
    toast("Sesión cerrada.");
    location.hash = "#/";
    return;
  }
  if (event.target.closest("[data-sync]")) {
    event.preventDefault();
    openSyncModal();
    return;
  }
  if (event.target.closest("[data-menu]")) {
    event.preventDefault();
    openMobileMenu();
  }
}

function tickCountdowns() {
  document.querySelectorAll("[data-countdown]").forEach((node) => {
    const target = node.getAttribute("data-countdown");
    if (target) node.textContent = countdown(target);
  });
}

async function boot() {
  try {
    await store.init();
    await auth.init();
    if (auth.user) store.setUser(auth.user);
  } catch (error) {
    console.error("IMEX boot:", error);
  }
  renderHeader();
  renderMobileNav();
  renderFooter();
  window.addEventListener("hashchange", () => renderRoute());
  document.addEventListener("click", handleGlobalClick);
  store.subscribe(() => {
    renderHeader();
    renderMobileNav();
    renderFooter();
    scheduleRerender();
  });
  if (!location.hash) history.replaceState(null, "", "#/");
  renderRoute();
  tickCountdowns();
  setInterval(tickCountdowns, 1000);
  document.getElementById("app").hidden = false;
  document.getElementById("boot")?.classList.add("is-hidden");
}

boot();
