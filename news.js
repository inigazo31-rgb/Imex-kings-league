import { store } from "../store.js";
import { esc, icon, fmtDate, fmtDateLong, statusPill, countdown } from "../utils.js";
import { pageHead } from "../ui.js";
import { openNewsArticle, openNewsForm } from "./shared.js";

export default {
  render() {
    const news = [...store.state.news].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
    const featured = news.find((article) => article.important) || news[0];
    const rest = news.filter((article) => article.id !== featured?.id);
    const upcoming = store.upcoming(4);
    const market = store.state.league;
    return `<div class="container page">
      ${pageHead({
        eyebrow: "Sala de prensa",
        title: "Noticias",
        copy: "Comunicados oficiales, previas, mercado y todo lo que ocurre dentro y fuera de la cancha.",
        action: store.isAdmin() ? `<button class="btn btn--primary btn--sm" type="button" data-new-news>${icon("plus", 15)} Nueva publicación</button>` : `<a class="btn btn--ghost btn--sm" href="#/reglas">${icon("book", 15)} Reglamento</a>`
      })}
      <div class="news-page-grid">
        <div class="stack" style="gap:20px">
          ${featured ? `<button class="news-card news-card--featured" type="button" data-news-id="${esc(featured.id)}" style="padding:0;text-align:left;width:100%">
            <div class="news-card__cover" data-index="01">${statusPill(featured.category, "accent")}</div>
            <div class="news-card__body">
              <h3>${esc(featured.title)}</h3>
              <p>${esc(featured.excerpt)}</p>
              <div class="news-card__meta"><span>${esc(fmtDateLong(featured.date))} · ${esc(featured.time || "")}</span><span>${esc(featured.author || "IMEX League")}</span></div>
            </div>
          </button>` : ""}

          <section class="panel panel--flush">
            <div class="panel__head"><div><h3>Todas las publicaciones</h3><p>${news.length} notas oficiales</p></div><span class="pill pill--outline">Actualizado</span></div>
            <div style="padding:4px 20px 10px">
              ${rest.length ? rest.map((article) => `<button class="news-list__item" type="button" data-news-id="${esc(article.id)}" style="border:0;border-bottom:1px solid var(--border);background:transparent;width:100%">
                <span class="news-list__date">${esc(fmtDate(article.date))}<strong>${esc(article.time || "")}</strong></span>
                <span class="news-list__main"><strong>${esc(article.title)}</strong><span>${esc(article.excerpt)}</span></span>
                ${statusPill(article.category, article.important ? "accent" : "outline")}
              </button>`).join("") : `<div class="admin-empty">No hay más publicaciones por ahora.</div>`}
            </div>
          </section>
        </div>

        <div class="stack" style="gap:20px">
          <section class="panel">
            <div class="panel__head"><div><h3>Próximos partidos</h3><p>Agenda de la jornada</p></div><a class="text-link" href="#/partidos">Ver todos ${icon("arrow", 14)}</a></div>
            ${upcoming.length ? `<div class="activity-list">${upcoming.map((match) => {
              const home = store.team(match.homeTeamId);
              const away = store.team(match.awayTeamId);
              return `<a class="activity-row" href="#/partidos/${esc(match.id)}" style="padding:10px 0">
                <span class="activity-row__icon">${icon("calendar", 14)}</span>
                <div style="flex:1"><p><strong>${esc(home?.short || "TBD")} vs ${esc(away?.short || "TBD")}</strong></p><span>${esc(fmtDate(match.date))} · ${esc(match.time || "—")}</span></div>
                <span class="pill pill--outline">${esc(match.group ? `G${match.group}` : "Final")}</span>
              </a>`;
            }).join("")}</div>` : `<div class="admin-empty">Sin partidos programados.</div>`}
          </section>

          <section class="panel panel--dark" style="background:var(--ink);color:var(--bg);border-color:rgba(243,241,235,.14)">
            <div class="panel__head" style="border-color:rgba(243,241,235,.12)"><div><h3 style="color:var(--bg)">Mercado</h3><p style="color:rgba(243,241,235,.55)">${store.isMarketOpen() ? "Ventana abierta" : "Ventana cerrada"}</p></div><span class="pill ${store.isMarketOpen() ? "pill--accent" : "pill--outline"}">${store.isMarketOpen() ? "Abierto" : "Cerrado"}</span></div>
            <p class="eyebrow">${store.isMarketOpen() ? "Abierto · modo del organizador" : "Abre los miércoles"}</p>
            <a class="btn btn--accent btn--sm btn--block" href="#/mercado" style="margin-top:14px">${icon("transfer", 14)} Ir al mercado</a>
          </section>

          <section class="panel">
            <div class="panel__head"><div><h3>Contacto de prensa</h3><p>Comunicación oficial</p></div></div>
            <p class="modal-copy">Para entrevistas, acreditaciones y solicitudes de información escribe a <strong>prensa@imexleague.mx</strong>. La organización responde en un máximo de 48 horas.</p>
          </section>
        </div>
      </div>
    </div>`;
  },
  bind(root) {
    root.querySelector("[data-new-news]")?.addEventListener("click", () => openNewsForm());
    root.querySelectorAll("[data-news-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const article = store.state.news.find((item) => item.id === button.dataset.newsId);
        if (article) openNewsArticle(article);
      });
    });
  }
};
