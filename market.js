import { store } from "../store.js";
import { esc, icon, money, number, countdown, fmtDate, statusPill, teamCrest, emptyState } from "../utils.js";
import { openModal, toast, formValues, confirmDialog } from "../ui.js";
import { field } from "./shared.js";

function canTrade() {
  return store.isAdmin() || store.isPresident();
}

function teamOptions(excludeId = "") {
  return store.state.teams
    .filter((team) => team.id !== excludeId)
    .map((team) => ({ value: team.id, label: `${team.name} · ${money(team.balance)}${team.clausulazoUsed ? " · sin clausulazo" : ""}` }));
}

function openClausulazo(player) {
  if (!canTrade()) {
    toast("Inicia sesión como presidente para ejecutar un clausulazo.", "warning");
    return;
  }
  const seller = store.team(player.teamId);
  const options = teamOptions(player.teamId);
  const buyer = store.isPresident() ? store.team(store.user?.teamId) : store.team(options[0]?.value);
  if (!buyer) {
    toast("No hay un club comprador disponible.", "danger");
    return;
  }
  openModal({
    title: "Ejecutar clausulazo",
    eyebrow: `${player.name} · ${seller?.name || "Agente libre"}`,
    size: "md",
    body: `<form data-clausulazo-form>
      <div class="notice notice--warning">${icon("alert", 16)}<div><strong>Operación irreversible</strong><span>El pago es inmediato y no requiere la autorización del club vendedor. Solo se permite un clausulazo por club y mercado.</span></div></div>
      <div class="form-grid" style="margin-top:14px">
        ${store.isAdmin() ? field({ label: "Club comprador", name: "buyerTeamId", type: "select", value: buyer.id, options, full: true }) : `<div class="field field--full"><label>Club comprador</label><input value="${esc(buyer.name)}" disabled></div>`}
        <div class="field"><label>Jugador</label><input value="${esc(player.name)}" disabled></div>
        <div class="field"><label>Cláusula</label><input value="${money(player.value)}" disabled></div>
        <div class="field field--full"><label>Saldo del comprador</label><input value="${money(buyer.balance)}" disabled></div>
      </div>
      <p class="notice" style="margin-top:14px">${icon("info", 16)}<span>Tras confirmar, la plantilla, el saldo de ambos clubes, el historial y el Fantasy se actualizan al instante.</span></p>
      <div class="form-actions">
        <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
        <button class="btn btn--danger-solid" type="submit">Pagar ${money(player.value)}</button>
      </div>
    </form>`,
    onMount(root, close) {
      const form = root.querySelector("[data-clausulazo-form]");
      const select = form.querySelector('[name="buyerTeamId"]');
      if (select) {
        select.addEventListener("change", () => {
          const selected = store.team(select.value);
          const balanceInput = form.querySelectorAll('input[disabled]')[2];
          if (selected && balanceInput) balanceInput.value = money(selected.balance);
        });
      }
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = formValues(form);
        const targetId = store.isAdmin() ? values.buyerTeamId : store.user?.teamId;
        const result = store.executeClausulazo(player.id, targetId);
        if (!result.ok) {
          toast(result.message, "danger");
          return;
        }
        toast(result.message, "success");
        close();
      });
    }
  });
}

function openOffer(player) {
  if (!canTrade()) {
    toast("Inicia sesión como presidente para enviar ofertas.", "warning");
    return;
  }
  const seller = store.team(player.teamId);
  const options = teamOptions(player.teamId);
  const initialBuyer = store.isPresident() ? store.user?.teamId : options[0]?.value;
  const buyersSquad = store.teamPlayers(initialBuyer).filter((item) => !item.insignia && item.id !== player.id);
  openModal({
    title: "Enviar oferta",
    eyebrow: `${player.name} · ${seller?.name || ""}`,
    size: "md",
    body: `<form data-offer-form>
      <div class="form-grid">
        ${store.isAdmin() ? field({ label: "Club comprador", name: "buyerTeamId", type: "select", value: initialBuyer, options, full: true }) : `<div class="field field--full"><label>Club comprador</label><input value="${esc(store.team(initialBuyer)?.name || "")}" disabled><input type="hidden" name="buyerTeamId" value="${esc(initialBuyer)}"></div>`}
        ${field({ label: "Oferta en efectivo (M)", name: "price", type: "number", value: Math.min(player.value, store.team(initialBuyer)?.balance || 0), min: 0, max: 999 })}
        ${field({ label: "Jugador incluido (opcional)", name: "offeredPlayerId", type: "select", value: "", options: [{ value: "", label: "Sin intercambio" }, ...buyersSquad.map((item) => ({ value: item.id, label: `${item.name} · ${money(item.value)}` }))] })}
        ${field({ label: "Nota para el club vendedor", name: "notes", type: "textarea", rows: 2, full: true, placeholder: "Detalles de la propuesta…" })}
      </div>
      <div class="form-actions">
        <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
        <button class="btn btn--primary" type="submit">Enviar oferta</button>
      </div>
    </form>`,
    onMount(root, close) {
      const form = root.querySelector("[data-offer-form]");
      const buyerSelect = form.querySelector("select[name=\"buyerTeamId\"]");
      const swapSelect = form.querySelector('select[name="offeredPlayerId"]');
      buyerSelect?.addEventListener("change", () => {
        const squad = store.teamPlayers(buyerSelect.value).filter((item) => !item.insignia && item.id !== player.id);
        swapSelect.innerHTML = `<option value="">Sin intercambio</option>${squad.map((item) => `<option value="${esc(item.id)}">${esc(item.name)} · ${money(item.value)}</option>`).join("")}`;
      });
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = formValues(form);
        const result = store.makeOffer({
          buyerTeamId: store.isAdmin() ? values.buyerTeamId : store.user?.teamId,
          sellerTeamId: player.teamId,
          playerId: player.id,
          price: Number(values.price),
          offeredPlayerIds: values.offeredPlayerId ? [values.offeredPlayerId] : []
        });
        if (!result.ok) {
          toast(result.message, "danger");
          return;
        }
        toast("Oferta enviada al club vendedor.", "success");
        close();
      });
    }
  });
}

export default {
  render({ query }) {
    const tab = ["jugadores", "ofertas", "historial"].includes(query.tab) ? query.tab : "jugadores";
    const league = store.state.league;
    const marketOpen = store.isMarketOpen();
    const targets = store.state.players
      .filter((player) => !player.insignia)
      .sort((a, b) => b.value - a.value);
    const pending = store.state.transfers.filter((transfer) => transfer.status === "pending");
    const completed = store.state.transfers.filter((transfer) => transfer.status !== "pending");
    const availableClausulazos = store.state.teams.filter((team) => !team.clausulazoUsed).length;
    const canRespond = (transfer) => store.isAdmin() || store.user?.teamId === transfer.sellerTeamId;
    return `<div class="container page">
      <section class="market-hero" style="margin-bottom:20px">
        <div class="market-hero__main">
          <p class="eyebrow">Mercado de fichajes · ${esc(store.state.league.season)}</p>
          <h1>${marketOpen ? "Mueve ficha" : "Ventana cerrada"}</h1>
          <p>${marketOpen ? "Un clausulazo por club y mercado. Negocia intercambios, refuerza tu plantilla y compite por los jugadores disponibles." : "El mercado está cerrado. Consulta el historial de operaciones y prepara la próxima ventana."}</p>
          <div class="hero__actions" style="margin-top:18px">
            <a class="btn btn--accent" href="#/jugadores">${icon("users", 16)} Explorar jugadores</a>
            <a class="btn btn--ghost" href="#/equipos">${icon("shield", 16)} Ver clubes</a>
            ${store.isAdmin() ? `<button class="btn btn--ghost" type="button" data-toggle-market>${icon("sync", 16)} ${marketOpen ? "Cerrar mercado" : "Abrir mercado"}</button>` : ""}
          </div>
        </div>
        <div class="market-hero__side">
          <p class="eyebrow">${marketOpen ? "Cierra en" : "Estado"}</p>
          <span class="countdown">${marketOpen ? esc(countdown(store.marketCloseAt())) : "Cerrado"}</span>
          <p class="small" style="color:rgba(243,241,235,.5);margin-top:8px">${esc(fmtDate(store.marketCloseAt().slice(0, 10)))} · medianoche (hora de México)</p>
          <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(243,241,235,.12)">
            <p class="eyebrow">Clausulazos disponibles</p>
            <strong style="font-family:var(--font-display);font-size:30px;letter-spacing:-.04em">${availableClausulazos}<span style="font-size:13px;color:rgba(243,241,235,.5)"> / ${store.state.teams.length} clubes</span></strong>
          </div>
        </div>
      </section>

      <div class="market-stats">
        <div class="stat"><span class="stat__label">Operaciones cerradas</span><span class="stat__value">${completed.length}</span><span class="stat__meta">Clausulazos y acuerdos</span></div>
        <div class="stat"><span class="stat__label">Ofertas pendientes</span><span class="stat__value">${pending.length}</span><span class="stat__meta">Esperando respuesta</span></div>
        <div class="stat"><span class="stat__label">Jugadores en mercado</span><span class="stat__value">${targets.length}</span><span class="stat__meta">No blindados</span></div>
        <div class="stat"><span class="stat__label">Saldo de la liga</span><span class="stat__value">${money(store.state.teams.reduce((sum, team) => sum + Number(team.balance), 0))}</span><span class="stat__meta">Entre todos los clubes</span></div>
      </div>

      <div class="tabs" style="margin-bottom:18px">
        <a class="tab ${tab === "jugadores" ? "is-active" : ""}" href="#/mercado?tab=jugadores">Jugadores</a>
        <a class="tab ${tab === "ofertas" ? "is-active" : ""}" href="#/mercado?tab=ofertas">Ofertas ${pending.length ? `<span class="pill pill--accent" style="margin-left:6px">${pending.length}</span>` : ""}</a>
        <a class="tab ${tab === "historial" ? "is-active" : ""}" href="#/mercado?tab=historial">Historial</a>
      </div>

      ${tab === "jugadores" ? `<section class="panel panel--flush">
        <div class="panel__head"><div><h3>Jugadores disponibles</h3><p>Los jugadores insignia están blindados y no entran en operaciones.</p></div><span class="pill pill--outline">${targets.length} en mercado</span></div>
        <div class="table-wrap">
          <table class="table table--stack">
            <thead><tr><th>Jugador</th><th>Club</th><th>Pos.</th><th class="table__num">Valor</th><th class="table__num">Goles</th><th class="table__num">Fantasy</th><th style="text-align:right">Acciones</th></tr></thead>
            <tbody>
              ${targets.map((player) => {
                const team = store.team(player.teamId);
                const own = store.user?.teamId === team?.id;
                return `<tr>
                  <td data-label="Jugador"><a class="table__club" href="#/jugador/${esc(player.id)}"><span class="avatar avatar--sm">${esc(player.number || "—")}</span><span>${esc(player.name)}</span></a></td>
                  <td data-label="Club">${team ? `<a class="table__club" href="#/equipo/${esc(team.id)}">${teamCrest(team, 20)}<span>${esc(team.short)}</span></a>` : "—"}</td>
                  <td data-label="Pos."><span class="mono small">${esc(player.position)}</span></td>
                  <td class="table__num" data-label="Valor">${money(player.value)}</td>
                  <td class="table__num" data-label="Goles">${number(player.goals)}</td>
                  <td class="table__num" data-label="Fantasy">${number(store.fantasyPoints(player))}</td>
                  <td data-label="Acciones"><div class="table__actions">
                    ${own ? `<span class="pill pill--muted">Tu club</span>` : `<button class="btn btn--primary btn--xs" type="button" data-clausulazo="${esc(player.id)}" ${marketOpen ? "" : "disabled"}>Clausulazo</button><button class="btn btn--ghost btn--xs" type="button" data-offer="${esc(player.id)}" ${marketOpen ? "" : "disabled"}>Ofertar</button>`}
                  </div></td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </section>` : ""}

      ${tab === "ofertas" ? `<div class="stack">
        ${pending.length ? pending.map((transfer) => {
          const player = store.player(transfer.playerId);
          const buyer = store.team(transfer.buyerTeamId);
          const seller = store.team(transfer.sellerTeamId);
          const responded = canRespond(transfer);
          return `<div class="offer-card">
            <div class="offer-card__head">
              <div class="offer-card__player"><span class="avatar avatar--team" style="--team:${esc(seller?.primary || "#171717")};--team-fg:${esc(seller?.secondary || "#fff")}">${esc((buyer?.short || "??").slice(0, 2))}</span><div><strong>${esc(player?.name || "Jugador")}</strong><span>${esc(seller?.name || "")} → ${esc(buyer?.name || "")}</span></div></div>
              ${statusPill("Pendiente", "warning")}
            </div>
            <p class="offer-card__copy">${esc(player?.name || "El jugador")} tiene una oferta de ${money(transfer.price)}${transfer.offeredPlayerIds?.length ? " más un jugador incluido" : ""}. ${esc(transfer.notes || "")}</p>
            <div class="row row--between" style="flex-wrap:wrap">
              <span class="mono small">${esc(transfer.type === "swap_and_cash" ? "Intercambio + efectivo" : "Efectivo")} · ${esc(fmtDate(transfer.date.slice(0, 10)))}</span>
              <div class="offer-card__actions">
                ${responded ? `<button class="btn btn--danger btn--xs" type="button" data-reject="${esc(transfer.id)}">Rechazar</button><button class="btn btn--primary btn--xs" type="button" data-accept="${esc(transfer.id)}">Aceptar oferta</button>` : `<span class="pill pill--outline">Esperando al club vendedor</span>`}
              </div>
            </div>
          </div>`;
        }).join("") : emptyState("Sin ofertas pendientes", "Cuando un club envíe una propuesta aparecerá aquí para que el vendedor responda.")}
      </div>` : ""}

      ${tab === "historial" ? `<section class="panel panel--flush">
        <div class="panel__head"><div><h3>Historial de operaciones</h3><p>Todos los movimientos registrados en la plataforma</p></div><span class="pill pill--outline">${store.state.transfers.length} operaciones</span></div>
        <div style="padding:4px 20px 12px">
          ${store.state.transfers.length ? store.state.transfers.map((transfer) => {
            const player = store.player(transfer.playerId);
            const buyer = store.team(transfer.buyerTeamId);
            const seller = store.team(transfer.sellerTeamId);
            return `<div class="transfer-row">
              <a class="transfer-row__club" href="${buyer ? `#/equipo/${buyer.id}` : "#/equipos"}">${buyer ? teamCrest(buyer, 24) : ""}<span>${esc(buyer?.name || "—")}</span></a>
              <div class="transfer-row__player"><strong>${esc(player?.name || "Jugador")}</strong><span>${esc(seller?.short || "—")} → ${esc(buyer?.short || "—")} · ${esc(transfer.status)}</span></div>
              <a class="transfer-row__club" href="${seller ? `#/equipo/${seller.id}` : "#/equipos"}">${seller ? teamCrest(seller, 24) : ""}<span>${esc(seller?.name || "—")}</span></a>
              <span class="transfer-row__price">${money(transfer.price)}</span>
            </div>`;
          }).join("") : `<div class="admin-empty">Todavía no hay operaciones registradas.</div>`}
        </div>
      </section>` : ""}

      <section class="panel" style="margin-top:20px">
        <div class="panel__head"><div><h3>Reglas del mercado</h3><p>Clausulazos, ofertas e intercambios</p></div>${store.isAdmin() ? `<button class="btn btn--ghost btn--sm" type="button" data-reset-clausulazos>${icon("sync", 14)} Reiniciar clausulazos</button>` : ""}</div>
        <div class="grid grid--3">
          <div><p class="eyebrow">Clausulazo</p><p class="small muted" style="margin-top:6px">Pagas el valor del jugador y se incorpora de inmediato, sin negociación. Un uso por club y mercado.</p></div>
          <div><p class="eyebrow">Oferta</p><p class="small muted" style="margin-top:6px">Propón efectivo, un jugador o ambos. El club vendedor acepta o rechaza desde su panel.</p></div>
          <div><p class="eyebrow">Blindaje</p><p class="small muted" style="margin-top:6px">Los jugadores insignia no pueden salir por clausulazo ni entrar en negociaciones.</p></div>
        </div>
      </section>
    </div>`;
  },
  bind(root) {
    root.querySelector("[data-toggle-market]")?.addEventListener("click", () => {
      store.toggleMarket(!store.isMarketOpen());
      toast(store.isMarketOpen() ? "Mercado abierto." : "Mercado cerrado.", "success");
    });
    root.querySelector("[data-reset-clausulazos]")?.addEventListener("click", () => {
      confirmDialog({
        title: "Reiniciar clausulazos",
        message: "Todos los clubes podrán volver a usar un clausulazo en este mercado. ¿Continuar?",
        confirmLabel: "Reiniciar",
        onConfirm: () => {
          store.resetClausulazos();
          toast("Clausulazos reiniciados.", "success");
        }
      });
    });
    root.querySelectorAll("[data-clausulazo]").forEach((button) => {
      button.addEventListener("click", () => {
        const player = store.player(button.dataset.clausulazo);
        if (player) openClausulazo(player);
      });
    });
    root.querySelectorAll("[data-offer]").forEach((button) => {
      button.addEventListener("click", () => {
        const player = store.player(button.dataset.offer);
        if (player) openOffer(player);
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
  }
};
