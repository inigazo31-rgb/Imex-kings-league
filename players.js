import { store } from "../store.js";
import { esc, icon, number, money, positionLabel, emptyState, fmtDate } from "../utils.js";
import { pageHead } from "../ui.js";
import { playerCard, openPlayerForm } from "./shared.js";

const POSITIONS = [
  ["", "Todas las posiciones"],
  ["POR", "Porteros"],
  ["DEF", "Defensas"],
  ["MED", "Mediocampistas"],
  ["DEL", "Delanteros"]
];

function filtered({ search = "", teamId = "", position = "", sort = "value" }) {
  const term = search.trim().toLowerCase();
  let list = store.state.players.filter((player) => {
    const team = store.team(player.teamId);
    const haystack = `${player.name} ${player.nickname || ""} ${team?.name || ""}`.toLowerCase();
    if (term && !haystack.includes(term)) return false;
    if (teamId && player.teamId !== teamId) return false;
    if (position && player.position !== position) return false;
    return true;
  });
  const sorters = {
    value: (a, b) => b.value - a.value,
    goals: (a, b) => b.goals - a.goals || b.assists - a.assists,
    name: (a, b) => a.name.localeCompare(b.name, "es"),
    fantasy: (a, b) => store.fantasyPoints(b) - store.fantasyPoints(a)
  };
  return list.sort(sorters[sort] || sorters.value);
}

function gridHtml(options) {
  const list = filtered(options);
  if (!list.length) {
    return emptyState("Sin jugadores", "No hay jugadores que coincidan con los filtros seleccionados.");
  }
  return list.map((player) => playerCard(player, store.team(player.teamId))).join("");
}

export default {
  render({ params }) {
    if (params.id) return profile(params.id);
    const teamOptions = [{ value: "", label: "Todos los clubes" }, ...store.state.teams.map((team) => ({ value: team.id, label: team.name }))];
    return `<div class="container page">
      ${pageHead({
        eyebrow: "Registro",
        title: "Jugadores",
        copy: "Fichas, tarjetas y estadísticas de los protagonistas de la temporada.",
        action: store.isAdmin() ? `<button class="btn btn--primary btn--sm" type="button" data-new-player>${icon("plus", 15)} Nuevo jugador</button>` : `<a class="btn btn--ghost btn--sm" href="#/fantasy">${icon("star", 15)} Fantasy</a>`
      })}
      <div class="filter-bar">
        <div class="search">${icon("search", 16)}<input type="search" placeholder="Buscar por jugador, apodo o club…" aria-label="Buscar jugadores" data-search></div>
        <select data-team aria-label="Filtrar por club">${teamOptions.map((option) => `<option value="${esc(option.value)}">${esc(option.label)}</option>`).join("")}</select>
        <select data-position aria-label="Filtrar por posición">${POSITIONS.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join("")}</select>
        <select data-sort aria-label="Ordenar jugadores">
          <option value="value">Mayor valor</option>
          <option value="goals">Más goles</option>
          <option value="fantasy">Más puntos Fantasy</option>
          <option value="name">Nombre A–Z</option>
        </select>
        <span class="filter-bar__count" data-count>${store.state.players.length} jugadores</span>
      </div>
      <div class="player-grid" data-player-grid>${gridHtml({})}</div>
    </div>`;
  },
  bind(root, { params }) {
    if (params.id) {
      const player = store.player(params.id);
      root.querySelector("[data-edit-player]")?.addEventListener("click", () => {
        if (player) openPlayerForm(player.id, { limited: !store.isAdmin() });
      });
      return;
    }
    root.querySelector("[data-new-player]")?.addEventListener("click", () => openPlayerForm());
    const search = root.querySelector("[data-search]");
    const team = root.querySelector("[data-team]");
    const position = root.querySelector("[data-position]");
    const sort = root.querySelector("[data-sort]");
    const grid = root.querySelector("[data-player-grid]");
    const count = root.querySelector("[data-count]");
    if (!grid) return;
    const apply = () => {
      const options = { search: search?.value || "", teamId: team?.value || "", position: position?.value || "", sort: sort?.value || "value" };
      grid.innerHTML = gridHtml(options);
      if (count) count.textContent = `${filtered(options).length} jugadores`;
    };
    let timer = 0;
    search?.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(apply, 160);
    });
    [team, position, sort].forEach((select) => select?.addEventListener("change", apply));
  }
};

function profile(playerId) {
  const player = store.player(playerId);
  if (!player) {
    return `<div class="container page">${emptyState("Jugador no encontrado", "La ficha que buscas no existe o fue eliminada.", `<a class="btn btn--primary" href="#/jugadores">Ver jugadores</a>`)}</div>`;
  }
  const team = store.team(player.teamId);
  const canEdit = store.isAdmin() || (store.isPlayer() && store.user?.playerId === player.id) || (store.isPresident() && store.user?.teamId === player.teamId);
  const teammates = store.teamPlayers(player.teamId).filter((item) => item.id !== player.id).slice(0, 4);
  const transfers = store.state.transfers.filter((item) => item.playerId === player.id);
  return `<div class="container page">
    <a class="text-link" href="#/jugadores" style="margin-bottom:20px">${icon("arrow", 14)} Volver al registro</a>
    <div class="player-hero">
      <div class="card-stage" style="--team:${esc(team?.primary || "#171717")}">
        ${playerCard(player, team)}
        <div class="card-stage__caption"><span>IMEX · ${esc(store.state.league.season)}</span><span>${player.insignia ? "Edición insignia" : "Edición oficial"}</span></div>
      </div>
      <div class="player-info">
        <p class="eyebrow">${team ? `<a href="#/equipo/${esc(team.id)}">${esc(team.name)}</a>` : "Agente libre"} · ${esc(positionLabel(player.position))}</p>
        <h1>${esc(player.name)}</h1>
        <div class="player-info__meta">
          ${player.insignia ? `<span class="pill pill--accent">${icon("star", 10)} Jugador insignia</span>` : `<span class="pill pill--outline">${esc(positionLabel(player.position))}</span>`}
          <span class="pill pill--muted">Dorsal ${esc(player.number || "—")}</span>
          <span class="pill pill--muted">${esc(team?.short || "LIB")}</span>
        </div>
        <p class="player-info__copy">${player.nickname ? `<strong>«${esc(player.nickname)}».</strong> ` : ""}${esc(player.name)} acumula ${number(player.goals)} goles y ${number(player.assists)} asistencias en ${number(player.played)} partidos con ${esc(team?.name || "su club")}. Valor de mercado: ${money(player.value)}.</p>
        <div class="stat-grid">
          <div class="stat"><span class="stat__label">Goles</span><span class="stat__value">${number(player.goals)}</span></div>
          <div class="stat"><span class="stat__label">Asistencias</span><span class="stat__value">${number(player.assists)}</span></div>
          <div class="stat"><span class="stat__label">Partidos</span><span class="stat__value">${number(player.played)}</span></div>
          <div class="stat"><span class="stat__label">Puntos Fantasy</span><span class="stat__value">${number(store.fantasyPoints(player))}</span></div>
        </div>
        <div class="row" style="margin-top:18px;flex-wrap:wrap">
          ${canEdit ? `<button class="btn btn--primary btn--sm" type="button" data-edit-player>${icon("camera", 15)} Editar ficha</button>` : ""}
          ${team ? `<a class="btn btn--ghost btn--sm" href="#/equipo/${esc(team.id)}">${icon("shield", 15)} Ver club</a>` : ""}
          <a class="btn btn--ghost btn--sm" href="#/mercado">${icon("transfer", 15)} Mercado</a>
        </div>
      </div>
    </div>

    <div class="grid grid--2" style="margin-top:24px;align-items:start">
      <section class="panel">
        <div class="panel__head"><div><h3>Ficha técnica</h3><p>Datos oficiales del jugador</p></div></div>
        <div class="detail-list">
          <div class="detail-list__row"><span>Club</span><strong>${team ? `<a href="#/equipo/${esc(team.id)}">${esc(team.name)}</a>` : "Agente libre"}</strong></div>
          <div class="detail-list__row"><span>Posición</span><strong>${esc(positionLabel(player.position))}</strong></div>
          <div class="detail-list__row"><span>Dorsal</span><strong>${esc(player.number || "—")}</strong></div>
          <div class="detail-list__row"><span>Valor / cláusula</span><strong>${money(player.value)}</strong></div>
          <div class="detail-list__row"><span>Puntos Fantasy</span><strong>${number(store.fantasyPoints(player))}</strong></div>
          <div class="detail-list__row"><span>Disciplina</span><strong>${number(player.yellow)} amarillas · ${number(player.red)} rojas</strong></div>
          <div class="detail-list__row"><span>Estado</span><strong>${player.insignia ? "Blindado" : "Disponible"}</strong></div>
        </div>
      </section>
      <section class="panel">
        <div class="panel__head"><div><h3>Trayectoria</h3><p>Movimientos registrados</p></div></div>
        ${transfers.length ? `<div class="activity-list">${transfers.map((transfer) => `<div class="activity-row">
          <span class="activity-row__icon">${icon("transfer", 14)}</span>
          <div><p>${esc(store.team(transfer.sellerTeamId)?.name || "—")} <span aria-hidden="true">→</span> ${esc(store.team(transfer.buyerTeamId)?.name || "—")}</p><span>${esc(fmtDate(transfer.date.slice(0, 10)))} · ${money(transfer.price)}</span></div>
        </div>`).join("")}</div>` : `<div class="admin-empty">Sin traspasos registrados. El jugador permanece en su club de origen.</div>`}
      </section>
    </div>

    ${teammates.length ? `<section style="margin-top:24px">
      <div class="section-head"><div><p class="eyebrow">Vestuario</p><h2>Compañeros de club</h2></div><a class="text-link" href="#/equipo/${esc(player.teamId)}">Ver plantilla ${icon("arrow", 14)}</a></div>
      <div class="player-grid">${teammates.map((item) => playerCard(item, team)).join("")}</div>
    </section>` : ""}
  </div>`;
}
