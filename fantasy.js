import { store } from "../store.js";
import { esc, icon, money, number, playerPortrait, positionLabel } from "../utils.js";
import { openModal, toast } from "../ui.js";

const SLOTS = [
  ["DEL1", "DEL", "Delantero"],
  ["DEL2", "DEL", "Delantero"],
  ["MED", "MED", "Mediocampista"],
  ["DEF", "DEF", "Defensa"],
  ["POR", "POR", "Portero"]
];

function slotPosition(key) {
  return key.startsWith("DEL") ? "DEL" : key;
}

function initialDraft(manager) {
  const draft = { POR: null, DEF: null, MED: null, DEL1: null, DEL2: null };
  if (!manager) return draft;
  const delSlots = ["DEL1", "DEL2"];
  for (const id of manager.lineup) {
    const player = store.player(id);
    if (!player) continue;
    if (player.position === "DEL") {
      const free = delSlots.find((slot) => !draft[slot]);
      if (free) draft[free] = id;
      continue;
    }
    if (player.position in draft && !draft[player.position]) draft[player.position] = id;
  }
  return draft;
}

function lineupArray(draft) {
  return SLOTS.map(([slot]) => draft[slot]).filter(Boolean);
}

function spentOf(draft) {
  return lineupArray(draft).reduce((sum, id) => sum + Number(store.player(id)?.value || 0), 0);
}

function pointsOf(draft) {
  return lineupArray(draft).reduce((sum, id) => sum + store.fantasyPoints(store.player(id)), 0);
}

function bestLineup() {
  const budget = Number(store.state.fantasy.budget);
  const byPos = { POR: [], DEF: [], MED: [], DEL: [] };
  for (const player of store.state.players) {
    if (byPos[player.position]) byPos[player.position].push(player);
  }
  let best = null;
  for (const por of byPos.POR) {
    for (const def of byPos.DEF) {
      for (const med of byPos.MED) {
        for (let i = 0; i < byPos.DEL.length; i += 1) {
          for (let j = i + 1; j < byPos.DEL.length; j += 1) {
            const del1 = byPos.DEL[i];
            const del2 = byPos.DEL[j];
            const spent = Number(por.value) + Number(def.value) + Number(med.value) + Number(del1.value) + Number(del2.value);
            if (spent > budget) continue;
            const points = store.fantasyPoints(por) + store.fantasyPoints(def) + store.fantasyPoints(med) + store.fantasyPoints(del1) + store.fantasyPoints(del2);
            if (!best || points > best.points || (points === best.points && spent < best.spent)) {
              best = { points, spent, draft: { POR: por.id, DEF: def.id, MED: med.id, DEL1: del1.id, DEL2: del2.id } };
            }
          }
        }
      }
    }
  }
  return best;
}

function pitchHtml(draft) {
  const rows = [["DEL1", "DEL2"], ["MED"], ["DEF"], ["POR"]];
  return rows.map((row) => `<div class="pitch__row">${row.map((slotKey) => {
    const player = store.player(draft[slotKey]);
    if (!player) {
      return `<button class="pitch__slot pitch__slot--empty" type="button" data-slot="${slotKey}">
        ${icon("plus", 16)}<span>${esc(SLOTS.find(([key]) => key === slotKey)?.[2] || "")}</span>
      </button>`;
    }
    const team = store.team(player.teamId);
    return `<button class="pitch__slot pitch__slot--filled" type="button" data-slot="${slotKey}" title="Cambiar ${esc(player.name)}">
      <b>${esc(player.name.split(" ").slice(-2).join(" "))}</b>
      <span>${esc(team?.short || "")} · ${esc(positionLabel(player.position))} · ${number(player.value)} M</span>
      <span class="pitch__remove" data-remove="${slotKey}" role="button" aria-label="Quitar jugador">${icon("close", 10)}</span>
    </button>`;
  }).join("")}</div>`).join("");
}

function summaryHtml(draft, managerName) {
  const spent = spentOf(draft);
  const budget = Number(store.state.fantasy.budget);
  const remaining = budget - spent;
  const percent = Math.min(100, Math.round((spent / budget) * 100));
  return `<div class="budget-bar">
      <div class="budget-bar__head"><span>Presupuesto</span><strong>${money(spent)} / ${money(budget)}</strong></div>
      <div class="progress progress--accent"><div class="progress__bar" style="width:${percent}%"></div></div>
      <div class="budget-bar__head"><span>Disponible</span><strong style="color:${remaining < 0 ? "var(--danger)" : "var(--success)"}">${money(remaining)}</strong></div>
    </div>
    <div class="lineup-summary">
      <div class="lineup-summary__points"><strong>${pointsOf(draft)}</strong><span>pts proyectados</span></div>
      <div class="row" style="gap:6px">
        <button class="btn btn--ghost btn--sm" type="button" data-autofill>${icon("bolt", 14)} Mejor quinteto</button>
        <button class="btn btn--primary btn--sm" type="button" data-save-lineup>${icon("check", 14)} Guardar</button>
      </div>
    </div>
    <input type="hidden" data-manager-name value="${esc(managerName)}">`;
}

function pickerHtml(slotKey, draft) {
  const position = slotPosition(slotKey);
  const budget = Number(store.state.fantasy.budget);
  const spent = spentOf(draft);
  const currentId = draft[slotKey];
  const current = store.player(currentId);
  const available = Number(current?.value || 0) + (budget - spent);
  const selectedElsewhere = new Set(Object.entries(draft).filter(([key]) => key !== slotKey).map(([, id]) => id).filter(Boolean));
  const candidates = store.state.players
    .filter((player) => player.position === position)
    .sort((a, b) => store.fantasyPoints(b) - store.fantasyPoints(a) || a.value - b.value);
  return `<div class="row row--between" style="margin-bottom:10px;flex-wrap:wrap">
      <p class="eyebrow" style="margin:0">${esc(positionLabel(position))} · saldo ${money(available)}</p>
      ${current ? `<button class="btn btn--danger btn--xs" type="button" data-clear-slot>Quitar del quinteto</button>` : ""}
    </div>
    <div class="picker-list">
      ${candidates.map((player) => {
        const team = store.team(player.teamId);
        const disabled = selectedElsewhere.has(player.id) || Number(player.value) > available;
        return `<button class="picker-row" type="button" data-pick="${esc(player.id)}" ${disabled ? "disabled" : ""} style="border:0;border-bottom:1px solid var(--border);background:transparent;width:100%;text-align:left;border-radius:0;${disabled ? "opacity:.45;cursor:not-allowed" : ""}">
          ${playerPortrait(player, team, "sm")}
          <span class="picker-row__main"><strong>${esc(player.name)}</strong><span>${esc(team?.short || "")} · ${esc(positionLabel(player.position))} · ${number(store.fantasyPoints(player))} pts</span></span>
          <span class="picker-row__value">${money(player.value)}</span>
          <span class="pill ${player.insignia ? "pill--accent" : "pill--outline"}">${player.insignia ? "Insignia" : "Disponible"}</span>
        </button>`;
      }).join("")}
    </div>`;
}

export default {
  render() {
    const user = store.user;
    const manager = user ? store.myFantasy(user.id) : null;
    const managers = store.fantasyManagers();
    const myRow = managers.find((item) => item.accountId === user?.id);
    const myRank = myRow ? managers.indexOf(myRow) + 1 : null;
    const topPlayers = [...store.state.players].sort((a, b) => store.fantasyPoints(b) - store.fantasyPoints(a)).slice(0, 10);
    const draft = initialDraft(manager);
    const managerName = manager?.name || (user ? `${user.name.split(" ")[0]} FC` : "Mi equipo");
    return `<div class="container page">
      <section class="fantasy-hero" style="margin-bottom:20px">
        <div>
          <p class="eyebrow">Fantasy IMEX · ${esc(store.state.league.season)}</p>
          <h1>Tu quinteto.<br />Tu estrategia.</h1>
          <p>Elige cinco futbolistas dentro de un presupuesto de ${money(store.state.fantasy.budget)}. Cada gol, asistencia y resultado de la liga actualiza tu puntuación al instante. Sin complicaciones: armas, guardas y compites.</p>
          <div class="fantasy-hero__actions">
            ${user ? `<button class="btn btn--accent" type="button" data-focus-builder>${icon("grid", 16)} Armar mi quinteto</button>` : `<a class="btn btn--accent" href="#/acceso?next=fantasy">${icon("lock", 16)} Iniciar sesión para jugar</a>`}
            <a class="btn btn--ghost" href="#/jugadores">${icon("users", 16)} Explorar jugadores</a>
          </div>
        </div>
        <div class="hero__side">
          <div class="market-hero__side" style="max-width:none;justify-self:stretch">
            <p class="eyebrow">Tu posición</p>
            <span class="countdown">${user ? (myRank ? `${myRank}º` : "Sin equipo") : "—"}</span>
            <p class="small" style="color:rgba(243,241,235,.5);margin-top:8px">${user ? (myRow ? `${myRow.points} puntos · ${money(myRow.spent)} invertidos` : "Guarda tu primer quinteto") : "Inicia sesión para competir"}</p>
            <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(243,241,235,.12)">
              <p class="eyebrow">Managers</p>
              <strong style="font-family:var(--font-display);font-size:28px;letter-spacing:-.04em">${managers.length}</strong>
            </div>
          </div>
        </div>
      </section>

      <div class="fantasy-grid">
        <section class="panel" id="fantasyBuilder">
          <div class="panel__head">
            <div><h3>Tu quinteto</h3><p>1 portero · 1 defensa · 1 mediocampista · 2 delanteros</p></div>
            ${user ? `<span class="pill ${myRow ? "pill--success" : "pill--warning"}">${myRow ? "Guardado" : "Sin guardar"}</span>` : `<span class="pill pill--outline">Solo lectura</span>`}
          </div>
          <div class="field" style="margin-bottom:14px">
            <label for="managerName">Nombre del equipo</label>
            <input id="managerName" data-manager-name value="${esc(managerName)}" maxlength="40" ${user ? "" : "disabled"}>
          </div>
          <div class="pitch" data-pitch>${pitchHtml(draft)}</div>
          <div data-fantasy-summary>${summaryHtml(draft, managerName)}</div>
          ${user ? "" : `<p class="notice" style="margin-top:14px">${icon("lock", 16)}<div><strong>Inicia sesión para guardar</strong><span>Puedes explorar el Fantasy, pero necesitas una cuenta para competir.</span></div></p>`}
        </section>

        <div class="stack">
          <section class="panel panel--flush">
            <div class="panel__head"><div><h3>Ranking de managers</h3><p>Puntuación acumulada de la temporada</p></div></div>
            <div style="padding:6px 20px 16px">
              ${managers.length ? managers.map((row, index) => `<div class="fantasy-row ${row.accountId === user?.id ? "is-me" : ""}">
                <span class="fantasy-row__rank">${index + 1}</span>
                <div class="fantasy-row__team"><strong>${esc(row.name)}</strong><span>${esc(row.owner || "Manager IMEX")}</span></div>
                <span class="fantasy-row__pts">${row.points}</span>
                <span class="fantasy-row__spent">${money(row.spent)}</span>
              </div>`).join("") : `<div class="admin-empty">Todavía no hay equipos Fantasy.</div>`}
            </div>
          </section>
          <section class="panel">
            <div class="panel__head"><div><h3>Cómo puntúa</h3><p>Reglas simples, resultados instantáneos</p></div></div>
            <div class="detail-list">
              <div class="detail-list__row"><span>Gol</span><strong>4 puntos</strong></div>
              <div class="detail-list__row"><span>Asistencia</span><strong>3 puntos</strong></div>
              <div class="detail-list__row"><span>Portero</span><strong>+3 puntos</strong></div>
              <div class="detail-list__row"><span>Jugador insignia</span><strong>+3 puntos</strong></div>
              <div class="detail-list__row"><span>Presupuesto</span><strong>${money(store.state.fantasy.budget)}</strong></div>
            </div>
          </section>
        </div>
      </div>

      <section class="panel panel--flush" style="margin-top:24px">
        <div class="panel__head"><div><h3>Jugadores más rentables</h3><p>Top Fantasy de la temporada</p></div><a class="text-link" href="#/jugadores">Ver todos ${icon("arrow", 14)}</a></div>
        <div class="table-wrap">
          <table class="table table--stack">
            <thead><tr><th>#</th><th>Jugador</th><th>Club</th><th>Pos.</th><th class="table__num">Puntos</th><th class="table__num">Valor</th><th></th></tr></thead>
            <tbody>
              ${topPlayers.map((player, index) => {
                const team = store.team(player.teamId);
                return `<tr>
                  <td data-label="Pos">${index + 1}</td>
                  <td data-label="Jugador"><a class="table__club" href="#/jugador/${esc(player.id)}"><span class="avatar avatar--sm">${esc(player.number || "—")}</span><span>${esc(player.name)}</span></a></td>
                  <td data-label="Club">${esc(team?.name || "—")}</td>
                  <td data-label="Pos."><span class="mono small">${esc(player.position)}</span></td>
                  <td class="table__num" data-label="Puntos">${store.fantasyPoints(player)}</td>
                  <td class="table__num" data-label="Valor">${money(player.value)}</td>
                  <td data-label="Ficha"><a class="btn btn--ghost btn--xs" href="#/jugador/${esc(player.id)}">Ver ficha</a></td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </section>
    </div>`;
  },
  bind(root) {
    const user = store.user;
    const manager = user ? store.myFantasy(user.id) : null;
    const draft = initialDraft(manager);
    const pitch = root.querySelector("[data-pitch]");
    const summary = root.querySelector("[data-fantasy-summary]");
    if (!pitch || !summary) return;
    let managerName = manager?.name || root.querySelector("#managerName")?.value || "Mi equipo";

    const rerender = () => {
      pitch.innerHTML = pitchHtml(draft);
      summary.innerHTML = summaryHtml(draft, managerName);
    };

    const openPicker = (slotKey) => {
      if (!store.user) {
        toast("Inicia sesión para armar tu quinteto.", "warning");
        return;
      }
      const close = openModal({
        title: `Elegir ${SLOTS.find(([key]) => key === slotKey)?.[2] || "jugador"}`,
        eyebrow: `Presupuesto ${money(store.state.fantasy.budget)} · Fantasy IMEX`,
        size: "md",
        body: `<div data-picker>${pickerHtml(slotKey, draft)}</div>`,
        footer: `<button class="btn btn--ghost" type="button" data-modal-close>Cerrar</button>`,
        onMount(modal, closeModal) {
          const draw = () => {
            const box = modal.querySelector("[data-picker]");
            box.innerHTML = pickerHtml(slotKey, draft);
            box.querySelectorAll("[data-pick]").forEach((button) => {
              button.addEventListener("click", () => {
                const id = button.dataset.pick;
                for (const key of Object.keys(draft)) {
                  if (key !== slotKey && draft[key] === id) draft[key] = null;
                }
                draft[slotKey] = id;
                closeModal();
                rerender();
                toast(`${store.player(id)?.name || "Jugador"} añadido al quinteto.`, "success");
              });
            });
            box.querySelector("[data-clear-slot]")?.addEventListener("click", () => {
              draft[slotKey] = null;
              closeModal();
              rerender();
            });
          };
          draw();
          void close;
        }
      });
      void close;
    };

    pitch.addEventListener("click", (event) => {
      const remove = event.target.closest("[data-remove]");
      if (remove) {
        event.stopPropagation();
        draft[remove.dataset.remove] = null;
        rerender();
        return;
      }
      const slot = event.target.closest("[data-slot]");
      if (slot) openPicker(slot.dataset.slot);
    });

    summary.addEventListener("click", (event) => {
      if (event.target.closest("[data-autofill]")) {
        const best = bestLineup();
        if (!best) {
          toast("No hay combinación posible dentro del presupuesto.", "danger");
          return;
        }
        Object.assign(draft, best.draft);
        rerender();
        toast(`Mejor quinteto aplicado: ${best.points} puntos por ${money(best.spent)}.`, "success");
        return;
      }
      if (event.target.closest("[data-save-lineup]")) {
        if (!store.user) {
          toast("Inicia sesión para guardar tu quinteto.", "warning");
          location.hash = "#/acceso?next=fantasy";
          return;
        }
        const nameInput = root.querySelector("#managerName");
        managerName = nameInput?.value?.trim() || "Mi equipo";
        const result = store.saveFantasyLineup({ accountId: store.user.id, managerName, lineup: lineupArray(draft) });
        toast(result.ok ? "Quinteto guardado. Ya compites en el ranking." : result.message, result.ok ? "success" : "danger");
      }
    });

    root.querySelector("[data-focus-builder]")?.addEventListener("click", () => {
      root.querySelector("#fantasyBuilder")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
};
