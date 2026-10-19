import { store } from "../store.js";
import { esc, icon, number, fmtDateLong, fmtDate, countdown, statusPill, teamCrest, emptyState, positionLabel } from "../utils.js";
import { pageHead, sectionHead } from "../ui.js";
import { matchRow, openMatchResult, field } from "./shared.js";

function groupByMatchday(matches) {
  const map = new Map();
  for (const match of matches) {
    const key = match.matchday || 0;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(match);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

function matchdayPanel(day, matches) {
  return `<section class="panel panel--flush" style="margin-bottom:16px">
    <div class="panel__head">
      <div><h3>${day === 3 ? "Eliminatorias" : `Jornada ${day}`}</h3><p>${matches.length} ${matches.length === 1 ? "partido" : "partidos"} · ${esc(fmtDate(matches[0]?.date))}</p></div>
      <span class="pill pill--outline">${matches.filter((match) => match.status === "finished").length}/${matches.length} finalizados</span>
    </div>
    ${matches.map(matchRow).join("")}
  </section>`;
}

function bracketView() {
  const semis = store.state.matches.filter((match) => match.phase === "semifinals").sort((a, b) => (a.id > b.id ? 1 : -1));
  const final = store.state.matches.find((match) => match.phase === "final");
  const club = (teamId, score, isWinner) => {
    const team = store.team(teamId);
    return `<div class="bracket-match__club ${isWinner ? "is-winner" : ""}">
      <span>${team ? teamCrest(team, 22) : ""}${esc(team?.name || "Por definir")}</span>
      <b>${score ?? "–"}</b>
    </div>`;
  };
  const matchCard = (match, title) => {
    const homeWin = match.status === "finished" && match.homeScore > match.awayScore;
    const awayWin = match.status === "finished" && match.awayScore > match.homeScore;
    return `<div class="bracket-match">
      <div class="bracket-match__meta">${esc(title)}</div>
      ${club(match.homeTeamId, match.homeScore, homeWin)}
      ${club(match.awayTeamId, match.awayScore, awayWin)}
      <div class="bracket-match__meta">${esc(fmtDate(match.date))} · ${esc(match.time || "—")} · ${esc(match.pitch || "")}</div>
    </div>`;
  };
  return `<div class="bracket">
    <div class="bracket-round">
      <p class="bracket-round__title">Fase de grupos</p>
      <div class="bracket-match">
        <div class="bracket-match__meta">Clasificación</div>
        <div class="bracket-match__club"><span>1.º y 2.º del Grupo A</span><b>A</b></div>
        <div class="bracket-match__club"><span>1.º y 2.º del Grupo B</span><b>B</b></div>
        <div class="bracket-match__meta">Los cuatro mejores avanzan</div>
      </div>
    </div>
    <div class="bracket-round">
      <p class="bracket-round__title">Semifinales</p>
      ${semis.length ? semis.map((match, index) => matchCard(match, match.title || `Semifinal ${index + 1}`)).join("") : `<div class="admin-empty">Sin semifinales programadas.</div>`}
    </div>
    <div class="bracket-round">
      <p class="bracket-round__title">Gran Final</p>
      ${final ? matchCard(final, final.title || "Gran Final") : `<div class="admin-empty">La final se programará al cerrar las semifinales.</div>`}
    </div>
  </div>`;
}

function listView(tab) {
  let matches = [...store.state.matches];
  if (tab === "resultados") matches = matches.filter((match) => match.status === "finished");
  if (tab === "proximos") matches = matches.filter((match) => match.status !== "finished");
  matches.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  if (!matches.length) {
    return emptyState("Sin partidos", "No hay partidos que coincidan con este filtro.", `<button class="btn btn--primary btn--sm" type="button" data-new-match>Programar partido</button>`);
  }
  return groupByMatchday(matches).map(([day, list]) => matchdayPanel(day, list)).join("");
}

function detail(match) {
  const home = store.team(match.homeTeamId);
  const away = store.team(match.awayTeamId);
  const finished = match.status === "finished";
  const scorers = (match.scorers || []).map((goal) => ({ ...goal, player: store.player(goal.playerId), team: store.team(goal.teamId) }));
  const bookings = (match.bookings || []).map((booking) => ({ ...booking, player: store.player(booking.playerId), team: store.team(booking.teamId) }));
  const mvp = match.mvpPlayerId ? store.player(match.mvpPlayerId) : null;
  return `<div class="container page">
    <a class="text-link" href="#/partidos" style="margin-bottom:18px">${icon("arrow", 14)} Volver al calendario</a>
    ${pageHead({
      eyebrow: `${match.title || `Jornada ${match.matchday}`} · ${esc(match.phase === "groups" ? `Grupo ${match.group}` : "Eliminatoria")}`,
      title: `${home?.short || "TBD"} vs ${away?.short || "TBD"}`,
      copy: finished ? "Resultado oficial y todas las incidencias del partido." : "Partido programado. Consulta la previa y prepara tu Fantasy.",
      action: store.isAdmin() && home && away ? `<button class="btn btn--primary btn--sm" type="button" data-result>${icon("whistle", 15)} ${finished ? "Editar resultado" : "Registrar resultado"}</button>` : ""
    })}
    <div class="panel" style="margin-bottom:20px">
      <div class="match-detail__teams">
        <a class="match-detail__team" href="${home ? `#/equipo/${home.id}` : "#/equipos"}">${home ? teamCrest(home, 52) : ""}<span>${esc(home?.name || "Por definir")}</span></a>
        <div class="match-detail__score">${finished ? `${match.homeScore} – ${match.awayScore}` : "VS"}<span>${finished ? "Final" : esc(match.time || "Por confirmar")}</span></div>
        <a class="match-detail__team" href="${away ? `#/equipo/${away.id}` : "#/equipos"}">${away ? teamCrest(away, 52) : ""}<span>${esc(away?.name || "Por definir")}</span></a>
      </div>
      <div class="match-detail__meta" style="display:flex;flex-wrap:wrap;gap:18px;padding-top:14px;font-family:var(--font-mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">
        <span>${icon("calendar", 12)} ${esc(fmtDateLong(match.date))}</span>
        <span>${icon("clock", 12)} ${esc(match.time || "—")}</span>
        <span>${icon("target", 12)} ${esc(match.pitch || "Estadio IMEX")}</span>
        ${finished ? statusPill("Finalizado", "muted") : statusPill("Programado", "accent")}
      </div>
      ${match.notes ? `<p class="modal-copy" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">${esc(match.notes)}</p>` : ""}
      ${!finished ? `<div class="row row--between" style="margin-top:16px;flex-wrap:wrap;gap:12px">
        <div><p class="eyebrow">Comienza en</p><span class="countdown" data-countdown="${esc(match.date)}T${esc(match.time || "00:00")}:00-06:00" style="font-size:18px">${esc(countdown(`${match.date}T${match.time || "00:00"}:00-06:00`))}</span></div>
        <div class="row"><a class="btn btn--ghost btn--sm" href="#/fantasy">${icon("star", 14)} Fantasy</a><a class="btn btn--primary btn--sm" href="#/mercado">${icon("transfer", 14)} Mercado</a></div>
      </div>` : ""}
    </div>

    <div class="grid grid--2" style="align-items:start">
      <section class="panel">
        <div class="panel__head"><div><h3>Goles</h3><p>${scorers.length} anotaciones registradas</p></div></div>
        ${scorers.length ? `<div class="activity-list">${scorers.map((goal) => `<div class="activity-row">
          <span class="activity-row__icon">${icon("target", 14)}</span>
          <div style="flex:1"><p><strong>${esc(goal.player?.name || "Jugador")}</strong> · ${esc(goal.team?.short || "")}</p><span>Minuto ${esc(goal.minute)}${goal.type && goal.type !== "regular" ? ` · ${esc(goal.type)}` : ""}</span></div>
          <span class="mono small">${esc(goal.team?.short || "")}</span>
        </div>`).join("")}</div>` : `<div class="admin-empty">Sin goles registrados.</div>`}
      </section>
      <section class="panel">
        <div class="panel__head"><div><h3>Tarjetas</h3><p>Disciplina del partido</p></div></div>
        ${bookings.length ? `<div class="activity-list">${bookings.map((booking) => `<div class="activity-row">
          <span class="activity-row__icon" style="color:${booking.card === "red" ? "var(--danger)" : "var(--warning)"}">${icon("card", 14)}</span>
          <div style="flex:1"><p>${esc(booking.player?.name || "Jugador")} · ${esc(booking.team?.short || "")}</p><span>Minuto ${esc(booking.minute)} · ${booking.card === "red" ? "Roja" : "Amarilla"}</span></div>
          <span class="pill ${booking.card === "red" ? "pill--danger" : "pill--warning"}">${booking.card === "red" ? "Roja" : "Amarilla"}</span>
        </div>`).join("")}</div>` : `<div class="admin-empty">Sin tarjetas registradas.</div>`}
      </section>
      <section class="panel">
        <div class="panel__head"><div><h3>Cartas usadas</h3><p>Reglamento Kings League</p></div></div>
        ${(match.cardsUsed || []).length ? `<div class="activity-list">${match.cardsUsed.map((card) => `<div class="activity-row">
          <span class="activity-row__icon">${icon("card", 14)}</span>
          <div><p><strong>${esc(store.team(card.teamId)?.short || "")} · ${esc(card.cardName)}</strong></p><span>${esc(card.result)}</span></div>
        </div>`).join("")}</div>` : `<div class="admin-empty">No se usaron cartas.</div>`}
      </section>
      <section class="panel">
        <div class="panel__head"><div><h3>Datos oficiales</h3><p>Acta del partido</p></div></div>
        <div class="detail-list">
          <div class="detail-list__row"><span>Fase</span><strong>${esc(match.phase === "groups" ? `Grupos · Jornada ${match.matchday}` : match.title || "Eliminatoria")}</strong></div>
          <div class="detail-list__row"><span>Grupo</span><strong>${esc(match.group || "—")}</strong></div>
          <div class="detail-list__row"><span>MVP</span><strong>${esc(mvp?.name || "Por designar")}</strong></div>
          <div class="detail-list__row"><span>Dado</span><strong>${esc(match.diceEvent || "Pendiente")}</strong></div>
          <div class="detail-list__row"><span>Estado</span><strong>${finished ? "Resultado oficial" : "Programado"}</strong></div>
        </div>
      </section>
    </div>
  </div>`;
}

export default {
  render({ params, query }) {
    if (params.id) {
      const match = store.match(params.id);
      if (!match) return `<div class="container page">${emptyState("Partido no encontrado", "El partido que buscas no existe o fue eliminado.", `<a class="btn btn--primary" href="#/partidos">Ver calendario</a>`)}</div>`;
      return detail(match);
    }
    const tab = ["calendario", "resultados", "proximos", "bracket"].includes(query.tab) ? query.tab : "calendario";
    const finished = store.state.matches.filter((match) => match.status === "finished").length;
    const goals = store.state.matches.reduce((sum, match) => sum + (match.homeScore || 0) + (match.awayScore || 0), 0);
    const next = store.nextMatch();
    return `<div class="container page">
      ${pageHead({
        eyebrow: "Competición",
        title: "Partidos",
        copy: "Calendario oficial, resultados y eliminatorias de la Kings League IMEX.",
        action: `${store.isAdmin() ? `<button class="btn btn--primary btn--sm" type="button" data-new-match>${icon("plus", 15)} Programar partido</button>` : ""}<a class="btn btn--ghost btn--sm" href="#/clasificacion">${icon("table", 15)} Clasificación</a>`
      })}
      <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi"><div class="stat"><span class="stat__label">Partidos jugados</span><span class="stat__value">${finished}<span style="font-size:14px;color:var(--muted)"> / ${store.state.matches.length}</span></span></div></div>
        <div class="kpi"><div class="stat"><span class="stat__label">Goles totales</span><span class="stat__value">${number(goals)}</span></div></div>
        <div class="kpi"><div class="stat"><span class="stat__label">Próximo partido</span><span class="stat__value" style="font-size:18px">${esc(next ? fmtDate(next.date) : "—")}</span><span class="stat__meta">${esc(next ? `${store.team(next.homeTeamId)?.short || "TBD"} vs ${store.team(next.awayTeamId)?.short || "TBD"}` : "Sin programar")}</span></div></div>
        <div class="kpi"><div class="stat"><span class="stat__label">Mercado</span><span class="stat__value" style="font-size:22px">${store.isMarketOpen() ? "Abierto" : "Cerrado"}</span><span class="stat__meta">${store.isMarketOpen() ? `Cierra en ${esc(countdown(store.marketCloseAt()))}` : "Ventana cerrada"}</span></div></div>
      </div>
      <div class="tabs" style="margin-bottom:20px">
        ${[["calendario", "Calendario"], ["proximos", "Próximos"], ["resultados", "Resultados"], ["bracket", "Eliminatorias"]].map(([value, label]) => `<a class="tab ${tab === value ? "is-active" : ""}" href="#/partidos?tab=${value}">${label}</a>`).join("")}
      </div>
      <div id="matchesBody">${tab === "bracket" ? bracketView() : listView(tab)}</div>
    </div>`;
  },
  bind(root, { params }) {
    root.querySelector("[data-new-match]")?.addEventListener("click", () => {
      import("./shared.js").then(({ openMatchForm }) => openMatchForm());
    });
    if (params.id) {
      const match = store.match(params.id);
      root.querySelector("[data-result]")?.addEventListener("click", () => {
        if (match) openMatchResult(match);
      });
    }
  }
};

void sectionHead;
void positionLabel;
void field;
