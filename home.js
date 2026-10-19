import { store } from "../store.js";
import { esc, icon, leagueMark, number, countdown, money, fmtDate, statusPill, relativeTime, teamCrest } from "../utils.js";
import { heroMatch, matchRow, resultTile } from "./shared.js";

function activityIcon(type) {
  return { transfer: "transfer", offer: "transfer", result: "whistle", news: "news", fantasy: "star", market: "chart", finance: "activity", player: "user", team: "shield", league: "sliders", system: "sync", match: "calendar" }[type] || "activity";
}

function tickerItem(item) {
  const labels = { transfer: "Fichaje", offer: "Oferta", result: "Resultado", news: "Noticia", fantasy: "Fantasy", market: "Mercado", finance: "Finanzas", player: "Jugador", team: "Club", league: "Liga", system: "Sistema", match: "Partido" };
  return `<div class="ticker__item"><span class="ticker__label">${esc(labels[item.type] || "IMEX")}</span><strong>${esc(item.text)}</strong><span>${esc(relativeTime(item.at))}</span></div>`;
}

export default {
  render() {
    const state = store.state;
    const next = store.nextMatch();
    const results = store.results(4);
    const upcoming = store.upcoming(3);
    const standings = store.standings();
    const scorers = store.scorers(5);
    const managers = store.fantasyManagers().slice(0, 3);
    const news = state.news.slice(0, 3);
    const lead = standings[0];
    const topScorer = scorers[0];
    const marketOpen = store.isMarketOpen();
    const marketCloseAt = store.marketCloseAt();
    const marketCountdown = countdown(marketCloseAt);

    return `<section class="hero" data-od-id="home-hero">
      <div class="hero__lines" aria-hidden="true">
        <svg viewBox="0 0 1440 620" preserveAspectRatio="none" width="100%" height="100%">
          <g fill="none" stroke="#c9f24a" stroke-width="1">
            <path d="M720 0v620M0 310h1440"/>
            <circle cx="720" cy="310" r="118"/><circle cx="720" cy="310" r="4"/>
            <rect x="0" y="150" width="180" height="320"/><rect x="1260" y="150" width="180" height="320"/>
            <rect x="0" y="238" width="72" height="144"/><rect x="1368" y="238" width="72" height="144"/>
          </g>
        </svg>
      </div>
      <div class="container hero__grid">
        <div class="hero__content">
          <p class="eyebrow">Kings League IMEX · ${esc(state.league.season)}</p>
          <h1 class="hero__title">Ocho clubes.<br />Una <em>corona</em>.</h1>
          <p class="hero__copy">${esc(state.league.officialName)} es la competición de fútbol 7 donde cada jornada cambia la tabla, el mercado y tu Fantasy. Resultados en vivo, plantillas abiertas y una sola regla: competir.</p>
          <div class="hero__actions">
            <a class="btn btn--accent" href="#/partidos">${icon("calendar", 16)} Ver calendario</a>
            <a class="btn btn--ghost" href="#/clasificacion">${icon("table", 16)} Clasificación</a>
          </div>
          <div class="hero__meta">
            <span>${icon("shield", 12)} ${state.teams.length} clubes</span>
            <span>${icon("users", 12)} ${state.players.length} jugadores</span>
            <span>${icon("trophy", 12)} ${state.matches.length} partidos</span>
            <span>${icon("globe", 12)} ${esc(state.league.venue)}</span>
          </div>
        </div>
        <div class="hero__side">${heroMatch(next)}</div>
      </div>
      <div class="hero__ticker"><div class="container"><div class="ticker">${state.activity.slice(0, 4).map(tickerItem).join("")}</div></div></div>
    </section>

    <div class="container page page--tight">
      <div class="stack" style="gap:24px">
        <div class="home-split">
          <div class="home-stack">
            <section>
              <div class="section-head">
                <div><p class="eyebrow">Últimos resultados</p><h2>La jornada en cifras</h2></div>
                <a class="text-link" href="#/partidos">Todos los partidos ${icon("arrow", 14)}</a>
              </div>
              <div class="result-strip">${results.length ? results.map(resultTile).join("") : `<div class="result-tile"><span class="result-tile__meta">Sin resultados</span><p class="modal-copy">La primera jornada todavía no se ha disputado.</p></div>`}</div>
            </section>

            <section class="panel panel--flush">
              <div class="panel__head">
                <div><h3>Próximos partidos</h3><p>Calendario oficial · ${esc(state.league.season)}</p></div>
                <a class="text-link" href="#/partidos">Calendario ${icon("arrow", 14)}</a>
              </div>
              ${upcoming.length ? upcoming.map(matchRow).join("") : `<div class="admin-empty">No hay partidos programados.</div>`}
            </section>

            <section class="market-banner">
              <div class="market-banner__content">
                <p class="eyebrow">Ventana de fichajes</p>
                <h2>${marketOpen ? "El mercado está abierto" : "Mercado cerrado"}</h2>
                <p>${marketOpen ? "Un clausulazo por club. Mueve ficha, refuerza tu plantilla y cambia el rumbo del torneo antes del cierre." : "La ventana de transferencias está cerrada. Vuelve a revisar el mercado en la próxima apertura."}</p>
                <div class="market-banner__actions">
                  <a class="btn btn--accent" href="#/mercado">${icon("transfer", 16)} Ir al mercado</a>
                  <a class="btn btn--ghost" href="#/fantasy">Armar Fantasy</a>
                </div>
              </div>
              <div class="market-banner__side">
                <p class="eyebrow">${marketOpen ? "Cierra en" : "Estado"}</p>
                <span class="stat__value">${marketOpen ? esc(marketCountdown) : "Cerrado"}</span>
                <p class="small" style="color:rgba(243,241,235,.55);margin-top:6px">${esc(fmtDate(marketCloseAt.slice(0, 10)))} · medianoche (hora de México)</p>
              </div>
            </section>
          </div>

          <div class="home-stack">
            <section class="panel">
              <div class="panel__head"><div><h3>Clasificación</h3><p>${lead ? `${esc(lead.name)} lidera la tabla` : "Temporada en curso"}</p></div><a class="text-link" href="#/clasificacion">Ver todo ${icon("arrow", 14)}</a></div>
              <div class="mini-table">
                ${standings.slice(0, 6).map((row, index) => `<div class="mini-table__row ${index < 4 ? "is-qualify" : ""}">
                  <span class="mini-table__pos">${index + 1}</span>
                  <span class="mini-table__club">${teamCrest(row.team, 20)}<span>${esc(row.name)}</span></span>
                  <span class="mini-table__gd">${row.gd > 0 ? "+" : ""}${row.gd}</span>
                  <span class="mini-table__pts">${row.points}</span>
                </div>`).join("")}
              </div>
              <div class="legend"><span><span class="dot dot--success"></span> Zona de clasificación</span><span>PJ · DG · PTS</span></div>
            </section>

            <section class="panel">
              <div class="panel__head"><div><h3>Goleadores</h3><p>${topScorer ? `${esc(topScorer.name)} manda con ${topScorer.goals}` : "Sin goles registrados"}</p></div><a class="text-link" href="#/jugadores">Jugadores ${icon("arrow", 14)}</a></div>
              ${scorers.map((player) => `<div class="scorer-row">
                <span class="scorer-row__rank">${String(scorers.indexOf(player) + 1).padStart(2, "0")}</span>
                <div class="scorer-row__player"><strong>${esc(player.name)}</strong><span>${esc(store.team(player.teamId)?.name || "")}</span></div>
                <span class="scorer-row__value">${number(player.goals)}</span>
                <span class="scorer-row__sub">${number(player.assists)}A</span>
              </div>`).join("")}
            </section>

            <section class="panel">
              <div class="panel__head"><div><h3>Fantasy</h3><p>Ranking general de managers</p></div><a class="text-link" href="#/fantasy">Jugar ${icon("arrow", 14)}</a></div>
              ${managers.map((manager, index) => `<div class="fantasy-row">
                <span class="fantasy-row__rank">${index + 1}</span>
                <div class="fantasy-row__team"><strong>${esc(manager.name)}</strong><span>${esc(manager.owner || "Manager IMEX")}</span></div>
                <span class="fantasy-row__pts">${manager.points} pts</span>
                <span class="fantasy-row__spent">${money(manager.spent)}</span>
              </div>`).join("")}
            </section>

            <section class="panel">
              <div class="panel__head"><div><h3>Actividad</h3><p>Movimientos recientes</p></div></div>
              <div class="activity-list">
                ${state.activity.slice(0, 5).map((item) => `<div class="activity-row">
                  <span class="activity-row__icon">${icon(activityIcon(item.type), 14)}</span>
                  <div><p>${esc(item.text)}</p><span>${esc(relativeTime(item.at))}</span></div>
                </div>`).join("")}
              </div>
            </section>
          </div>
        </div>

        <section>
          <div class="section-head">
            <div><p class="eyebrow">Sala de prensa</p><h2>Lo último de la liga</h2></div>
            <a class="text-link" href="#/noticias">Todas las noticias ${icon("arrow", 14)}</a>
          </div>
          <div class="news-grid">
            ${news.map((article, index) => `<a class="news-card ${index === 0 ? "news-card--featured" : ""}" href="#/noticias">
              <div class="news-card__cover" data-index="${String(index + 1).padStart(2, "0")}">
                ${statusPill(article.category, article.important ? "accent" : "outline")}
              </div>
              <div class="news-card__body">
                <h3>${esc(article.title)}</h3>
                <p>${esc(article.excerpt)}</p>
                <div class="news-card__meta"><span>${esc(fmtDate(article.date))}</span><span>${esc(article.author || "IMEX")}</span></div>
              </div>
            </a>`).join("")}
          </div>
        </section>

        <section class="fantasy-banner">
          <div>
            <p class="eyebrow">Fantasy IMEX</p>
            <h2 style="margin-top:6px;font-size:clamp(26px,3vw,38px);text-transform:uppercase">Tu quinteto. Tu estrategia.</h2>
            <p class="modal-copy" style="margin-top:10px;max-width:480px">Elige un portero, un defensa, un mediocampista y dos delanteros con ${state.fantasy.budget} M de presupuesto. Cada gol, asistencia y resultado actualiza tu puntuación al instante.</p>
            <div class="hero__actions" style="margin-top:18px">
              <a class="btn btn--primary" href="#/fantasy">${icon("star", 16)} Armar mi quinteto</a>
              <a class="btn btn--ghost" href="#/reglas">Cómo puntúa</a>
            </div>
          </div>
          <div class="fantasy-banner__pitch" aria-hidden="true"><span>POR</span><span>DEF</span><span>MED</span><span>DEL</span><span>DEL</span></div>
        </section>

        <section class="panel" style="display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap">
          <div class="row">
            <span class="rule-card__icon" style="width:44px;height:44px">${leagueMark(26, "lime")}</span>
            <div><p class="eyebrow">Temporada ${esc(state.league.season.replace(/\D/g, ""))}</p><h3>${esc(state.league.tagline)}</h3><p class="small muted">${esc(state.league.format)} · ${esc(state.league.venue)}</p></div>
          </div>
          <div class="row" style="gap:8px">
            <a class="btn btn--ghost btn--sm" href="#/equipos">Clubes</a>
            <a class="btn btn--ghost btn--sm" href="#/reglas">Reglamento</a>
            <a class="btn btn--primary btn--sm" href="#/acceso">Acceder</a>
          </div>
        </section>
      </div>
    </div>`;
  }
};
