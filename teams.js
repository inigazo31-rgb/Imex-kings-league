import { store } from "../store.js";
import { esc, icon, teamCrest, playerPortrait, number, money, positionLabel, emptyState, fmtDate } from "../utils.js";
import { pageHead } from "../ui.js";
import { teamCard, matchRow, openPlayerForm, openTeamForm } from "./shared.js";

export default {
  render({ params }) {
    if (params.id) return profile(params.id);
    const rows = store.standings();
    const byId = new Map(rows.map((row, index) => [row.id, { ...row, pos: index + 1 }]));
    return `<div class="container page">
      ${pageHead({
        eyebrow: "Clubes",
        title: "Los ocho",
        copy: "Identidad, plantilla y finanzas de cada club de la Kings League IMEX.",
        action: store.isAdmin() ? `<button class="btn btn--primary btn--sm" type="button" data-new-team>${icon("plus", 15)} Nuevo club</button>` : `<a class="btn btn--ghost btn--sm" href="#/clasificacion">${icon("table", 15)} Clasificación</a>`
      })}
      <div class="team-grid">
        ${store.state.teams.map((team) => teamCard(team, byId.get(team.id))).join("")}
      </div>
      <div class="grid grid--2" style="margin-top:24px;align-items:start">
        <section class="panel">
          <div class="panel__head"><div><h3>Grupo A</h3><p>Cuatro clubes, dos boletos</p></div></div>
          <div class="mini-table">
            ${store.standings("A").map((row, index) => `<a class="mini-table__row ${index < 2 ? "is-qualify" : ""}" href="#/equipo/${esc(row.id)}">
              <span class="mini-table__pos">${index + 1}</span>
              <span class="mini-table__club">${teamCrest(row.team, 20)}<span>${esc(row.name)}</span></span>
              <span class="mini-table__gd">${row.gd > 0 ? "+" : ""}${row.gd}</span>
              <span class="mini-table__pts">${row.points}</span>
            </a>`).join("")}
          </div>
        </section>
        <section class="panel">
          <div class="panel__head"><div><h3>Grupo B</h3><p>Cuatro clubes, dos boletos</p></div></div>
          <div class="mini-table">
            ${store.standings("B").map((row, index) => `<a class="mini-table__row ${index < 2 ? "is-qualify" : ""}" href="#/equipo/${esc(row.id)}">
              <span class="mini-table__pos">${index + 1}</span>
              <span class="mini-table__club">${teamCrest(row.team, 20)}<span>${esc(row.name)}</span></span>
              <span class="mini-table__gd">${row.gd > 0 ? "+" : ""}${row.gd}</span>
              <span class="mini-table__pts">${row.points}</span>
            </a>`).join("")}
          </div>
        </section>
      </div>
    </div>`;
  },
  bind(root, { params }) {
    if (params.id) {
      bindProfile(root, params.id);
      return;
    }
    root.querySelector("[data-new-team]")?.addEventListener("click", () => openTeamForm());
  }
};

function profile(teamId) {
  const team = store.team(teamId);
  if (!team) {
    return `<div class="container page">${emptyState("Club no encontrado", "El club que buscas no existe.", `<a class="btn btn--primary" href="#/equipos">Ver clubes</a>`)}</div>`;
  }
  const canEdit = store.isAdmin() || (store.isPresident() && store.user?.teamId === team.id);
  const groupTable = store.standings(team.group);
  const groupPos = groupTable.findIndex((row) => row.id === team.id) + 1;
  const tableRow = store.standingsMap().get(team.id);
  const players = store.teamPlayers(team.id);
  const matches = store.state.matches
    .filter((match) => match.homeTeamId === team.id || match.awayTeamId === team.id)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const finances = store.state.finances.filter((item) => item.teamId === team.id).slice(0, 8);
  const transfers = store.state.transfers.filter((item) => item.buyerTeamId === team.id || item.sellerTeamId === team.id).slice(0, 5);
  return `<div class="container page">
    <a class="text-link" href="#/equipos" style="margin-bottom:16px">${icon("arrow", 14)} Volver a clubes</a>
    <section class="team-hero" style="--team:${esc(team.primary)};margin-bottom:20px">
      <div class="team-hero__crest">${teamCrest(team, 104, { onDark: true })}</div>
      <div class="team-hero__main">
        <p class="eyebrow">Grupo ${esc(team.group)} · ${esc(store.state.league.season)}</p>
        <h1>${esc(team.name)}</h1>
        <div class="team-hero__meta">
          <span>Presidente <strong>${esc(team.president)}</strong></span>
          <span>Plantilla <strong>${players.length} jugadores</strong></span>
          <span>Clausulazo <strong>${team.clausulazoUsed ? "Utilizado" : "Disponible"}</strong></span>
          <span>Fundación <strong>2026</strong></span>
        </div>
      </div>
      <div class="team-hero__stats">
        <div class="stat"><span class="stat__label">Posición</span><span class="stat__value">${groupPos || "—"}º</span><span class="stat__meta" style="color:rgba(243,241,235,.45)">Grupo ${esc(team.group)}</span></div>
        <div class="stat"><span class="stat__label">Puntos</span><span class="stat__value">${tableRow?.points || 0}</span><span class="stat__meta" style="color:rgba(243,241,235,.45)">${tableRow?.played || 0} partidos</span></div>
        <div class="stat"><span class="stat__label">Saldo</span><span class="stat__value">${money(team.balance)}</span><span class="stat__meta" style="color:rgba(243,241,235,.45)">Disponible</span></div>
      </div>
    </section>

    <div class="team-profile-grid">
      <section class="panel panel--flush">
        <div class="panel__head">
          <div><h3>Plantilla</h3><p>${players.length} jugadores registrados · ${money(team.squadValue)} de valor</p></div>
          <div class="row" style="gap:6px">
            ${canEdit ? `<button class="btn btn--ghost btn--sm" type="button" data-edit-team>${icon("edit", 14)} Editar club</button>` : ""}
            ${canEdit ? `<button class="btn btn--primary btn--sm" type="button" data-add-player>${icon("plus", 14)} Jugador</button>` : ""}
          </div>
        </div>
        <div class="squad-list" style="padding:4px 20px 16px">
          ${players.length ? players.map((player) => `<div class="squad-row">
            <span class="squad-row__num">${esc(player.number || "—")}</span>
            <a class="squad-row__player" href="#/jugador/${esc(player.id)}">
              ${playerPortrait(player, team, "sm")}
              <span style="min-width:0"><strong>${esc(player.name)}</strong><span>${player.nickname ? esc(player.nickname) : esc(positionLabel(player.position))}${player.insignia ? " · Insignia" : ""}</span></span>
            </a>
            <span class="squad-row__pos">${esc(player.position)}</span>
            <span class="squad-row__value">${money(player.value)}</span>
            <span class="squad-row__goals">${number(player.goals)} G</span>
            <span class="squad-row__action">${canEdit ? `<button class="icon-btn icon-btn--sm" type="button" data-edit-player="${esc(player.id)}" aria-label="Editar ${esc(player.name)}">${icon("edit", 15)}</button>` : `<a class="icon-btn icon-btn--sm" href="#/jugador/${esc(player.id)}" aria-label="Ver ficha">${icon("chevron", 15)}</a>`}</span>
          </div>`).join("") : `<div class="admin-empty">Este club todavía no tiene jugadores registrados.</div>`}
        </div>
      </section>

      <div class="stack">
        <section class="panel">
          <div class="panel__head"><div><h3>Información</h3><p>Ficha del club</p></div></div>
          <div class="detail-list">
            <div class="detail-list__row"><span>Nombre corto</span><strong>${esc(team.short)}</strong></div>
            <div class="detail-list__row"><span>Grupo</span><strong>${esc(team.group)}</strong></div>
            <div class="detail-list__row"><span>Presidente</span><strong>${esc(team.president)}</strong></div>
            <div class="detail-list__row"><span>Estadio</span><strong>${esc(store.state.league.venue)}</strong></div>
            <div class="detail-list__row"><span>Valor plantilla</span><strong>${money(team.squadValue)}</strong></div>
            <div class="detail-list__row"><span>Clausulazo</span><strong>${team.clausulazoUsed ? "Utilizado" : "Disponible"}</strong></div>
          </div>
        </section>

        <section class="panel">
          <div class="panel__head"><div><h3>Forma</h3><p>Últimos resultados</p></div></div>
          <div class="detail-list">
            <div class="detail-list__row"><span>PJ · G · E · P</span><strong>${tableRow?.played || 0} · ${tableRow?.won || 0} · ${tableRow?.drawn || 0} · ${tableRow?.lost || 0}</strong></div>
            <div class="detail-list__row"><span>Goles a favor</span><strong>${tableRow?.gf || 0}</strong></div>
            <div class="detail-list__row"><span>Goles en contra</span><strong>${tableRow?.ga || 0}</strong></div>
            <div class="detail-list__row"><span>Diferencia</span><strong>${(tableRow?.gd || 0) > 0 ? "+" : ""}${tableRow?.gd || 0}</strong></div>
            <div class="detail-list__row"><span>Puntos</span><strong>${tableRow?.points || 0}</strong></div>
          </div>
        </section>

        ${canEdit ? `<section class="panel">
          <div class="panel__head"><div><h3>Finanzas</h3><p>Saldo y movimientos del club</p></div></div>
          <div class="detail-list">
            <div class="detail-list__row"><span>Saldo actual</span><strong>${money(team.balance)}</strong></div>
            ${finances.slice(0, 4).map((item) => `<div class="detail-list__row"><span>${esc(item.concept)}</span><strong style="color:${item.type === "income" ? "var(--success)" : "var(--danger)"}">${item.type === "income" ? "+" : "−"}${money(item.amount)}</strong></div>`).join("")}
          </div>
        </section>` : ""}
      </div>
    </div>

    <div class="grid grid--2" style="margin-top:20px;align-items:start">
      <section class="panel panel--flush">
        <div class="panel__head"><div><h3>Partidos</h3><p>Calendario del club</p></div><a class="text-link" href="#/partidos">Todos ${icon("arrow", 14)}</a></div>
        ${matches.length ? matches.map(matchRow).join("") : `<div class="admin-empty">Sin partidos programados.</div>`}
      </section>
      <section class="panel panel--flush">
        <div class="panel__head"><div><h3>Movimientos</h3><p>Fichajes y operaciones recientes</p></div><a class="text-link" href="#/mercado">Mercado ${icon("arrow", 14)}</a></div>
        ${transfers.length ? transfers.map((transfer) => {
          const player = store.player(transfer.playerId);
          const buyer = store.team(transfer.buyerTeamId);
          const seller = store.team(transfer.sellerTeamId);
          return `<div class="activity-row" style="padding:12px 20px">
            <span class="activity-row__icon">${icon("transfer", 14)}</span>
            <div style="flex:1"><p><strong>${esc(player?.name || "Jugador")}</strong> · ${esc(seller?.short || "—")} → ${esc(buyer?.short || "—")}</p><span>${esc(transfer.type === "clausulazo" ? "Clausulazo" : "Acuerdo")} · ${esc(fmtDate(transfer.date.slice(0, 10)))}</span></div>
            <span class="mono small">${money(transfer.price)}</span>
          </div>`;
        }).join("") : `<div class="admin-empty">Sin movimientos registrados.</div>`}
      </section>
    </div>
  </div>`;
}

export function bindProfile(root, teamId) {
  const team = store.team(teamId);
  if (!team) return;
  root.querySelector("[data-edit-team]")?.addEventListener("click", () => openTeamForm(team.id));
  root.querySelector("[data-add-player]")?.addEventListener("click", () => openPlayerForm(null, { teamId: team.id }));
  root.querySelectorAll("[data-edit-player]").forEach((button) => {
    button.addEventListener("click", () => openPlayerForm(button.dataset.editPlayer, { limited: !store.isAdmin() }));
  });
}
