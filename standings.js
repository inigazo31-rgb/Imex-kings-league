import { store } from "../store.js";
import { esc, icon, teamCrest, number, money } from "../utils.js";
import { pageHead } from "../ui.js";

function formDots(form) {
  return `<span class="form-dots">${form.map((result) => `<span class="form-dot form-dot--${result.toLowerCase()}">${result}</span>`).join("") || `<span class="table__muted">—</span>`}</span>`;
}

function groupTable(group) {
  const rows = store.standings(group);
  return `<section class="panel panel--flush">
    <div class="panel__head">
      <div><h3>Grupo ${esc(group)}</h3><p>${rows.filter((row) => row.played > 0).length} clubes con partidos disputados</p></div>
      <span class="pill pill--outline">Top 2 avanzan</span>
    </div>
    <div class="table-wrap">
      <table class="table standings-table table--stack">
        <thead><tr><th>#</th><th>Club</th><th class="table__num">PJ</th><th class="table__num">G</th><th class="table__num">E</th><th class="table__num">P</th><th class="table__num">GF</th><th class="table__num">GC</th><th class="table__num">DG</th><th class="table__num">PTS</th><th>Forma</th></tr></thead>
        <tbody>
          ${rows.map((row, index) => `<tr class="${index < 2 ? "is-qualify" : ""}">
            <td class="pos" data-label="Pos">${index + 1}</td>
            <td class="club" data-label="Club"><a class="table__club" href="#/equipo/${esc(row.id)}">${teamCrest(row.team, 24)}<span>${esc(row.name)}</span></a></td>
            <td class="table__num" data-label="PJ">${row.played}</td>
            <td class="table__num" data-label="G">${row.won}</td>
            <td class="table__num" data-label="E">${row.drawn}</td>
            <td class="table__num" data-label="P">${row.lost}</td>
            <td class="table__num" data-label="GF">${row.gf}</td>
            <td class="table__num" data-label="GC">${row.ga}</td>
            <td class="table__num" data-label="DG">${row.gd > 0 ? "+" : ""}${row.gd}</td>
            <td class="table__num pts" data-label="PTS">${row.points}</td>
            <td data-label="Forma">${formDots(row.form)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  </section>`;
}

export default {
  render() {
    const scorers = store.scorers(12);
    const standings = store.standings();
    const leader = standings[0];
    const bestAttack = [...standings].sort((a, b) => b.gf - a.gf || b.gd - a.gd)[0];
    const bestDefense = [...standings].sort((a, b) => a.ga - b.ga || b.gd - a.gd)[0];
    return `<div class="container page standings-page">
      ${pageHead({
        eyebrow: "Competición",
        title: "Clasificación",
        copy: "Así marcha la temporada. Los dos primeros de cada grupo avanzan a semifinales.",
        action: `<a class="btn btn--ghost btn--sm" href="#/partidos?tab=bracket">${icon("bracket", 15)} Ver eliminatorias</a>`
      })}
      <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi"><div class="stat"><span class="stat__label">Líder</span><span class="stat__value" style="font-size:19px">${esc(leader?.name || "—")}</span><span class="stat__meta">${leader ? `${leader.points} puntos · ${leader.gd > 0 ? "+" : ""}${leader.gd} DG` : "Sin datos"}</span></div></div>
        <div class="kpi"><div class="stat"><span class="stat__label">Mejor ataque</span><span class="stat__value" style="font-size:19px">${esc(bestAttack?.name || "—")}</span><span class="stat__meta">${bestAttack?.gf || 0} goles a favor</span></div></div>
        <div class="kpi"><div class="stat"><span class="stat__label">Mejor defensa</span><span class="stat__value" style="font-size:19px">${esc(bestDefense?.name || "—")}</span><span class="stat__meta">${bestDefense?.ga || 0} goles en contra</span></div></div>
        <div class="kpi"><div class="stat"><span class="stat__label">Goles del torneo</span><span class="stat__value">${number(standings.reduce((sum, row) => sum + row.gf, 0))}</span><span class="stat__meta">${money(store.state.league.winReward)} por victoria</span></div></div>
      </div>

      <div class="grid grid--2" style="align-items:start;margin-bottom:24px">
        ${groupTable("A")}
        ${groupTable("B")}
      </div>

      <section class="panel panel--flush">
        <div class="panel__head">
          <div><h3>Tabla de goleadores</h3><p>Goles, asistencias y puntos Fantasy acumulados</p></div>
          <a class="text-link" href="#/jugadores">Ver jugadores ${icon("arrow", 14)}</a>
        </div>
        <div class="table-wrap">
          <table class="table table--stack">
            <thead><tr><th>#</th><th>Jugador</th><th>Club</th><th class="table__num">Goles</th><th class="table__num">Asist.</th><th class="table__num">PJ</th><th class="table__num">Fantasy</th></tr></thead>
            <tbody>
              ${scorers.map((player, index) => {
                const team = store.team(player.teamId);
                return `<tr>
                  <td class="pos" data-label="Pos">${String(index + 1).padStart(2, "0")}</td>
                  <td data-label="Jugador"><a class="row" href="#/jugador/${esc(player.id)}" style="gap:8px"><span class="avatar avatar--sm">${esc(player.number || "—")}</span><strong style="font-size:12px">${esc(player.name)}</strong>${player.insignia ? `<span class="pill pill--accent">Insignia</span>` : ""}</a></td>
                  <td data-label="Club">${team ? `<a class="table__club" href="#/equipo/${esc(team.id)}">${teamCrest(team, 20)}<span>${esc(team.short)}</span></a>` : "—"}</td>
                  <td class="table__num" data-label="Goles">${number(player.goals)}</td>
                  <td class="table__num" data-label="Asist.">${number(player.assists)}</td>
                  <td class="table__num" data-label="PJ">${number(player.played)}</td>
                  <td class="table__num" data-label="Fantasy">${number(store.fantasyPoints(player))}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </section>

      <div class="grid grid--3" style="margin-top:24px">
        <section class="panel">
          <div class="panel__head"><div><h3>Puntos</h3><p>Criterios de clasificación</p></div></div>
          <div class="detail-list">
            <div class="detail-list__row"><span>Victoria</span><strong>3 puntos</strong></div>
            <div class="detail-list__row"><span>Empate</span><strong>1 punto</strong></div>
            <div class="detail-list__row"><span>Derrota</span><strong>0 puntos</strong></div>
            <div class="detail-list__row"><span>Desempate</span><strong>DG · GF · H2H</strong></div>
          </div>
        </section>
        <section class="panel">
          <div class="panel__head"><div><h3>Premios</h3><p>Incentivos por jornada</p></div></div>
          <div class="detail-list">
            <div class="detail-list__row"><span>Victoria</span><strong>${money(store.state.league.winReward)}</strong></div>
            <div class="detail-list__row"><span>Empate</span><strong>${money(store.state.league.drawReward)}</strong></div>
            <div class="detail-list__row"><span>Clasificación</span><strong>${money(store.state.league.qualificationReward)}</strong></div>
            <div class="detail-list__row"><span>Clausulazo</span><strong>Valor del jugador</strong></div>
          </div>
        </section>
        <section class="panel">
          <div class="panel__head"><div><h3>Formato</h3><p>${esc(store.state.league.season)}</p></div></div>
          <div class="detail-list">
            <div class="detail-list__row"><span>Disciplina</span><strong>Fútbol 7</strong></div>
            <div class="detail-list__row"><span>Grupos</span><strong>A y B · 4 clubes</strong></div>
            <div class="detail-list__row"><span>Clasificación</span><strong>Top 2 por grupo</strong></div>
            <div class="detail-list__row"><span>Fase final</span><strong>Semifinal y final</strong></div>
          </div>
        </section>
      </div>
    </div>`;
  }
};
