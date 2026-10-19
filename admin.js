import { store } from "../store.js";
import { auth } from "../auth.js";
import { esc, icon, money, number, fmtDate, fmtDateLong, statusPill, teamCrest, roleLabel, countdown, download, relativeTime } from "../utils.js";
import { openModal, toast, formValues, confirmDialog } from "../ui.js";
import { field, openMatchResult, openMatchForm, openPlayerForm, openTeamForm, openNewsForm } from "./shared.js";

const TABS = [
  ["resumen", "Resumen", "grid"],
  ["partidos", "Partidos", "whistle"],
  ["clubes", "Clubes", "shield"],
  ["jugadores", "Jugadores", "users"],
  ["cuentas", "Cuentas", "user"],
  ["mercado", "Mercado", "transfer"],
  ["noticias", "Noticias", "news"],
  ["liga", "Liga", "sliders"],
  ["datos", "Datos", "sync"]
];

function adminHead(title, copy, actions = "") {
  return `<div class="admin-head"><div><h2>${esc(title)}</h2><p>${esc(copy)}</p></div>${actions ? `<div class="admin-head__actions">${actions}</div>` : ""}</div>`;
}

function overview() {
  const today = new Date().toISOString().slice(0, 10);
  const finished = store.state.matches.filter((match) => match.status === "finished");
  const pending = store.state.transfers.filter((transfer) => transfer.status === "pending");
  const next = store.upcoming(1)[0];
  const accountsLabel = auth.mode === "supabase" ? "Supabase" : String(store.state.accounts.length);
  return `${adminHead("Resumen general", "Estado del torneo, la sincronización y la actividad reciente.", `<button class="btn btn--ghost btn--sm" type="button" data-new-news>${icon("news", 14)} Nueva nota</button><button class="btn btn--primary btn--sm" type="button" data-new-match>${icon("plus", 14)} Programar partido</button>`)}
    <div class="kpi-grid" style="margin-bottom:20px">
      <div class="kpi"><div class="stat"><span class="stat__label">Clubes</span><span class="stat__value">${store.state.teams.length}</span><span class="stat__meta">${store.state.teams.filter((team) => !team.clausulazoUsed).length} con clausulazo</span></div></div>
      <div class="kpi"><div class="stat"><span class="stat__label">Jugadores</span><span class="stat__value">${store.state.players.length}</span><span class="stat__meta">${store.state.players.filter((player) => player.insignia).length} insignia</span></div></div>
      <div class="kpi"><div class="stat"><span class="stat__label">Partidos</span><span class="stat__value">${finished.length}<span style="font-size:13px;color:var(--muted)"> / ${store.state.matches.length}</span></span><span class="stat__meta">${store.state.matches.length - finished.length} pendientes</span></div></div>
      <div class="kpi"><div class="stat"><span class="stat__label">Cuentas</span><span class="stat__value" style="font-size:24px">${accountsLabel}</span><span class="stat__meta">${pending.length} ofertas pendientes</span></div></div>
    </div>
    <div class="grid grid--2" style="align-items:start">
      <section class="panel">
        <div class="panel__head"><div><h3>Estado del sistema</h3><p>Sincronización y competición</p></div><span class="pill ${store.remoteReady ? "pill--success" : "pill--muted"}">${store.remoteReady ? "En vivo" : auth.mode === "supabase" ? "Supabase" : "Local"}</span></div>
        <div class="detail-list">
          <div class="detail-list__row"><span>Modo de datos</span><strong>${store.remoteReady ? "Supabase Realtime" : "Local + BroadcastChannel"}</strong></div>
          <div class="detail-list__row"><span>Última actualización</span><strong>${esc(relativeTime(store.state.updatedAt))}</strong></div>
          <div class="detail-list__row"><span>Mercado</span><strong>${store.isMarketOpen() ? "Abierto" : "Cerrado"} · ${store.state.league.marketOverride === null ? "automático (miércoles)" : "forzado manualmente"}</strong></div>
          <div class="detail-list__row"><span>Próximo partido</span><strong>${next ? `${esc(store.team(next.homeTeamId)?.short || "TBD")} vs ${esc(store.team(next.awayTeamId)?.short || "TBD")} · ${esc(fmtDate(next.date))}` : "Sin programar"}</strong></div>
          <div class="detail-list__row"><span>Fecha de hoy</span><strong>${esc(fmtDateLong(today))}</strong></div>
        </div>
        ${store.remoteError ? `<p class="notice notice--danger" style="margin-top:12px">${icon("alert", 16)}<span>${esc(store.remoteError)}</span></p>` : ""}
        <div class="row" style="margin-top:14px;flex-wrap:wrap">
          <button class="btn btn--ghost btn--sm" type="button" data-tab-link="datos">${icon("sync", 14)} Configurar datos</button>
          ${next ? `<button class="btn btn--primary btn--sm" type="button" data-quick-result="${esc(next.id)}">${icon("whistle", 14)} Registrar resultado</button>` : ""}
        </div>
      </section>
      <section class="panel panel--flush">
        <div class="panel__head"><div><h3>Ofertas pendientes</h3><p>Operaciones que esperan respuesta</p></div><button class="btn btn--ghost btn--sm" type="button" data-tab-link="mercado">Ver mercado</button></div>
        <div style="padding:4px 20px 14px">
          ${pending.length ? pending.map((transfer) => {
            const player = store.player(transfer.playerId);
            const buyer = store.team(transfer.buyerTeamId);
            const seller = store.team(transfer.sellerTeamId);
            return `<div class="activity-row">
              <span class="activity-row__icon">${icon("transfer", 14)}</span>
              <div style="flex:1"><p><strong>${esc(player?.name || "Jugador")}</strong> · ${esc(buyer?.short || "—")} → ${esc(seller?.short || "—")}</p><span>${money(transfer.price)} · ${esc(relativeTime(transfer.date))}</span></div>
              <div class="row" style="gap:4px"><button class="btn btn--danger btn--xs" type="button" data-reject="${esc(transfer.id)}">No</button><button class="btn btn--primary btn--xs" type="button" data-accept="${esc(transfer.id)}">Sí</button></div>
            </div>`;
          }).join("") : `<div class="admin-empty">No hay ofertas pendientes.</div>`}
        </div>
      </section>
    </div>
    <section class="panel panel--flush" style="margin-top:20px">
      <div class="panel__head"><div><h3>Actividad del sistema</h3><p>Últimos movimientos registrados</p></div><span class="pill pill--outline">${store.state.activity.length} eventos</span></div>
      <div style="padding:4px 20px 14px">
        ${store.state.activity.slice(0, 8).map((item) => `<div class="activity-row"><span class="activity-row__icon">${icon("activity", 14)}</span><div style="flex:1"><p>${esc(item.text)}</p><span>${esc(relativeTime(item.at))}</span></div><span class="pill pill--outline">${esc(item.type)}</span></div>`).join("")}
      </div>
    </section>`;
}

function matchesTab() {
  const matches = [...store.state.matches].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const started = store.tournamentStarted();
  const hasGroups = new Set(store.state.teams.map((team) => team.group).filter(Boolean)).size >= 2;
  const hasSchedule = store.state.matches.some((match) => match.phase === "groups");
  const steps = [
    ["Clubes inscritos", store.state.teams.length >= 2],
    ["Grupos definidos", hasGroups],
    ["Calendario generado", hasSchedule],
    ["Torneo iniciado", started]
  ];
  const locked = started || store.hasFinishedGroupMatches();
  const control = `<section class="admin-panel" style="margin-bottom:20px">
      <div class="panel__head"><div><h3>Torneo</h3><p>${started ? "Torneo en curso." : "Configura grupos y calendario, y luego inicia el torneo."}</p></div>${started ? `<span class="pill pill--success">Iniciado</span>` : `<span class="pill pill--muted">Preparación</span>`}</div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin:10px 0">${steps.map(([label, done]) => `<span class="pill ${done ? "pill--success" : "pill--outline"}">${done ? "✓" : "○"} ${esc(label)}</span>`).join("")}</div>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <button class="btn btn--ghost btn--sm" type="button" data-draw-groups ${locked ? "disabled" : ""}>${icon("sync", 14)} Sortear grupos</button>
        <button class="btn btn--ghost btn--sm" type="button" data-manual-groups ${locked ? "disabled" : ""}>Asignar grupos a mano</button>
        <button class="btn btn--ghost btn--sm" type="button" data-schedule ${locked || !hasGroups ? "disabled" : ""}>${icon("calendar", 14)} Generar calendario</button>
        <button class="btn btn--primary btn--sm" type="button" data-start-tournament ${started || !hasSchedule ? "disabled" : ""}>${icon("whistle", 14)} Dar por iniciado el torneo</button>
      </div>
    </section>`;
  return `${adminHead("Partidos", "Programa encuentros y registra resultados oficiales.", `<button class="btn btn--primary btn--sm" type="button" data-new-match>${icon("plus", 14)} Programar partido</button>`)}
    ${control}
    <div class="admin-panel">
      <div class="table-wrap">
        <table class="table table--dense table--stack">
          <thead><tr><th>Fecha</th><th>Partido</th><th>Fase</th><th class="table__num">Marcador</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            ${matches.map((match) => {
              const home = store.team(match.homeTeamId);
              const away = store.team(match.awayTeamId);
              return `<tr>
                <td data-label="Fecha"><span class="mono tiny">${esc(fmtDate(match.date))} · ${esc(match.time || "—")}</span></td>
                <td data-label="Partido"><a class="table__club" href="#/partidos/${esc(match.id)}"><span>${esc(home?.short || "TBD")} vs ${esc(away?.short || "TBD")}</span></a><span class="table__muted">${esc(match.title || `Jornada ${match.matchday}`)}</span></td>
                <td data-label="Fase"><span class="pill pill--outline">${esc(match.phase === "groups" ? `J${match.matchday}` : match.phase === "semifinals" ? "Semi" : "Final")}</span></td>
                <td class="table__num" data-label="Marcador">${match.status === "finished" ? `${match.homeScore} – ${match.awayScore}` : "—"}</td>
                <td data-label="Estado">${statusPill(match.status === "finished" ? "Finalizado" : "Programado", match.status === "finished" ? "muted" : "accent")}</td>
                <td data-label="Acciones"><div class="table__actions">
                  <button class="btn btn--ghost btn--xs" type="button" data-result="${esc(match.id)}" ${home && away ? "" : "disabled"}>${match.status === "finished" ? "Editar" : "Resultado"}</button>
                  <a class="btn btn--ghost btn--xs" href="#/partidos/${esc(match.id)}">Ver</a>
                </div></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function clubsTab() {
  return `${adminHead("Clubes", "Identidad, presidentes, saldos y clausulazos.", `<button class="btn btn--danger btn--sm" type="button" data-new-tournament>${icon("alert", 14)} Iniciar nuevo torneo</button><button class="btn btn--primary btn--sm" type="button" data-new-team>${icon("plus", 14)} Nuevo club</button>`)}
    <div class="admin-panel">
      <div class="table-wrap">
        <table class="table table--dense table--stack">
          <thead><tr><th>Club</th><th>Presidente</th><th>Grupo</th><th class="table__num">Saldo</th><th class="table__num">Plantilla</th><th>Clausulazo</th><th>Acciones</th></tr></thead>
          <tbody>
            ${store.state.teams.map((team) => `<tr>
              <td data-label="Club"><a class="table__club" href="#/equipo/${esc(team.id)}">${teamCrest(team, 24)}<span>${esc(team.name)}</span></a></td>
              <td data-label="Presidente">${esc(team.president)}</td>
              <td data-label="Grupo"><span class="pill pill--outline">${esc(team.group)}</span></td>
              <td class="table__num" data-label="Saldo">${money(team.balance)}</td>
              <td class="table__num" data-label="Plantilla">${money(team.squadValue)}</td>
              <td data-label="Clausulazo">${team.clausulazoUsed ? `<span class="pill pill--muted">Usado</span>` : `<span class="pill pill--success">Disponible</span>`}</td>
              <td data-label="Acciones"><div class="table__actions"><button class="btn btn--ghost btn--xs" type="button" data-edit-team="${esc(team.id)}">Editar</button><a class="btn btn--ghost btn--xs" href="#/equipo/${esc(team.id)}">Ver</a></div></td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function playersRows() {
  return store.state.players.map((player) => {
    const team = store.team(player.teamId);
    return `<tr>
      <td data-label="Jugador"><div class="account-cell"><span class="avatar avatar--sm">${esc(player.number || "—")}</span><span class="account-cell__main"><strong>${esc(player.name)}</strong><span>${esc(player.nickname || positionFallback(player.position))}</span></span></div></td>
      <td data-label="Club">${team ? `<a class="table__club" href="#/equipo/${esc(team.id)}">${teamCrest(team, 20)}<span>${esc(team.short)}</span></a>` : "—"}</td>
      <td data-label="Pos."><span class="mono tiny">${esc(player.position)}</span></td>
      <td class="table__num" data-label="Dorsal">${esc(player.number || "—")}</td>
      <td class="table__num" data-label="Valor">${money(player.value)}</td>
      <td class="table__num" data-label="Goles">${number(player.goals)}</td>
      <td data-label="Estado">${player.insignia ? `<span class="pill pill--accent">Insignia</span>` : `<span class="pill pill--muted">Disponible</span>`}</td>
      <td data-label="Acciones"><div class="table__actions"><button class="btn btn--ghost btn--xs" type="button" data-edit-player="${esc(player.id)}">Editar</button><button class="btn btn--ghost btn--xs" type="button" data-delete-player="${esc(player.id)}" style="color:var(--danger)">Eliminar</button></div></td>
    </tr>`;
  }).join("");
}

function playersTab() {
  return `${adminHead("Jugadores", "Fichas, estadísticas, valores y blindaje de insignia.", `<button class="btn btn--primary btn--sm" type="button" data-new-player>${icon("plus", 14)} Nuevo jugador</button>`)}
    <div class="admin-panel">
      <div class="admin-toolbar">
        <div class="search">${icon("search", 16)}<input type="search" placeholder="Buscar jugador…" data-player-search></div>
        <select data-player-team style="height:38px;padding:0 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface);font-size:12px">
          <option value="">Todos los clubes</option>
          ${store.state.teams.map((team) => `<option value="${esc(team.id)}">${esc(team.name)}</option>`).join("")}
        </select>
        <span class="pill pill--outline" data-player-count>${store.state.players.length} jugadores</span>
      </div>
      <div class="table-wrap">
        <table class="table table--dense table--stack">
          <thead><tr><th>Jugador</th><th>Club</th><th>Pos.</th><th class="table__num">Dorsal</th><th class="table__num">Valor</th><th class="table__num">Goles</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody data-players-body>${playersRows()}</tbody>
        </table>
      </div>
    </div>`;
}

function accountsTab() {
  return `${adminHead("Cuentas", "Crea usuarios, asigna roles y cambia contraseñas de jugadores y clubes en cualquier momento.", `<button class="btn btn--primary btn--sm" type="button" data-new-account>${icon("plus", 14)} Nueva cuenta</button>`)}
    <p class="notice" style="margin-bottom:14px">${icon("info", 16)}<div><strong>${auth.mode === "local" ? "Modo local" : "Supabase"}</strong><span>${auth.mode === "local" ? "Las cuentas y contraseñas se guardan cifradas en este dispositivo y se sincronizan entre pestañas. Los cambios afectan el acceso de jugadores y presidentes de inmediato." : "La gestión de cuentas usa la tabla profiles y la función admin-account de Supabase. Asegúrate de desplegarla para crear usuarios y cambiar contraseñas."}</span></div></p>
    <div class="admin-panel">
      <div class="admin-toolbar">
        <div class="search">${icon("search", 16)}<input type="search" placeholder="Buscar por nombre, correo o rol…" data-account-search></div>
        <button class="btn btn--ghost btn--sm" type="button" data-reload-accounts>${icon("sync", 14)} Actualizar</button>
      </div>
      <div data-accounts-body><div class="admin-empty">Cargando cuentas…</div></div>
    </div>`;
}

function marketTab() {
  const league = store.state.league;
  const pending = store.state.transfers.filter((transfer) => transfer.status === "pending");
  return `${adminHead("Mercado", "Controla la ventana, los clausulazos y las ofertas.", `<button class="btn btn--ghost btn--sm" type="button" data-toggle-market>${icon("sync", 14)} ${store.isMarketOpen() ? "Cerrar mercado" : "Abrir mercado"}</button><button class="btn btn--ghost btn--sm" type="button" data-reset-clausulazos>${icon("sync", 14)} Reiniciar clausulazos</button>`)}
    <div class="grid grid--2" style="align-items:start">
      <section class="panel">
        <div class="panel__head"><div><h3>Ventana de transferencias</h3><p>${store.isMarketOpen() ? "Abierta" : "Cerrada"} · ${league.marketOverride === null ? "automático (miércoles)" : league.marketOverride ? "forzado abierto" : "forzado cerrado"}</p></div><span class="pill ${store.isMarketOpen() ? "pill--accent" : "pill--muted"}">${store.isMarketOpen() ? "Abierto" : "Cerrado"}</span></div>
        <form data-market-form class="form-grid">
          <label class="field field--full"><span class="field__label">Modo del mercado</span>
            <select class="field__input" name="mode">
              <option value="auto" ${league.marketOverride === null ? "selected" : ""}>Automático: abierto solo los miércoles</option>
              <option value="open" ${league.marketOverride === true ? "selected" : ""}>Forzar abierto</option>
              <option value="closed" ${league.marketOverride === false ? "selected" : ""}>Forzar cerrado</option>
            </select>
          </label>
          <div class="form-actions field--full"><button class="btn btn--primary btn--sm" type="submit">Guardar ventana</button></div>
        </form>
      </section>
      <section class="panel">
        <div class="panel__head"><div><h3>Clausulazos</h3><p>Uso por club en esta ventana</p></div></div>
        <div class="detail-list">
          ${store.state.teams.map((team) => `<div class="detail-list__row"><span>${esc(team.name)}</span><strong>${team.clausulazoUsed ? "Utilizado" : "Disponible"}</strong></div>`).join("")}
        </div>
      </section>
    </div>
    <section class="panel panel--flush" style="margin-top:20px">
      <div class="panel__head"><div><h3>Ofertas pendientes</h3><p>Acepta o rechaza como organización</p></div><span class="pill pill--outline">${pending.length} pendientes</span></div>
      <div style="padding:4px 20px 14px">
        ${pending.length ? pending.map((transfer) => {
          const player = store.player(transfer.playerId);
          const buyer = store.team(transfer.buyerTeamId);
          const seller = store.team(transfer.sellerTeamId);
          return `<div class="activity-row">
            <span class="activity-row__icon">${icon("transfer", 14)}</span>
            <div style="flex:1"><p><strong>${esc(player?.name || "Jugador")}</strong> · ${esc(seller?.name || "—")} → ${esc(buyer?.name || "—")}</p><span>${money(transfer.price)} · ${esc(fmtDate(transfer.date.slice(0, 10)))}</span></div>
            <div class="row" style="gap:4px"><button class="btn btn--danger btn--xs" type="button" data-reject="${esc(transfer.id)}">Rechazar</button><button class="btn btn--primary btn--xs" type="button" data-accept="${esc(transfer.id)}">Aceptar</button></div>
          </div>`;
        }).join("") : `<div class="admin-empty">Sin ofertas pendientes.</div>`}
      </div>
    </section>`;
}

function newsTab() {
  return `${adminHead("Noticias", "Publica comunicados y actualiza la portada.", `<button class="btn btn--primary btn--sm" type="button" data-new-news>${icon("plus", 14)} Nueva publicación</button>`)}
    <div class="admin-panel">
      <div class="table-wrap">
        <table class="table table--dense table--stack">
          <thead><tr><th>Título</th><th>Categoría</th><th>Fecha</th><th>Autor</th><th>Portada</th><th>Acciones</th></tr></thead>
          <tbody>
            ${store.state.news.map((article) => `<tr>
              <td data-label="Título"><strong style="font-size:12px">${esc(article.title)}</strong><span class="table__muted" style="display:block">${esc(article.excerpt)}</span></td>
              <td data-label="Categoría"><span class="pill pill--outline">${esc(article.category)}</span></td>
              <td data-label="Fecha" class="mono tiny">${esc(fmtDate(article.date))}</td>
              <td data-label="Autor">${esc(article.author || "IMEX")}</td>
              <td data-label="Portada">${article.important ? `<span class="pill pill--accent">Sí</span>` : `<span class="pill pill--muted">No</span>`}</td>
              <td data-label="Acciones"><div class="table__actions"><button class="btn btn--ghost btn--xs" type="button" data-edit-news="${esc(article.id)}">Editar</button><button class="btn btn--ghost btn--xs" type="button" data-delete-news="${esc(article.id)}" style="color:var(--danger)">Eliminar</button></div></td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function leagueTab() {
  const league = store.state.league;
  return `${adminHead("Configuración de liga", "Nombre, formato, premios y presupuesto Fantasy.", `<a class="btn btn--ghost btn--sm" href="#/reglas">${icon("book", 14)} Ver reglamento</a>`)}
    <div class="admin-panel" style="padding:20px">
      <form data-league-form>
        <div class="form-grid">
          ${field({ label: "Nombre corto", name: "name", value: league.name, required: true })}
          ${field({ label: "Nombre oficial", name: "officialName", value: league.officialName, required: true })}
          ${field({ label: "Temporada", name: "season", value: league.season })}
          ${field({ label: "Lema", name: "tagline", value: league.tagline })}
          ${field({ label: "Sede", name: "venue", value: league.venue })}
          ${field({ label: "Formato", name: "format", value: league.format })}
          ${field({ label: "Premio por victoria (M)", name: "winReward", type: "number", value: league.winReward, min: 0, max: 9999 })}
          ${field({ label: "Premio por empate (M)", name: "drawReward", type: "number", value: league.drawReward, min: 0, max: 9999 })}
          ${field({ label: "Premio por clasificar (M)", name: "qualificationReward", type: "number", value: league.qualificationReward, min: 0, max: 9999 })}
          ${field({ label: "Presupuesto Fantasy (M)", name: "fantasyBudget", type: "number", value: league.fantasyBudget, min: 0, max: 9999 })}
          ${field({ label: "Cierre del mercado", name: "marketClosesAt", type: "datetime-local", value: String(league.marketClosesAt || "").slice(0, 16), full: true })}
        </div>
        <div class="form-actions"><button class="btn btn--primary" type="submit">Guardar configuración</button></div>
      </form>
    </div>`;
}

function dataTab() {
  const config = store.getSupabaseConfig();
  return `${adminHead("Datos y sincronización", "Conecta Supabase para multijugador real o trabaja en modo local.", `<button class="btn btn--ghost btn--sm" type="button" data-export>${icon("download", 14)} Exportar</button>`)}
    <div class="grid grid--2" style="align-items:start">
      <section class="panel">
        <div class="panel__head"><div><h3>Estado actual</h3><p>Diagnóstico de la plataforma</p></div><span class="pill ${store.remoteReady ? "pill--success" : "pill--muted"}">${store.remoteReady ? "Supabase" : "Local"}</span></div>
        <div class="detail-list">
          <div class="detail-list__row"><span>Modo de autenticación</span><strong>${auth.mode === "supabase" ? "Supabase Auth" : "Local (PBKDF2)"}</strong></div>
          <div class="detail-list__row"><span>Sincronización</span><strong>${store.remoteReady ? "Supabase Realtime" : "BroadcastChannel + localStorage"}</strong></div>
          <div class="detail-list__row"><span>Última escritura</span><strong>${esc(relativeTime(store.state.updatedAt))}</strong></div>
          <div class="detail-list__row"><span>Cliente</span><strong class="mono tiny">${esc(store.clientId)}</strong></div>
          <div class="detail-list__row"><span>Tamaño del estado</span><strong>${number(JSON.stringify(store.state).length)} caracteres</strong></div>
        </div>
        ${store.remoteError ? `<p class="notice notice--danger" style="margin-top:12px">${icon("alert", 16)}<span>${esc(store.remoteError)}</span></p>` : `<p class="notice" style="margin-top:12px">${icon("info", 16)}<span>El modo local sincroniza pestañas del mismo navegador. Para varios usuarios y dispositivos conecta Supabase.</span></p>`}
        <div class="form-actions" style="justify-content:flex-start">
          <button class="btn btn--ghost btn--sm" type="button" data-import>${icon("upload", 14)} Importar respaldo</button>
          <button class="btn btn--danger btn--sm" type="button" data-reset>${icon("alert", 14)} Reiniciar demo</button>
          <input type="file" accept="application/json,.json" hidden data-import-input>
        </div>
      </section>

      <section class="panel">
        <div class="panel__head"><div><h3>Supabase</h3><p>Proyecto y clave anónima</p></div></div>
        <form data-supabase-form class="form-grid">
          ${field({ label: "Project URL", name: "url", value: config.url, placeholder: "https://xxxx.supabase.co", full: true })}
          ${field({ label: "Anon key", name: "key", value: config.key, type: "password", placeholder: "eyJhbGciOi…", full: true })}
          <p class="field__hint field--full">Crea la tabla <span class="mono">app_state</span> y las políticas RLS con el archivo <span class="mono">supabase-schema.sql</span> incluido en el proyecto. La app recargará la página al guardar.</p>
          <div class="form-actions field--full"><button class="btn btn--primary btn--sm" type="submit">Guardar y recargar</button></div>
        </form>
      </section>
    </div>`;
}

function positionFallback(position) {
  return { POR: "Portero", DEF: "Defensa", MED: "Mediocampista", DEL: "Delantero" }[position] || position;
}

function accountRow(account) {
  const team = account.teamId ? store.team(account.teamId) : null;
  const player = account.playerId ? store.player(account.playerId) : null;
  return `<tr>
    <td data-label="Cuenta"><div class="account-cell"><span class="avatar avatar--sm">${esc((account.name || account.email).slice(0, 2).toUpperCase())}</span><span class="account-cell__main"><strong>${esc(account.name || "Cuenta IMEX")}</strong><span>${esc(account.email)}</span></span></div></td>
    <td data-label="Rol"><span class="pill ${account.role === "ADMIN" ? "pill--ink" : account.role === "PRESIDENT" ? "pill--accent" : account.role === "PLAYER" ? "pill--success" : "pill--muted"}">${esc(roleLabel(account.role))}</span></td>
    <td data-label="Club / jugador">${team ? esc(team.short) : "—"}${player ? ` · ${esc(player.name)}` : ""}</td>
    <td data-label="Alta" class="mono tiny">${account.createdAt ? esc(fmtDate(account.createdAt.slice(0, 10))) : "—"}</td>
    <td data-label="Acciones"><div class="table__actions">
      <button class="btn btn--ghost btn--xs" type="button" data-account-edit="${esc(account.id)}">Editar</button>
      <button class="btn btn--ghost btn--xs" type="button" data-account-pass="${esc(account.id)}">Contraseña</button>
      <button class="btn btn--ghost btn--xs" type="button" data-account-delete="${esc(account.id)}" style="color:var(--danger)">Eliminar</button>
    </div></td>
  </tr>`;
}

function openAccountForm(account, onDone) {
  const roleOptions = [
    { value: "FAN", label: "Aficionado" },
    { value: "PLAYER", label: "Jugador" },
    { value: "PRESIDENT", label: "Presidente" },
    { value: "ADMIN", label: "Organizador" }
  ];
  const teamOptions = [{ value: "", label: "Sin club" }, ...store.state.teams.map((team) => ({ value: team.id, label: team.name }))];
  const playerOptions = [{ value: "", label: "Sin jugador" }, ...store.state.players.map((player) => ({ value: player.id, label: `${player.name} · ${store.team(player.teamId)?.short || ""}` }))];
  openModal({
    title: account ? "Editar cuenta" : "Nueva cuenta",
    eyebrow: "Gestión de usuarios",
    size: "lg",
    body: `<form data-account-form>
      <div class="form-grid">
        ${field({ label: "Nombre", name: "name", value: account?.name || "", required: true })}
        ${field({ label: "Correo", name: "email", type: "email", value: account?.email || "", required: true })}
        ${field({ label: "Rol", name: "role", type: "select", value: account?.role || "FAN", options: roleOptions })}
        ${field({ label: "Club", name: "teamId", type: "select", value: account?.teamId || "", options: teamOptions })}
        ${field({ label: "Jugador vinculado", name: "playerId", type: "select", value: account?.playerId || "", options: playerOptions, full: true })}
        ${field({ label: account ? "Nueva contraseña (opcional)" : "Contraseña inicial", name: "password", type: "password", required: !account, autocomplete: "new-password", hint: "Mínimo 8 caracteres. Como organizador puedes cambiarla cuando quieras.", full: true })}
      </div>
      <p class="notice" style="margin-top:14px">${icon("info", 16)}<span>Los presidentes solo ven su club. Los jugadores pueden editar su foto y apodo. El organizador controla toda la plataforma.</span></p>
      <div class="form-actions">
        <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
        <button class="btn btn--primary" type="submit">${account ? "Guardar cuenta" : "Crear cuenta"}</button>
      </div>
    </form>`,
    onMount(root, close) {
      const form = root.querySelector("[data-account-form]");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        const values = formValues(form);
        const password = String(values.password || "");
        if ((!account && password.length < 8) || (account && password && password.length < 8)) {
          toast("La contraseña debe tener al menos 8 caracteres.", "danger");
          return;
        }
        button.disabled = true;
        button.classList.add("is-loading");
        try {
          if (account) {
            await auth.adminUpdateAccount(account.id, {
              name: values.name,
              email: values.email,
              role: values.role,
              teamId: values.teamId || null,
              playerId: values.playerId || null
            });
            if (password) await auth.adminSetPassword(account.id, password);
            toast("Cuenta actualizada.", "success");
          } else {
            await auth.adminCreateAccount({
              name: values.name,
              email: values.email,
              password,
              role: values.role,
              teamId: values.teamId || null,
              playerId: values.playerId || null
            });
            toast("Cuenta creada.", "success");
          }
          close();
          onDone?.();
        } catch (error) {
          toast(error.message, "danger");
          button.disabled = false;
          button.classList.remove("is-loading");
        }
      });
    }
  });
}

function openPasswordForm(account, onDone) {
  openModal({
    title: "Cambiar contraseña",
    eyebrow: account.name || account.email,
    size: "sm",
    body: `<form data-admin-pass-form>
      <p class="modal-copy">Define una nueva contraseña para <strong>${esc(account.email)}</strong>. El usuario deberá usarla en su próximo inicio de sesión.</p>
      ${field({ label: "Nueva contraseña", name: "password", type: "password", required: true, autocomplete: "new-password", hint: "Mínimo 8 caracteres." })}
      ${field({ label: "Repetir contraseña", name: "confirm", type: "password", required: true, autocomplete: "new-password" })}
      <p class="auth-error" data-error hidden></p>
      <div class="form-actions">
        <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
        <button class="btn btn--primary" type="submit">Actualizar contraseña</button>
      </div>
    </form>`,
    onMount(root, close) {
      const form = root.querySelector("[data-admin-pass-form]");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const values = formValues(form);
        const errorBox = form.querySelector("[data-error]");
        if (values.password.length < 8) {
          errorBox.textContent = "La contraseña debe tener al menos 8 caracteres.";
          errorBox.hidden = false;
          return;
        }
        if (values.password !== values.confirm) {
          errorBox.textContent = "Las contraseñas no coinciden.";
          errorBox.hidden = false;
          return;
        }
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        button.classList.add("is-loading");
        try {
          await auth.adminSetPassword(account.id, values.password);
          toast("Contraseña actualizada.", "success");
          close();
          onDone?.();
        } catch (error) {
          errorBox.textContent = error.message;
          errorBox.hidden = false;
          button.disabled = false;
          button.classList.remove("is-loading");
        }
      });
    }
  });
}

function startTournamentWizard() {
  confirmDialog({
    title: "Iniciar nuevo torneo",
    message: "Se borrarán todos los clubes, jugadores, calendario, fichajes y draft actuales. Después podrás registrar los clubes y jugadores reales. ¿Continuar?",
    confirmLabel: "Borrar y empezar",
    tone: "danger-solid",
    onConfirm: () => {
      store.startNewTournament();
      toast("Torneo reiniciado. Registra los clubes.", "success");
      location.hash = "#/admin?tab=clubes";
      setTimeout(openTournamentClubStep, 150);
    }
  });
}

function openTournamentClubStep() {
  openTeamForm(null, {
    onSaved: (team) => {
      if (!team) return;
      openTournamentPlayerStep(team);
    }
  });
}

function openTournamentPlayerStep(team) {
  openPlayerForm(null, {
    teamId: team.id,
    onSaved: () => {
      openTournamentPlayerStep(team);
    }
  });
}

export default {
  render({ query }) {
    const tab = TABS.some(([key]) => key === query.tab) ? query.tab : "resumen";
    const content = {
      resumen: overview,
      partidos: matchesTab,
      clubes: clubsTab,
      jugadores: playersTab,
      cuentas: accountsTab,
      mercado: marketTab,
      noticias: newsTab,
      liga: leagueTab,
      datos: dataTab
    }[tab]();
    return `<div class="container page">
      <div class="page-head" style="margin-bottom:22px">
        <div><p class="eyebrow">Organización</p><h1>Panel</h1><p class="page-head__copy">Control total de la Kings League IMEX: resultados, clubes, jugadores, cuentas, mercado y configuración.</p></div>
        <div class="page-head__action"><span class="pill pill--accent">${icon("sliders", 12)} Administrador</span><a class="btn btn--ghost btn--sm" href="#/cuenta">Mi cuenta</a></div>
      </div>
      <div class="admin-layout">
        <aside class="admin-nav">
          ${TABS.map(([key, label, iconName], index) => `${index === 5 ? '<div class="admin-nav__sep"></div>' : ""}<a class="${tab === key ? "is-active" : ""}" href="#/admin?tab=${key}">${icon(iconName, 15)}${label}</a>`).join("")}
        </aside>
        <div class="admin-main">${content}</div>
      </div>
    </div>`;
  },
  bind(root, { query }) {
    const tab = TABS.some(([key]) => key === query.tab) ? query.tab : "resumen";

    root.querySelectorAll("[data-tab-link]").forEach((button) => {
      button.addEventListener("click", () => {
        location.hash = `#/admin?tab=${button.dataset.tabLink}`;
      });
    });

    root.querySelector("[data-new-match]")?.addEventListener("click", () => openMatchForm());
    root.querySelector("[data-new-team]")?.addEventListener("click", () => openTeamForm());
    root.querySelector("[data-new-tournament]")?.addEventListener("click", startTournamentWizard);
    root.querySelector("[data-new-player]")?.addEventListener("click", () => openPlayerForm());
    root.querySelector("[data-new-news]")?.addEventListener("click", () => openNewsForm());

    root.querySelector("[data-draw-groups]")?.addEventListener("click", () => {
      confirmDialog({
        title: "Sortear grupos",
        message: "Los grupos se repartirán al azar entre los clubes inscritos. Reemplaza los grupos y el calendario actuales.",
        confirmLabel: "Sortear",
        onConfirm: () => {
          const result = store.drawGroups({ groupCount: 2 });
          toast(result.ok ? `Grupos sorteados: ${result.letters.join(", ")}.` : result.message, result.ok ? "success" : "danger");
        }
      });
    });
    root.querySelector("[data-manual-groups]")?.addEventListener("click", () => openGroupsForm());
    root.querySelector("[data-schedule]")?.addEventListener("click", () => openScheduleForm());
    root.querySelector("[data-start-tournament]")?.addEventListener("click", () => {
      confirmDialog({
        title: "Dar por iniciado el torneo",
        message: "Se marcará el torneo como iniciado. Asegúrate de que grupos y calendario son definitivos.",
        confirmLabel: "Iniciar torneo",
        tone: "danger-solid",
        onConfirm: () => {
          const result = store.startTournament();
          toast(result.ok ? "Torneo iniciado." : result.message, result.ok ? "success" : "danger");
        }
      });
    });

    root.querySelectorAll("[data-result]").forEach((button) => {
      button.addEventListener("click", () => {
        const match = store.match(button.dataset.result);
        if (match) openMatchResult(match);
      });
    });
    root.querySelectorAll("[data-quick-result]").forEach((button) => {
      button.addEventListener("click", () => {
        const match = store.match(button.dataset.quickResult);
        if (match) openMatchResult(match);
      });
    });
    root.querySelectorAll("[data-edit-team]").forEach((button) => {
      button.addEventListener("click", () => openTeamForm(button.dataset.editTeam));
    });
    root.querySelectorAll("[data-edit-player]").forEach((button) => {
      button.addEventListener("click", () => openPlayerForm(button.dataset.editPlayer));
    });
    root.querySelectorAll("[data-delete-player]").forEach((button) => {
      button.addEventListener("click", () => {
        const player = store.player(button.dataset.deletePlayer);
        if (!player) return;
        confirmDialog({
          title: "Eliminar jugador",
          message: `Se eliminará a ${player.name} del registro y de todos los equipos Fantasy. Esta acción no se puede deshacer.`,
          confirmLabel: "Eliminar",
          tone: "danger-solid",
          onConfirm: () => {
            store.deletePlayer(player.id);
            toast("Jugador eliminado.", "success");
          }
        });
      });
    });
    root.querySelectorAll("[data-edit-news]").forEach((button) => {
      button.addEventListener("click", () => openNewsForm(button.dataset.editNews));
    });
    root.querySelectorAll("[data-delete-news]").forEach((button) => {
      button.addEventListener("click", () => {
        const article = store.state.news.find((item) => item.id === button.dataset.deleteNews);
        if (!article) return;
        confirmDialog({
          title: "Eliminar publicación",
          message: `Se eliminará «${article.title}». ¿Continuar?`,
          confirmLabel: "Eliminar",
          tone: "danger-solid",
          onConfirm: () => {
            store.deleteNews(article.id);
            toast("Publicación eliminada.", "success");
          }
        });
      });
    });

    root.querySelectorAll("[data-toggle-market]").forEach((button) => {
      button.addEventListener("click", () => {
        store.toggleMarket(!store.isMarketOpen());
        toast(store.isMarketOpen() ? "Mercado abierto." : "Mercado cerrado.", "success");
      });
    });
    root.querySelectorAll("[data-reset-clausulazos]").forEach((button) => {
      button.addEventListener("click", () => {
        confirmDialog({
          title: "Reiniciar clausulazos",
          message: "Todos los clubes podrán volver a usar un clausulazo. ¿Continuar?",
          confirmLabel: "Reiniciar",
          onConfirm: () => {
            store.resetClausulazos();
            toast("Clausulazos reiniciados.", "success");
          }
        });
      });
    });
    root.querySelectorAll("[data-accept]").forEach((button) => {
      button.addEventListener("click", () => {
        const result = store.respondOffer(button.dataset.accept, true);
        toast(result.message || (result.ok ? "Oferta aceptada." : "No se pudo aceptar."), result.ok ? "success" : "danger");
      });
    });
    root.querySelectorAll("[data-reject]").forEach((button) => {
      button.addEventListener("click", () => {
        const result = store.respondOffer(button.dataset.reject, false);
        toast(result.message || (result.ok ? "Oferta rechazada." : "No se pudo rechazar."), result.ok ? "success" : "danger");
      });
    });

    const marketForm = root.querySelector("[data-market-form]");
    marketForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = formValues(marketForm);
      const mode = values.mode;
      const override = mode === "open" ? true : mode === "closed" ? false : null;
      store.toggleMarket(override, store.state.league.marketClosesAt);
      toast("Ventana de mercado actualizada.", "success");
    });

    const leagueForm = root.querySelector("[data-league-form]");
    leagueForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = formValues(leagueForm);
      store.updateLeague({
        name: values.name,
        officialName: values.officialName,
        season: values.season,
        tagline: values.tagline,
        venue: values.venue,
        format: values.format,
        winReward: Number(values.winReward),
        drawReward: Number(values.drawReward),
        qualificationReward: Number(values.qualificationReward),
        fantasyBudget: Number(values.fantasyBudget),
        marketClosesAt: values.marketClosesAt ? `${values.marketClosesAt}:00-06:00` : store.state.league.marketClosesAt
      });
      toast("Configuración de liga guardada.", "success");
    });

    if (tab === "jugadores") {
      const search = root.querySelector("[data-player-search]");
      const teamFilter = root.querySelector("[data-player-team]");
      const body = root.querySelector("[data-players-body]");
      const count = root.querySelector("[data-player-count]");
      const apply = () => {
        if (!body) return;
        const term = String(search?.value || "").trim().toLowerCase();
        const teamId = teamFilter?.value || "";
        const list = store.state.players.filter((player) => {
          const team = store.team(player.teamId);
          const haystack = `${player.name} ${player.nickname || ""} ${team?.name || ""}`.toLowerCase();
          return (!term || haystack.includes(term)) && (!teamId || player.teamId === teamId);
        });
        body.innerHTML = list.length ? list.map((player) => {
          const team = store.team(player.teamId);
          return `<tr>
            <td data-label="Jugador"><div class="account-cell"><span class="avatar avatar--sm">${esc(player.number || "—")}</span><span class="account-cell__main"><strong>${esc(player.name)}</strong><span>${esc(player.nickname || positionFallback(player.position))}</span></span></div></td>
            <td data-label="Club">${team ? `<a class="table__club" href="#/equipo/${esc(team.id)}">${teamCrest(team, 20)}<span>${esc(team.short)}</span></a>` : "—"}</td>
            <td data-label="Pos."><span class="mono tiny">${esc(player.position)}</span></td>
            <td class="table__num" data-label="Dorsal">${esc(player.number || "—")}</td>
            <td class="table__num" data-label="Valor">${money(player.value)}</td>
            <td class="table__num" data-label="Goles">${number(player.goals)}</td>
            <td data-label="Estado">${player.insignia ? `<span class="pill pill--accent">Insignia</span>` : `<span class="pill pill--muted">Disponible</span>`}</td>
            <td data-label="Acciones"><div class="table__actions"><button class="btn btn--ghost btn--xs" type="button" data-edit-player="${esc(player.id)}">Editar</button><button class="btn btn--ghost btn--xs" type="button" data-delete-player="${esc(player.id)}" style="color:var(--danger)">Eliminar</button></div></td>
          </tr>`;
        }).join("") : `<tr><td colspan="8"><div class="admin-empty">Sin resultados para ese filtro.</div></td></tr>`;
        if (count) count.textContent = `${list.length} jugadores`;
        bindPlayerRowActions(body);
      };
      let timer = 0;
      search?.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(apply, 140);
      });
      teamFilter?.addEventListener("change", apply);
    }

    function bindPlayerRowActions(container) {
      container.querySelectorAll("[data-edit-player]").forEach((button) => {
        button.addEventListener("click", () => openPlayerForm(button.dataset.editPlayer));
      });
      container.querySelectorAll("[data-delete-player]").forEach((button) => {
        button.addEventListener("click", () => {
          const player = store.player(button.dataset.deletePlayer);
          if (!player) return;
          confirmDialog({
            title: "Eliminar jugador",
            message: `Se eliminará a ${player.name} del registro y del Fantasy.`,
            confirmLabel: "Eliminar",
            tone: "danger-solid",
            onConfirm: () => {
              store.deletePlayer(player.id);
              toast("Jugador eliminado.", "success");
            }
          });
        });
      });
    }

    if (tab === "cuentas") {
      const body = root.querySelector("[data-accounts-body]");
      const search = root.querySelector("[data-account-search]");
      let accounts = [];
      const apply = () => {
        if (!body) return;
        const term = String(search?.value || "").trim().toLowerCase();
        const list = accounts.filter((account) => `${account.name} ${account.email} ${account.role}`.toLowerCase().includes(term));
        body.innerHTML = list.length ? `<div class="table-wrap"><table class="table table--dense table--stack"><thead><tr><th>Cuenta</th><th>Rol</th><th>Club / jugador</th><th>Alta</th><th>Acciones</th></tr></thead><tbody>${list.map(accountRow).join("")}</tbody></table></div>` : `<div class="admin-empty">No hay cuentas que coincidan con la búsqueda.</div>`;
        bindAccountActions(body, accounts, loadAccounts);
      };
      async function loadAccounts() {
        if (!body) return;
        body.innerHTML = `<div class="admin-empty">Cargando cuentas…</div>`;
        try {
          accounts = await auth.fetchAccounts();
          apply();
        } catch (error) {
          body.innerHTML = `<div class="admin-empty" style="color:var(--danger)">${esc(error.message)}</div>`;
        }
      }
      search?.addEventListener("input", apply);
      root.querySelector("[data-reload-accounts]")?.addEventListener("click", loadAccounts);
      root.querySelector("[data-new-account]")?.addEventListener("click", () => openAccountForm(null, loadAccounts));
      loadAccounts();
    }

    if (tab === "datos") {
      root.querySelector("[data-export]")?.addEventListener("click", () => {
        download(`imex-backup-${new Date().toISOString().slice(0, 10)}.json`, store.exportState());
        toast("Respaldo exportado.", "success");
      });
      const importInput = root.querySelector("[data-import-input]");
      root.querySelector("[data-import]")?.addEventListener("click", () => importInput?.click());
      importInput?.addEventListener("change", async () => {
        const file = importInput.files?.[0];
        if (!file) return;
        const text = await file.text();
        const result = store.importState(text);
        toast(result.ok ? "Respaldo importado." : result.message, result.ok ? "success" : "danger");
        importInput.value = "";
      });
      root.querySelector("[data-reset]")?.addEventListener("click", () => {
        confirmDialog({
          title: "Reiniciar demo",
          message: "Se borrarán todos los cambios locales y se restaurarán los datos originales del torneo y las cuentas demo. ¿Continuar?",
          confirmLabel: "Reiniciar demo",
          tone: "danger-solid",
          onConfirm: async () => {
            store.resetDemo();
            await auth.seedLocal();
            toast("Datos de demostración restaurados.", "success");
            location.hash = "#/";
          }
        });
      });
      const supabaseForm = root.querySelector("[data-supabase-form]");
      supabaseForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = formValues(supabaseForm);
        if (!values.url || !values.key) {
          toast("Introduce la URL y la clave anónima del proyecto.", "danger");
          return;
        }
        store.configureSupabase(values.url.trim(), values.key.trim());
      });
    }
  }
};

function openGroupsForm() {
  const teams = store.state.teams;
  if (teams.length < 2) return toast("Inscribe al menos dos clubes primero.", "danger");
  const groupOptions = [
    { value: "A", label: "Grupo A" },
    { value: "B", label: "Grupo B" },
    { value: "C", label: "Grupo C" },
    { value: "D", label: "Grupo D" }
  ].slice(0, Math.max(2, Math.min(4, Math.floor(teams.length / 2))));
  openModal({
    title: "Asignar grupos",
    eyebrow: "Fase de grupos",
    size: "lg",
    body: `<form data-groups-form>
      <div class="form-grid">
        ${teams.map((team) => field({ label: team.name, name: `g-${team.id}`, type: "select", value: team.group || groupOptions[0].value, options: groupOptions, full: false })).join("")}
      </div>
      <div class="form-actions">
        <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
        <button class="btn btn--primary" type="submit">Guardar grupos</button>
      </div>
    </form>`,
    onMount(root, close) {
      root.querySelector("[data-groups-form]").addEventListener("submit", (event) => {
        event.preventDefault();
        const values = formValues(event.currentTarget);
        const manual = Object.fromEntries(teams.map((team) => [team.id, values[`g-${team.id}`]]));
        const result = store.drawGroups({ manual, groupCount: groupOptions.length });
        toast(result.ok ? "Grupos guardados." : result.message, result.ok ? "success" : "danger");
        if (result.ok) close();
      });
    }
  });
}

function openScheduleForm() {
  const today = new Date().toISOString().slice(0, 10);
  openModal({
    title: "Generar calendario",
    eyebrow: "Fase de grupos",
    size: "md",
    body: `<form data-schedule-form>
      <div class="form-grid">
        ${field({ label: "Fecha de la jornada 1", name: "startDate", type: "date", value: today, required: true })}
        ${field({ label: "Días entre jornadas", name: "daysBetween", type: "number", value: 7, min: 1, max: 14 })}
        ${field({ label: "Hora de inicio", name: "time", type: "time", value: "10:30", required: true })}
      </div>
      <p class="field__hint" style="margin-top:10px">Todos contra todos dentro de cada grupo. Reemplaza el calendario de grupos actual.</p>
      <div class="form-actions">
        <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
        <button class="btn btn--primary" type="submit">Generar</button>
      </div>
    </form>`,
    onMount(root, close) {
      root.querySelector("[data-schedule-form]").addEventListener("submit", (event) => {
        event.preventDefault();
        const values = formValues(event.currentTarget);
        const result = store.generateSchedule(values);
        toast(result.ok ? `Calendario generado: ${result.count} partidos.` : result.message, result.ok ? "success" : "danger");
        if (result.ok) close();
      });
    }
  });
}

function bindAccountActions(container, accounts, reload) {
  container.querySelectorAll("[data-account-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const account = accounts.find((item) => item.id === button.dataset.accountEdit);
      if (account) openAccountForm(account, reload);
    });
  });
  container.querySelectorAll("[data-account-pass]").forEach((button) => {
    button.addEventListener("click", () => {
      const account = accounts.find((item) => item.id === button.dataset.accountPass);
      if (account) openPasswordForm(account, reload);
    });
  });
  container.querySelectorAll("[data-account-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const account = accounts.find((item) => item.id === button.dataset.accountDelete);
      if (!account) return;
      confirmDialog({
        title: "Eliminar cuenta",
        message: `Se eliminará la cuenta de ${account.name || account.email}. El usuario perderá el acceso y su equipo Fantasy se borrará.`,
        confirmLabel: "Eliminar cuenta",
        tone: "danger-solid",
        onConfirm: async () => {
          await auth.adminDeleteAccount(account.id);
          toast("Cuenta eliminada.", "success");
          if (store.user?.id === account.id) {
            location.hash = "#/";
            return;
          }
          reload();
        }
      });
    });
  });
}
