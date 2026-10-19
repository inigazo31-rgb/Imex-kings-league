import { store } from "../store.js";
import { esc, icon, money, teamCrest, emptyState } from "../utils.js";
import { toast, pageHead, sectionHead } from "../ui.js";

let clockTimer = 0;

function clubName(teamId) {
  return store.team(teamId)?.name || "Club";
}

function clockText(seconds) {
  return `00:${String(seconds).padStart(2, "0")}`;
}

function statusLabel(draft) {
  if (draft.status === "live") return { text: "En vivo", tone: "live" };
  if (draft.status === "completed") return { text: "Completado", tone: "done" };
  return { text: "Pendiente", tone: "idle" };
}

function draftBanner(draft, canPick) {
  const status = statusLabel(draft);
  const current = draft.currentTeamId ? store.team(draft.currentTeamId) : null;
  let title = "Draft pendiente de apertura";
  let copy = "El organizador abrirá el draft cuando todos los clubes estén listos.";
  if (draft.status === "live") {
    title = `Turno de ${current?.name || "club"}`;
    copy = canPick ? "Es tu turno: elige un jugador disponible antes de que se acabe el tiempo." : "Sigue la elección en directo.";
  } else if (draft.status === "completed") {
    title = "Draft finalizado";
    copy = "Todos los jugadores han sido asignados. Revisa las plantillas en Clubes.";
  }
  const clock = draft.status === "live" ? `<div class="draft-clock" id="draftClock" aria-live="off">${clockText(store.getDraftSecondsRemaining())}</div>` : "";
  return `<section class="draft-banner">
    <div class="draft-banner__main">
      <span class="draft-status draft-status--${status.tone}">${status.text}</span>
      <h2>${esc(title)}</h2>
      <p>${esc(copy)}</p>
    </div>
    ${clock}
  </section>`;
}

function orderHtml(draft) {
  if (!draft.order.length) return emptyState("Orden pendiente", "El orden de elección aparecerá al iniciar el draft.");
  return draft.order.map((teamId, index) => {
    const team = store.team(teamId);
    const isCurrent = teamId === draft.currentTeamId && draft.status === "live";
    return `<li class="draft-order__row ${isCurrent ? "is-current" : ""}">
      <span class="draft-order__pos">${index + 1}</span>
      ${team ? teamCrest(team, 26) : ""}
      <strong>${esc(team?.name || "Club")}</strong>
      ${isCurrent ? `<span class="draft-order__tag">Turno</span>` : ""}
    </li>`;
  }).join("");
}

function poolHtml(draft, canPick) {
  const players = draft.poolPlayerIds.map((id) => store.player(id)).filter(Boolean);
  if (!players.length) return emptyState("Sin jugadores disponibles", draft.status === "live" ? "Todos los jugadores han sido elegidos." : "Registra jugadores para que aparezcan aquí.");
  return `<div class="draft-pool">${players.map((player) => `
    <button class="draft-pool__card" type="button" data-pick="${esc(player.id)}" ${canPick ? "" : "disabled"}>
      <span class="draft-pool__pos">${esc(player.position)}</span>
      <strong>${esc(player.name)}</strong>
      <small>Ref. ${money(player.value)}</small>
    </button>`).join("")}</div>`;
}

function historyHtml(draft) {
  if (!draft.picks.length) return `<p class="draft-empty">Aún no hay elecciones registradas.</p>`;
  return `<ol class="draft-history">${draft.picks.slice().reverse().map((pick) => {
    const player = store.player(pick.playerId);
    return `<li><span class="draft-history__round">R${pick.round}</span><strong>${esc(player?.name || "Jugador")}</strong><span>${esc(clubName(pick.teamId))}</span></li>`;
  }).join("")}</ol>`;
}

function auctionLotHtml(lot, canBid, organizer) {
  const player = store.player(lot.playerId);
  const top = store.highestBid(lot);
  const closed = lot.status === "closed";
  const bids = Object.entries(lot.bids || {});
  const minimum = Math.max(Number(player?.value) || 0, top.amount + 1);
  const myTeam = store.user?.teamId ? store.team(store.user.teamId) : null;
  const ownBidUi = canBid && !closed && myTeam
    ? `<form class="auction-bid" data-bid-form="${esc(lot.id)}">
         <input type="number" name="amount" min="${minimum}" value="${minimum}" max="${Number(myTeam.balance)}" aria-label="Puja en millones">
         <button class="btn btn--primary btn--sm" type="submit">Pujar</button>
       </form>`
    : "";
  const closeUi = organizer && !closed ? `<button class="btn btn--ghost btn--sm" type="button" data-close-lot="${esc(lot.id)}">Cerrar puja</button>` : "";
  const result = closed
    ? `<span class="auction-lot__result">${lot.winnerTeamId ? `Adjudicado a ${esc(clubName(lot.winnerTeamId))} por ${money(lot.finalPrice)}` : "Sin adjudicar"}</span>`
    : `<span class="auction-lot__top">${top.teamId ? `Mejor puja: ${money(top.amount)} · ${esc(clubName(top.teamId))}` : `Sin pujas · mínimo ${money(minimum)}`}</span>`;
  return `<article class="auction-lot ${closed ? "is-closed" : ""}">
    <header>
      <div><span class="draft-pool__pos">${esc(player?.position || "")}</span><strong>${esc(player?.name || "Jugador")}</strong></div>
      <span class="draft-status draft-status--${closed ? "done" : "live"}">${closed ? "Cerrado" : "Abierto"}</span>
    </header>
    ${result}
    ${bids.length ? `<ul class="auction-lot__bids">${bids.sort((a, b) => b[1] - a[1]).map(([teamId, amount]) => `<li><span>${esc(clubName(teamId))}</span><strong>${money(amount)}</strong></li>`).join("")}</ul>` : ""}
    <div class="auction-lot__actions">${ownBidUi}${closeUi}</div>
  </article>`;
}

function auctionHtml(canBid, organizer) {
  const lots = store.state.auction.lots;
  const drafted = new Set(store.state.draft.picks.map((pick) => pick.playerId));
  const unsold = store.state.players.filter((player) => !player.teamId && !player.insignia);
  const candidates = unsold.filter((player) => !lots.some((lot) => lot.playerId === player.id && lot.status === "open"));
  const createUi = organizer
    ? `<form class="auction-create" data-lot-form>
         <select name="playerId" aria-label="Jugador para la subasta">
           ${candidates.length ? candidates.map((player) => `<option value="${esc(player.id)}">${esc(player.name)} · ${money(player.value)}</option>`).join("") : `<option value="">No hay jugadores libres</option>`}
         </select>
         <button class="btn btn--primary btn--sm" type="submit" ${candidates.length ? "" : "disabled"}>Abrir lote</button>
       </form>`
    : "";
  const body = lots.length
    ? `<div class="auction-grid">${lots.map((lot) => auctionLotHtml(lot, canBid, organizer)).join("")}</div>`
    : emptyState("Sin lotes de subasta", organizer ? "Abre un lote para un jugador libre y los presidentes podrán pujar." : "El organizador abrirá lotes cuando haya jugadores libres.");
  return `<section class="panel draft-section">
    ${sectionHead({ eyebrow: "Subasta final", title: "Lotes y pujas", copy: `${candidates.length} jugadores libres · ${drafted.size} elegidos en el draft` })}
    ${createUi}
    ${body}
  </section>`;
}

function organizerHtml(draft) {
  const idle = draft.status === "setup";
  const live = draft.status === "live";
  return `<section class="panel draft-organizer">
    <div>
      <p class="eyebrow">Controles del organizador</p>
      <h3>${idle ? "Abrir el draft" : live ? "Gestionar el turno" : "Draft cerrado"}</h3>
      <p class="small muted">${idle ? "Reinicia plantillas y saldos, y activa el orden de elección." : live ? "Puedes saltar el turno actual si el club no responde." : "Puedes volver a iniciar un draft nuevo."}</p>
    </div>
    <div class="draft-organizer__actions">
      ${idle || draft.status === "completed" ? `<button class="btn btn--primary" type="button" data-start-draft>${icon("bolt", 16)} ${idle ? "Iniciar draft" : "Nuevo draft"}</button>` : ""}
      ${live ? `<button class="btn btn--ghost" type="button" data-skip-turn>${icon("clock", 16)} Saltar turno</button>` : ""}
    </div>
  </section>`;
}

export default {
  render() {
    const draft = store.state.draft;
    const user = store.user;
    const organizer = store.isAdmin();
    const canPick = draft.status === "live" && draft.currentTeamId && store.canActForClub(draft.currentTeamId) && store.isPresident();
    const canBid = store.isPresident() || organizer;
    return `<div class="container page draft-page">
      ${pageHead({ eyebrow: "Evento en directo", title: "Draft y subasta", copy: "Los presidentes eligen por turnos en serpiente, 45 segundos por pick. Después, los jugadores libres salen a subasta." })}
      ${organizer ? organizerHtml(draft) : ""}
      ${draftBanner(draft, canPick)}
      <div class="draft-layout">
        <section class="panel draft-section">
          ${sectionHead({ eyebrow: "Jugadores", title: "Disponibles", copy: `${draft.poolPlayerIds.length} en el pool · ronda ${draft.round}` })}
          ${poolHtml(draft, canPick)}
        </section>
        <aside class="panel draft-section">
          ${sectionHead({ eyebrow: "Turnos", title: "Orden de elección", copy: draft.order.length ? "Serpiente: el orden se invierte en cada ronda" : "" })}
          <ol class="draft-order">${orderHtml(draft)}</ol>
        </aside>
      </div>
      <section class="panel draft-section">
        ${sectionHead({ eyebrow: "Historial", title: "Elecciones realizadas", copy: `${draft.picks.length} picks` })}
        ${historyHtml(draft)}
      </section>
      ${auctionHtml(canBid, organizer)}
      ${user ? "" : `<p class="notice" style="margin-top:16px">${icon("info", 16)}<span>Inicia sesión como presidente para participar en el draft y en las pujas.</span></p>`}
    </div>`;
  },

  bind(root) {
    window.clearInterval(clockTimer);
    clockTimer = window.setInterval(() => {
      if (!document.getElementById("draftClock")) return window.clearInterval(clockTimer);
      if (store.expireDraftTurn()) return;
      const clock = document.getElementById("draftClock");
      if (clock) clock.textContent = clockText(store.getDraftSecondsRemaining());
    }, 1000);

    const report = (result) => toast(result.message || "Hecho.", result.ok === false ? "danger" : "success", result.ok === false ? "No se pudo completar" : "Listo");

    root.querySelector("[data-start-draft]")?.addEventListener("click", () => report(store.prepareDraft()));
    root.querySelector("[data-skip-turn]")?.addEventListener("click", () => {
      report(store.skipDraftTurn("organizer") ? { ok: true, message: "Turno saltado." } : { ok: false, message: "No hay un turno activo." });
    });
    root.querySelectorAll("[data-pick]").forEach((button) => {
      button.addEventListener("click", () => report(store.pickDraftPlayer(store.user?.teamId, button.dataset.pick)));
    });
    root.querySelector("[data-lot-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const select = event.currentTarget.querySelector('select[name="playerId"]');
      if (select?.value) report(store.createAuctionLot(select.value));
    });
    root.querySelectorAll("[data-bid-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const amount = form.querySelector('input[name="amount"]').value;
        report(store.placeAuctionBid(form.dataset.bidForm, store.user?.teamId, amount));
      });
    });
    root.querySelectorAll("[data-close-lot]").forEach((button) => {
      button.addEventListener("click", () => report(store.closeAuctionLot(button.dataset.closeLot)));
    });
  }
};
