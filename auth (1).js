import { store } from "../store.js";
import { auth } from "../auth.js";
import { SEED_ACCOUNTS, DEMO_PASSWORD } from "../data.js";
import { esc, icon, leagueMark, roleLabel } from "../utils.js";
import { toast, formValues } from "../ui.js";
import { field } from "./shared.js";

const DEMO_IDS = ["u-admin", "u-cuervos", "u-carlos", "u-fan"];

function nextPath(query) {
  const next = String(query.next || "").replace(/^#?\/?/, "");
  if (!next || next.startsWith("acceso")) return "cuenta";
  return next;
}

function signedIn() {
  const user = store.user;
  const team = user?.teamId ? store.team(user.teamId) : null;
  const player = user?.playerId ? store.player(user.playerId) : null;
  return `<div class="auth-page">
    <div class="auth-split" style="grid-template-columns:1fr;max-width:520px">
      <div class="auth-card">
        <span class="rule-card__icon" style="width:48px;height:48px;margin-bottom:18px">${leagueMark(28, "lime")}</span>
        <p class="eyebrow">Sesión activa</p>
        <h1>Hola, ${esc(user.name.split(" ")[0])}.</h1>
        <p class="auth-card__copy">Ya tienes la sesión iniciada como ${esc(roleLabel(user.role))}${team ? ` de ${esc(team.name)}` : ""}${player ? ` · ${esc(player.name)}` : ""}.</p>
        <div class="account-card" style="margin-top:20px">
          <span class="avatar avatar--lg">${esc(user.name.slice(0, 2).toUpperCase())}</span>
          <div><p class="account-card__name">${esc(user.name)}</p><p class="account-card__email">${esc(user.email)}</p><div class="account-meta"><span class="pill pill--ink">${esc(roleLabel(user.role))}</span>${team ? `<span class="pill pill--outline">${esc(team.short)}</span>` : ""}</div></div>
        </div>
        <div class="form-actions" style="justify-content:flex-start">
          <a class="btn btn--primary" href="#/cuenta">${icon("user", 15)} Mi cuenta</a>
          ${user.role === "ADMIN" ? `<a class="btn btn--ghost" href="#/admin">Panel organizador</a>` : ""}
          <button class="btn btn--ghost" type="button" data-logout>${icon("logout", 15)} Cerrar sesión</button>
        </div>
      </div>
    </div>
  </div>`;
}

export default {
  render({ query }) {
    if (store.user) return signedIn();
    const tab = query.tab === "crear" ? "crear" : "entrar";
    const next = query.next || "";
    const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";
    const demo = SEED_ACCOUNTS.filter((account) => DEMO_IDS.includes(account.id));
    return `<div class="auth-page">
      <div class="auth-split">
        <aside class="auth-visual">
          <div class="auth-visual__top">${leagueMark(42, "lime")}</div>
          <div class="auth-visual__copy">
            <p class="eyebrow">Kings League IMEX · ${esc(store.state.league.season)}</p>
            <h2>La liga también se juega fuera de la cancha.</h2>
            <p>Consulta resultados en vivo, gestiona tu club, ficha jugadores, arma tu Fantasy y compite con la comunidad IMEX. Una sola cuenta para todo.</p>
          </div>
          <div class="auth-visual__bottom">
            <span>${store.state.teams.length} clubes</span>
            <span>${store.state.players.length} jugadores</span>
            <span>${store.state.matches.length} partidos</span>
            <span>Sincronización en vivo</span>
          </div>
        </aside>

        <div class="auth-card">
          <p class="eyebrow">Acceso a la plataforma</p>
          <h1>${tab === "crear" ? "Crea tu cuenta." : "Bienvenido."}</h1>
          <p class="auth-card__copy">${tab === "crear" ? "Regístrate como aficionado o jugador. Los accesos de presidente y organizador los asigna la liga." : "Entra con tu correo y contraseña. Tu sesión se mantiene guardada en este dispositivo."}</p>

          <div class="auth-tabs" role="tablist">
            <a class="${tab === "entrar" ? "is-active" : ""}" href="#/acceso${nextQuery}">Entrar</a>
            <a class="${tab === "crear" ? "is-active" : ""}" href="#/acceso?tab=crear${next ? `&next=${encodeURIComponent(next)}` : ""}">Crear cuenta</a>
          </div>

          ${tab === "entrar" ? `<form class="auth-form" data-login-form>
            ${field({ label: "Correo electrónico", name: "email", type: "email", required: true, placeholder: "tu@correo.com", autocomplete: "email" })}
            <div class="field">
              <label for="loginPassword">Contraseña</label>
              <div class="password-wrap">
                <input id="loginPassword" name="password" type="password" required autocomplete="current-password" placeholder="••••••••">
                <button class="icon-btn icon-btn--sm" type="button" data-toggle-pass aria-label="Mostrar contraseña">${icon("eye", 16)}</button>
              </div>
            </div>
            <label class="check"><input type="checkbox" name="remember" checked><span>Mantener la sesión en este dispositivo</span></label>
            <p class="auth-error" data-error hidden></p>
            <button class="btn btn--primary btn--block" type="submit">${icon("lock", 15)} Iniciar sesión</button>
          </form>

          <div class="demo-accounts">
            <div class="demo-accounts__head"><p class="eyebrow">Accesos de demostración</p><span class="tiny muted mono">${auth.mode === "local" ? `Clave ${DEMO_PASSWORD}` : "Solo modo local"}</span></div>
            <div class="demo-accounts__grid">
              ${demo.map((account) => `<button class="demo-account" type="button" data-demo-email="${esc(account.email)}">
                <strong>${esc(roleLabel(account.role))}</strong><span>${esc(account.email)}</span>
              </button>`).join("")}
            </div>
            <p class="field__hint" style="margin-top:8px">Toca un acceso para rellenar el formulario. En modo local todos usan la misma clave de demostración.</p>
          </div>` : `<form class="auth-form" data-register-form>
            ${field({ label: "Nombre completo", name: "name", required: true, placeholder: "Tu nombre", autocomplete: "name" })}
            ${field({ label: "Correo electrónico", name: "email", type: "email", required: true, placeholder: "tu@correo.com", autocomplete: "email" })}
            ${field({ label: "Contraseña", name: "password", type: "password", required: true, placeholder: "Mínimo 8 caracteres", autocomplete: "new-password", hint: "Usa al menos 8 caracteres. Se guarda cifrada." })}
            <div class="form-grid">
              ${field({ label: "Tipo de cuenta", name: "role", type: "select", value: "FAN", options: [{ value: "FAN", label: "Aficionado" }, { value: "PLAYER", label: "Jugador" }] })}
              ${field({ label: "Club (si eres jugador)", name: "teamId", type: "select", value: "", options: [{ value: "", label: "Sin club" }, ...store.state.teams.map((team) => ({ value: team.id, label: team.name }))] })}
            </div>
            <p class="auth-error" data-error hidden></p>
            <button class="btn btn--primary btn--block" type="submit">${icon("user", 15)} Crear cuenta</button>
            <p class="field__hint">Al crear una cuenta aceptas el reglamento de la liga y el tratamiento de datos de la plataforma.</p>
          </form>`}
        </div>
      </div>
    </div>`;
  },
  bind(root, { query }) {
    const toggle = root.querySelector("[data-toggle-pass]");
    const password = root.querySelector("#loginPassword");
    toggle?.addEventListener("click", () => {
      if (!password) return;
      const show = password.type === "password";
      password.type = show ? "text" : "password";
      toggle.innerHTML = icon(show ? "eyeOff" : "eye", 16);
      toggle.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
    });

    const setError = (message = "") => {
      const box = root.querySelector("[data-error]");
      if (!box) return;
      box.textContent = message;
      box.hidden = !message;
    };

    root.querySelectorAll("[data-demo-email]").forEach((button) => {
      button.addEventListener("click", () => {
        const email = root.querySelector('input[name="email"]');
        const pass = root.querySelector('input[name="password"]');
        if (email) email.value = button.dataset.demoEmail;
        if (pass) pass.value = DEMO_PASSWORD;
        setError("");
        email?.focus();
      });
    });

    const login = root.querySelector("[data-login-form]");
    login?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = login.querySelector('button[type="submit"]');
      const values = formValues(login);
      setError("");
      button.disabled = true;
      button.classList.add("is-loading");
      try {
        await auth.signIn(values.email, values.password, Boolean(login.querySelector('[name="remember"]')?.checked));
        toast(`Bienvenido, ${store.user?.name || "manager"}.`, "success");
        location.hash = `#/${nextPath(query)}`;
      } catch (error) {
        setError(error.message);
        toast(error.message, "danger");
      } finally {
        button.disabled = false;
        button.classList.remove("is-loading");
      }
    });

    const register = root.querySelector("[data-register-form]");
    register?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = register.querySelector('button[type="submit"]');
      const values = formValues(register);
      setError("");
      button.disabled = true;
      button.classList.add("is-loading");
      try {
        await auth.signUp({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          teamId: values.teamId || null
        });
        toast("Cuenta creada. Ya formas parte de IMEX.", "success");
        location.hash = `#/${nextPath(query)}`;
      } catch (error) {
        setError(error.message);
        toast(error.message, "danger");
      } finally {
        button.disabled = false;
        button.classList.remove("is-loading");
      }
    });
  }
};
