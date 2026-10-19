import { store } from "../store.js";
import { auth } from "../auth.js";
import { esc, icon, roleLabel, roleTone, money, fmtDate, playerPortrait } from "../utils.js";
import { pageHead } from "../ui.js";
import { field, playerCard } from "./shared.js";
import { toast } from "../ui.js";

export default {
  render() {
    const user = store.user;
    if (!user) return "";
    const account = store.account(user.id);
    const team = user.teamId ? store.team(user.teamId) : null;
    const player = user.playerId ? store.player(user.playerId) : null;
    const manager = store.myFantasy(user.id);
    const managers = store.fantasyManagers();
    const myRow = managers.find((row) => row.accountId === user.id);
    const rank = myRow ? managers.indexOf(myRow) + 1 : null;
    const lineup = manager ? manager.lineup.map((id) => store.player(id)).filter(Boolean) : [];
    const createdAt = account?.createdAt || user.createdAt;
    return `<div class="container page">
      ${pageHead({
        eyebrow: "Cuenta",
        title: "Mi cuenta",
        copy: "Gestiona tu perfil, tu seguridad y tus equipos dentro de la plataforma.",
        action: `<button class="btn btn--ghost btn--sm" type="button" data-logout>${icon("logout", 15)} Cerrar sesión</button>`
      })}
      <div class="account-grid">
        <div class="stack" style="gap:20px">
          <section class="account-card">
            <span class="avatar avatar--lg">${esc(user.name.slice(0, 2).toUpperCase())}</span>
            <div style="min-width:0;flex:1">
              <p class="account-card__name">${esc(user.name)}</p>
              <p class="account-card__email">${esc(user.email)}</p>
              <div class="account-meta">
                <span class="pill pill--${roleTone(user.role)}">${esc(roleLabel(user.role))}</span>
                ${team ? `<span class="pill pill--outline">${esc(team.name)}</span>` : ""}
                ${player ? `<span class="pill pill--outline">Dorsal ${esc(player.number || "—")}</span>` : ""}
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel__head"><div><h3>Datos de la cuenta</h3><p>Información de tu perfil IMEX</p></div><span class="pill ${auth.mode === "supabase" ? "pill--success" : "pill--muted"}">${auth.mode === "supabase" ? "Supabase" : "Modo local"}</span></div>
            <div class="detail-list">
              <div class="detail-list__row"><span>Nombre</span><strong>${esc(user.name)}</strong></div>
              <div class="detail-list__row"><span>Correo</span><strong>${esc(user.email)}</strong></div>
              <div class="detail-list__row"><span>Rol</span><strong>${esc(roleLabel(user.role))}</strong></div>
              <div class="detail-list__row"><span>Club</span><strong>${team ? `<a href="#/equipo/${esc(team.id)}">${esc(team.name)}</a>` : "Sin club asignado"}</strong></div>
              <div class="detail-list__row"><span>Jugador</span><strong>${player ? `<a href="#/jugador/${esc(player.id)}">${esc(player.name)}</a>` : "No vinculado"}</strong></div>
              <div class="detail-list__row"><span>Alta</span><strong>${createdAt ? esc(fmtDate(createdAt.slice(0, 10))) : "—"}</strong></div>
              <div class="detail-list__row"><span>Sincronización</span><strong>${store.remoteReady ? "En vivo" : store.remoteError ? "Sin conexión remota" : "Local (BroadcastChannel)"}</strong></div>
            </div>
          </section>

          <section class="panel">
            <div class="panel__head"><div><h3>Seguridad</h3><p>Cambia tu contraseña cuando quieras</p></div>${icon("lock", 16)}</div>
            <form class="auth-form" data-password-form>
              <div class="form-grid">
                ${field({ label: "Contraseña actual", name: "current", type: "password", required: true, autocomplete: "current-password" })}
                ${field({ label: "Nueva contraseña", name: "next", type: "password", required: true, autocomplete: "new-password", hint: "Mínimo 8 caracteres." })}
                ${field({ label: "Repite la nueva contraseña", name: "confirm", type: "password", required: true, autocomplete: "new-password", full: true })}
              </div>
              <p class="auth-error" data-error hidden></p>
              <div class="form-actions" style="justify-content:flex-start">
                <button class="btn btn--primary" type="submit">${icon("check", 15)} Actualizar contraseña</button>
              </div>
            </form>
          </section>
        </div>

        <div class="stack" style="gap:20px">
          <section class="panel">
            <div class="panel__head"><div><h3>Mi Fantasy</h3><p>${myRow ? `${myRow.points} puntos · ${rank}º de ${managers.length}` : "Todavía no tienes equipo"}</p></div><a class="text-link" href="#/fantasy">${myRow ? "Editar" : "Crear"} ${icon("arrow", 14)}</a></div>
            ${lineup.length ? `<div class="activity-list">${lineup.map((item) => {
              const club = store.team(item.teamId);
              return `<a class="activity-row" href="#/jugador/${esc(item.id)}" style="padding:9px 0">
                <span class="activity-row__icon" style="padding:0;overflow:hidden">${playerPortrait(item, club, "sm")}</span>
                <div style="flex:1"><p><strong>${esc(item.name)}</strong></p><span>${esc(club?.short || "")} · ${esc(item.position)}</span></div>
                <span class="mono small">${store.fantasyPoints(item)} pts</span>
              </a>`;
            }).join("")}</div>` : `<p class="modal-copy">Arma tu quinteto con ${money(store.state.fantasy.budget)} de presupuesto y compite contra toda la comunidad.</p>
            <a class="btn btn--primary btn--sm btn--block" href="#/fantasy" style="margin-top:14px">${icon("star", 14)} Ir al Fantasy</a>`}
          </section>

          ${player ? `<section class="panel">
            <div class="panel__head"><div><h3>Mi tarjeta</h3><p>${esc(player.name)}</p></div><a class="text-link" href="#/jugador/${esc(player.id)}">Ver ficha ${icon("arrow", 14)}</a></div>
            ${playerCard(player, team)}
          </section>` : ""}

          <section class="panel">
            <div class="panel__head"><div><h3>Accesos rápidos</h3><p>Todo lo que puedes hacer</p></div></div>
            <div class="stack--sm" style="display:flex;flex-direction:column;gap:2px">
              <a class="admin-nav" style="position:static;border:0;padding:0;gap:2px;background:transparent" href="#/partidos">
                <span class="row" style="padding:9px 10px;border-radius:6px">${icon("calendar", 16)} Calendario y resultados</span>
              </a>
              <a class="row" href="#/mercado" style="padding:9px 10px;border-radius:6px">${icon("transfer", 16)} Mercado de fichajes</a>
              <a class="row" href="#/jugadores" style="padding:9px 10px;border-radius:6px">${icon("users", 16)} Registro de jugadores</a>
              ${team ? `<a class="row" href="#/equipo/${esc(team.id)}" style="padding:9px 10px;border-radius:6px">${icon("shield", 16)} Mi club · ${esc(team.short)}</a>` : ""}
              ${user.role === "ADMIN" ? `<a class="row" href="#/admin" style="padding:9px 10px;border-radius:6px">${icon("sliders", 16)} Panel del organizador</a>` : ""}
            </div>
          </section>
        </div>
      </div>
    </div>`;
  },
  bind(root) {
    const form = root.querySelector("[data-password-form]");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const errorBox = form.querySelector("[data-error]");
      const button = form.querySelector('button[type="submit"]');
      const data = new FormData(form);
      const current = String(data.get("current") || "");
      const next = String(data.get("next") || "");
      const confirm = String(data.get("confirm") || "");
      const fail = (message) => {
        errorBox.textContent = message;
        errorBox.hidden = false;
        toast(message, "danger");
      };
      if (next !== confirm) return fail("Las contraseñas nuevas no coinciden.");
      if (next.length < 8) return fail("La nueva contraseña debe tener al menos 8 caracteres.");
      errorBox.hidden = true;
      button.disabled = true;
      button.classList.add("is-loading");
      try {
        await auth.changePassword(current, next);
        form.reset();
        toast("Contraseña actualizada.", "success");
      } catch (error) {
        fail(error.message);
      } finally {
        button.disabled = false;
        button.classList.remove("is-loading");
      }
    });

  }
};
