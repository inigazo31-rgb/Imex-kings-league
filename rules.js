import { store } from "../store.js";
import { esc, icon, money, statusPill } from "../utils.js";
import { pageHead } from "../ui.js";

const RULES = [
  { icon: "users", title: "Fútbol 7", copy: "Siete jugadores por bando, incluido el portero. Cambios ilimitados y vuelta al campo permitida.", meta: ["Formato", "7 vs 7"] },
  { icon: "clock", title: "Dos tiempos", copy: "Partidos de 60 minutos divididos en dos tiempos de 30. El reloj no se detiene salvo lesión grave.", meta: ["Duración", "2 × 30 min"] },
  { icon: "card", title: "Cartas secretas", copy: "Cada club elige una carta antes del partido y la activa en el momento permitido. Solo una por equipo.", meta: ["Por partido", "1 carta"] },
  { icon: "target", title: "Dado IMEX", copy: "En el minuto 18 se lanza el dado. El resultado modifica temporalmente el formato y el número de jugadores.", meta: ["Minuto", "18"] },
  { icon: "transfer", title: "Mercado", copy: "Un clausulazo por club y ventana. Los jugadores insignia están blindados y no pueden salir.", meta: ["Cláusula", "Valor del jugador"] },
  { icon: "star", title: "Fantasy", copy: "Arma un quinteto con presupuesto limitado. Los puntos se recalculan con cada gol, asistencia y resultado.", meta: ["Presupuesto", money(store.state.fantasy.budget)] }
];

export default {
  render() {
    const cards = store.state.cards;
    const dice = store.state.dice;
    return `<div class="container page">
      ${pageHead({
        eyebrow: "Reglamento",
        title: "Así se juega",
        copy: "Las reglas de la Kings League IMEX: formato, cartas, dado, mercado y Fantasy. Claras, cortas y aplicables desde el primer minuto.",
        action: `<a class="btn btn--ghost btn--sm" href="#/noticias">${icon("news", 15)} Comunicados</a>`
      })}

      <section style="margin-bottom:32px">
        <div class="section-head"><div><p class="eyebrow">Fundamentos</p><h2>El formato</h2></div><span class="pill pill--outline">${esc(store.state.league.format)}</span></div>
        <div class="rule-grid">
          ${RULES.map((rule, index) => `<article class="rule-card" data-index="${String(index + 1).padStart(2, "0")}">
            <div class="rule-card__top"><span class="rule-card__icon">${icon(rule.icon, 20)}</span><span class="pill pill--outline">${esc(rule.meta[0])}</span></div>
            <h3>${esc(rule.title)}</h3>
            <p>${esc(rule.copy)}</p>
            <div class="rule-card__meta"><span>${esc(rule.meta[0])} <strong>${esc(rule.meta[1])}</strong></span></div>
          </article>`).join("")}
        </div>
      </section>

      <section style="margin-bottom:32px">
        <div class="section-head"><div><p class="eyebrow">Cartas</p><h2>Seis cartas. Una por partido.</h2><p>Cada club elige su carta antes del inicio. La activación depende del momento indicado y no puede repetirse en el mismo partido.</p></div><span class="pill pill--accent">${cards.length} cartas oficiales</span></div>
        <div class="rule-grid">
          ${cards.map((card, index) => `<article class="rule-card" data-index="${String(index + 1).padStart(2, "0")}">
            <div class="rule-card__top"><span class="rule-card__icon">${icon("card", 20)}</span>${statusPill(card.rarity, card.rarity === "Mítica" ? "accent" : "outline")}</div>
            <h3>${esc(card.name)}</h3>
            <p>${esc(card.description)}</p>
            <div class="rule-card__meta"><span>Activación <strong>${esc(card.timing)}</strong></span><span>Duración <strong>${esc(card.duration)}</strong></span></div>
          </article>`).join("")}
        </div>
      </section>

      <section style="margin-bottom:32px">
        <div class="section-head"><div><p class="eyebrow">Dado IMEX</p><h2>Minuto 18: cambia el partido</h2><p>El dado se lanza una vez por partido. El resultado es secreto hasta que el árbitro lo anuncia en la cancha.</p></div></div>
        <div class="dice-grid">
          ${dice.map((item) => `<article class="dice-card">
            <div class="die" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
            <div><p class="eyebrow">${esc(item.roll)}</p><h3 style="margin-top:3px">${esc(item.detail)}</h3></div>
            <p>${esc(item.description)}</p>
            <div class="dice-card__meta">${esc(item.intensity)}</div>
          </article>`).join("")}
        </div>
      </section>

      <div class="grid grid--2" style="align-items:start">
        <section class="panel">
          <div class="panel__head"><div><h3>Competencia</h3><p>Fase de grupos y eliminatorias</p></div></div>
          <div class="detail-list">
            <div class="detail-list__row"><span>Grupos</span><strong>A y B · 4 clubes cada uno</strong></div>
            <div class="detail-list__row"><span>Clasificación</span><strong>Los 2 primeros de cada grupo</strong></div>
            <div class="detail-list__row"><span>Semifinales</span><strong>1.º A vs 2.º B · 1.º B vs 2.º A</strong></div>
            <div class="detail-list__row"><span>Final</span><strong>Partido único</strong></div>
            <div class="detail-list__row"><span>Puntos</span><strong>Victoria 3 · Empate 1 · Derrota 0</strong></div>
            <div class="detail-list__row"><span>Desempate</span><strong>Diferencia de goles · Goles a favor</strong></div>
          </div>
        </section>
        <section class="panel">
          <div class="panel__head"><div><h3>Premios y sanciones</h3><p>Incentivos oficiales</p></div></div>
          <div class="detail-list">
            <div class="detail-list__row"><span>Victoria</span><strong>${money(store.state.league.winReward)}</strong></div>
            <div class="detail-list__row"><span>Empate</span><strong>${money(store.state.league.drawReward)}</strong></div>
            <div class="detail-list__row"><span>Clasificación a semifinales</span><strong>${money(store.state.league.qualificationReward)}</strong></div>
            <div class="detail-list__row"><span>Amarilla</span><strong>Sin sanción económica</strong></div>
            <div class="detail-list__row"><span>Roja directa</span><strong>1 partido de suspensión</strong></div>
            <div class="detail-list__row"><span>Impago de cláusula</span><strong>Operación anulada</strong></div>
          </div>
        </section>
      </div>

      <section class="panel panel--dark" style="margin-top:24px;background:var(--ink);color:var(--bg);border-color:rgba(243,241,235,.14);display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap">
        <div>
          <p class="eyebrow">Comité de competición</p>
          <h3 style="margin-top:4px;color:var(--bg)">¿Dudas sobre una jugada o una operación?</h3>
          <p class="small" style="color:rgba(243,241,235,.55);margin-top:4px">Escribe a la organización antes del cierre de la jornada. Las decisiones del comité son definitivas.</p>
        </div>
        <a class="btn btn--accent" href="#/noticias">${icon("news", 15)} Leer comunicados</a>
      </section>
    </div>`;
  }
};
