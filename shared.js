import { store } from "../store.js";
import { openModal, closeModal, toast, formValues, setBusy, confirmDialog } from "../ui.js";
import {
  esc,
  fmtDate,
  fmtDateShort,
  fmtDateLong,
  icon,
  leagueMark,
  teamCrest,
  playerPortrait,
  positionLabel,
  statusPill,
  money,
  number,
  countdown,
  relativeTime,
  initials,
  imageFromFile
} from "../utils.js";

export function teamLink(team, className = "") {
  if (!team) return `<span class="${className}">Por definir</span>`;
  return `<a class="${className}" href="#/equipo/${team.id}">${esc(team.name)}</a>`;
}

export function field({
  label,
  name,
  type = "text",
  value = "",
  options = null,
  required = false,
  full = false,
  hint = "",
  placeholder = "",
  min,
  max,
  step,
  rows = 4,
  autocomplete = "off"
}) {
  const id = `f-${name}`;
  const common = `id="${id}" name="${esc(name)}" ${required ? "required" : ""} ${placeholder ? `placeholder="${esc(placeholder)}"` : ""}`;
  if (type === "checkbox") {
    return `<label class="check ${full ? "field--full" : ""}" for="${id}"><input type="checkbox" id="${id}" name="${esc(name)}" ${value ? "checked" : ""}><span>${label}</span></label>`;
  }
  let control = "";
  if (type === "select") {
    control = `<select ${common}>${(options || [])
      .map((option) => `<option value="${esc(option.value)}" ${String(option.value) === String(value) ? "selected" : ""}>${esc(option.label)}</option>`)
      .join("")}</select>`;
  } else if (type === "textarea") {
    control = `<textarea ${common} rows="${rows}">${esc(value)}</textarea>`;
  } else {
    control = `<input ${common} type="${type}" value="${esc(value)}" ${min !== undefined ? `min="${min}"` : ""} ${max !== undefined ? `max="${max}"` : ""} ${step !== undefined ? `step="${step}"` : ""} ${autocomplete ? `autocomplete="${autocomplete}"` : ""}>`;
  }
  return `<div class="field ${full ? "field--full" : ""}">
    <label for="${id}">${esc(label)}</label>
    ${control}
    ${hint ? `<p class="field__hint">${esc(hint)}</p>` : ""}
  </div>`;
}

export function imageField({ name = "photoUrl", label = "Fotografía", value = "", hint = "" } = {}) {
  const safe = value || "";
  const preview = safe
    ? `<img src="${esc(safe)}" alt="Vista previa" data-upload-img>`
    : `<div class="portrait portrait--empty" style="--team:#171717;--team-2:#f3f1eb"><span>${icon("camera", 18)}</span></div>`;
  return `<div class="upload field field--full" data-upload>
    <label>${esc(label)}</label>
    <div class="upload__preview" data-upload-preview>${preview}</div>
    <input type="hidden" name="${esc(name)}" value="${esc(safe)}" data-upload-value>
    <button class="upload__drop" type="button" data-upload-btn>
      ${icon("upload", 18)}
      <span><strong>Subir imagen</strong>PNG, JPG o WebP · máximo 12 MB</span>
    </button>
    <input type="file" accept="image/png,image/jpeg,image/webp" hidden data-upload-input>
    ${hint ? `<p class="field__hint">${esc(hint)}</p>` : ""}
  </div>`;
}

export function bindImageFields(root) {
  root.querySelectorAll("[data-upload]").forEach((wrap) => {
    const button = wrap.querySelector("[data-upload-btn]");
    const input = wrap.querySelector("[data-upload-input]");
    const hidden = wrap.querySelector("[data-upload-value]");
    const preview = wrap.querySelector("[data-upload-preview]");
    if (!button || !input || !hidden || !preview) return;
    button.addEventListener("click", () => input.click());
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      button.classList.add("is-loading");
      try {
        const dataUrl = await imageFromFile(file, 720, 0.82);
        hidden.value = dataUrl;
        preview.innerHTML = `<img src="${dataUrl}" alt="Vista previa" data-upload-img>`;
        toast("Imagen lista para guardar.");
      } catch (error) {
        toast(error.message, "danger");
      } finally {
        button.classList.remove("is-loading");
        input.value = "";
      }
    });
  });
}

export function matchRow(match) {
  const home = store.team(match.homeTeamId);
  const away = store.team(match.awayTeamId);
  const finished = match.status === "finished";
  const label = match.title || `Jornada ${match.matchday}`;
  return `<a class="match-row" href="#/partidos/${esc(match.id)}">
    <div class="match-row__date">${esc(fmtDateShort(match.date))}<strong>${esc(match.time || "—")}</strong></div>
    <div class="match-team">${home ? teamCrest(home, 26) : ""}<span>${esc(home?.name || "Por definir")}</span></div>
    <div class="match-score ${finished ? "" : ""}">${finished ? `${match.homeScore} – ${match.awayScore}` : `<span class="match-score__vs">VS</span>`}</div>
    <div class="match-team match-team--away"><span>${esc(away?.name || "Por definir")}</span>${away ? teamCrest(away, 26) : ""}</div>
    <div class="match-row__meta"><strong>${esc(label)}</strong>${finished ? "Finalizado" : match.group ? `Grupo ${esc(match.group)}` : "Eliminatoria"}</div>
  </a>`;
}

export function resultTile(match) {
  const home = store.team(match.homeTeamId);
  const away = store.team(match.awayTeamId);
  return `<a class="result-tile" href="#/partidos/${esc(match.id)}">
    <span class="result-tile__meta">${esc(fmtDate(match.date))} · ${esc(match.title || `J${match.matchday}`)}</span>
    <div class="result-tile__line"><span>${esc(home?.short || "TBD")}</span><b>${match.homeScore}</b></div>
    <div class="result-tile__line"><span>${esc(away?.short || "TBD")}</span><b>${match.awayScore}</b></div>
  </a>`;
}

export function heroMatch(match) {
  if (!match) {
    return `<div class="hero-match">
      <div class="hero-match__top"><p class="eyebrow">Próximo partido</p></div>
      <p class="modal-copy" style="margin-top:18px">La eliminatoria se definirá cuando finalice la fase de grupos.</p>
    </div>`;
  }
  const home = store.team(match.homeTeamId);
  const away = store.team(match.awayTeamId);
  return `<div class="hero-match">
    <div class="hero-match__top">
      <p class="eyebrow">${esc(match.title || `Jornada ${match.matchday}`)}${match.group ? ` · Grupo ${esc(match.group)}` : ""}</p>
      ${statusPill(match.status === "finished" ? "Finalizado" : "Programado", match.status === "finished" ? "muted" : "accent")}
    </div>
    <div class="hero-match__teams">
      <div class="hero-match__team">${home ? teamCrest(home, 54, { onDark: true }) : ""}<span>${esc(home?.name || "Por definir")}</span></div>
      <div class="hero-match__vs"><strong>VS</strong><span>${esc(match.time || "—")}</span></div>
      <div class="hero-match__team">${away ? teamCrest(away, 54, { onDark: true }) : ""}<span>${esc(away?.name || "Por definir")}</span></div>
    </div>
    <div class="hero-match__meta">
      <div><span>Fecha</span><strong>${esc(fmtDateLong(match.date))}</strong></div>
      <div><span>Sede</span><strong>${esc(match.pitch || "Estadio IMEX")}</strong></div>
      <div class="hero-match__countdown"><span>Comienza en</span><span class="countdown" data-countdown="${esc(match.date)}T${esc(match.time || "00:00")}:00-06:00">${esc(countdown(`${match.date}T${match.time || "00:00"}:00-06:00`))}</span></div>
    </div>
  </div>`;
}

function footLabel(foot) {
  return { right: "Derecha", left: "Izquierda", both: "Ambas" }[foot] || "—";
}

export function playerCard(player, team, { compact = false } = {}) {
  const club = team || store.team(player.teamId);
  const points = store.fantasyPoints ? store.fantasyPoints(player) : 0;
  return `<article class="player-card" style="--team:${esc(club?.primary || "#171717")}">
    <div class="player-card__inner">
      <div class="player-card__face player-card__face--front">
        <a class="player-card__link" href="#/jugador/${esc(player.id)}" aria-label="Ver ficha de ${esc(player.name)}"></a>
        <div class="player-card__top">
          ${leagueMark(compact ? 22 : 26, "bone")}
          <span class="player-card__number">${esc(player.number || "—")}</span>
        </div>
        <div class="player-card__photo">${playerPortrait(player, club, "md")}</div>
        <div class="player-card__scrim"></div>
        <div class="player-card__body">
          <span class="player-card__position ${player.insignia ? "is-insignia" : ""}">${player.insignia ? `${icon("star", 9)} Insignia` : esc(positionLabel(player.position))}</span>
          <h3 class="player-card__name">${esc(player.name)}</h3>
          <p class="player-card__team">${esc(club?.name || "Agente libre")}${player.nickname ? ` · ${esc(player.nickname)}` : ""}</p>
          <div class="player-card__stats">
            <div class="player-card__stat"><b>${number(player.goals)}</b><span>Goles</span></div>
            <div class="player-card__stat"><b>${number(player.assists)}</b><span>Asist.</span></div>
            <div class="player-card__stat"><b>${number(player.value)}</b><span>Valor</span></div>
          </div>
        </div>
        <div class="player-card__foot">${club ? teamCrest(club, 24, { onDark: true }) : ""}<span>IMEX · ${esc(player.position)}</span></div>
      </div>
      <div class="player-card__face player-card__face--back" aria-hidden="true">
        <div class="player-card__back-head">
          ${club ? teamCrest(club, 40, { onDark: true }) : ""}
          <div>
            <span class="player-card__back-kicker">Ficha rápida</span>
            <strong>${esc(player.name)}</strong>
          </div>
        </div>
        <dl class="player-card__back-list">
          <div><dt>Club</dt><dd>${esc(club?.name || "Agente libre")}</dd></div>
          <div><dt>Posición</dt><dd>${esc(positionLabel(player.position))}</dd></div>
          <div><dt>Goles</dt><dd>${number(player.goals)}</dd></div>
          <div><dt>Asistencias</dt><dd>${number(player.assists)}</dd></div>
          <div><dt>Puntos Fantasy</dt><dd>${number(points)}</dd></div>
          <div><dt>Valor</dt><dd>${money(player.value)}</dd></div>
          <div><dt>Estatura</dt><dd>${player.height ? `${number(player.height)} cm` : "—"}</dd></div>
          <div><dt>Peso</dt><dd>${player.weight ? `${number(player.weight)} kg` : "—"}</dd></div>
          <div><dt>Pierna buena</dt><dd>${footLabel(player.strongFoot)}</dd></div>
          <div><dt>Media (1-5)</dt><dd>${player.weakFoot ? `${player.weakFoot} / 5` : "—"}</dd></div>
        </dl>
        <span class="player-card__back-cta">${icon("arrow", 12)} Ver ficha completa</span>
      </div>
    </div>
  </article>`;
}

export function teamCard(team, row) {
  return `<a class="team-card" href="#/equipo/${esc(team.id)}">
    <div class="team-card__top">
      <div class="team-card__crest">${teamCrest(team, 62)}</div>
      <div style="text-align:right">
        <span class="team-card__group">Grupo ${esc(team.group)}</span>
        <p class="team-card__meta">${row ? `${row.points} pts · ${row.played} PJ` : "Pretemporada"}</p>
      </div>
    </div>
    <div>
      <h3 class="team-card__name">${esc(team.name)}</h3>
      <p class="team-card__meta">${esc(team.president)}</p>
    </div>
    <div class="team-card__stats">
      <div class="team-card__stat"><span>Posición</span><b>${row ? `${row.pos}º` : "—"}</b></div>
      <div class="team-card__stat"><span>Plantilla</span><b>${money(team.squadValue)}</b></div>
      <div class="team-card__stat"><span>Saldo</span><b>${money(team.balance)}</b></div>
    </div>
  </a>`;
}

export function openMatchResult(match, onDone) {
  const home = store.team(match.homeTeamId);
  const away = store.team(match.awayTeamId);
  if (!home || !away) {
    toast("Asigna ambos clubes antes de registrar el resultado.", "danger");
    return;
  }
  const mvpOptions = [
    { value: "", label: "Sin MVP" },
    ...[...store.teamPlayers(home.id), ...store.teamPlayers(away.id)].map((player) => ({
      value: player.id,
      label: `${player.name} · ${store.team(player.teamId)?.short || ""}`
    }))
  ];
  openModal({
    title: match.settled ? "Editar resultado" : "Registrar resultado",
    eyebrow: `${match.title || `Jornada ${match.matchday}`} · ${fmtDate(match.date)}`,
    size: "md",
    body: `<form data-result-form>
      <div class="form-grid">
        ${field({ label: `${home.name} · goles`, name: "homeScore", type: "number", value: match.homeScore ?? 0, min: 0, max: 99, required: true })}
        ${field({ label: `${away.name} · goles`, name: "awayScore", type: "number", value: match.awayScore ?? 0, min: 0, max: 99, required: true })}
        ${field({ label: "MVP del partido", name: "mvpPlayerId", type: "select", value: match.mvpPlayerId || "", options: mvpOptions, full: true })}
        ${field({ label: "Notas del partido", name: "notes", type: "textarea", value: match.notes || "", full: true, rows: 3, placeholder: "Resumen, incidencias o cartas usadas." })}
      </div>
      <p class="notice" style="margin-top:14px">${icon("info", 16)}<span>Al guardar se actualizan la clasificación, el saldo de ambos clubes, las estadísticas y el Fantasy en tiempo real.</span></p>
      <div class="form-actions">
        <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
        <button class="btn btn--primary" type="submit">Guardar resultado</button>
      </div>
    </form>`,
    onMount(root, close) {
      const form = root.querySelector("[data-result-form]");
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        const values = formValues(form);
        const result = store.recordResult(match.id, values);
        if (!result.ok) {
          toast(result.message, "danger");
          return;
        }
        toast("Resultado guardado. Clasificación y Fantasy actualizados.", "success");
        close();
        onDone?.();
      });
      void setBusy;
      form.querySelector('button[type="submit"]').addEventListener("click", () => button.classList.add("is-loading"));
    }
  });
}

export function openMatchForm(onDone) {
  const teamOptions = store.state.teams.map((team) => ({ value: team.id, label: `${team.name} · Grupo ${team.group}` }));
  openModal({
    title: "Programar partido",
    eyebrow: "Calendario oficial",
    size: "lg",
    body: `<form data-match-form>
      <div class="form-grid">
        ${field({ label: "Fase", name: "phase", type: "select", value: "groups", options: [
          { value: "groups", label: "Fase de grupos" },
          { value: "semifinals", label: "Semifinal" },
          { value: "final", label: "Final" }
        ] })}
        ${field({ label: "Grupo", name: "group", type: "select", value: "A", options: [
          { value: "A", label: "Grupo A" },
          { value: "B", label: "Grupo B" },
          { value: "", label: "Sin grupo" }
        ] })}
        ${field({ label: "Jornada", name: "matchday", type: "number", value: 2, min: 1, max: 20 })}
        ${field({ label: "Título (opcional)", name: "title", value: "", placeholder: "Semifinal 1, Gran Final…" })}
        ${field({ label: "Club local", name: "homeTeamId", type: "select", value: teamOptions[0]?.value, options: teamOptions })}
        ${field({ label: "Club visitante", name: "awayTeamId", type: "select", value: teamOptions[1]?.value, options: teamOptions })}
        ${field({ label: "Fecha", name: "date", type: "date", value: new Date().toISOString().slice(0, 10), required: true })}
        ${field({ label: "Hora", name: "time", type: "time", value: "10:30", required: true })}
        ${field({ label: "Cancha", name: "pitch", value: "Cancha Principal IMEX", full: true })}
        ${field({ label: "Notas", name: "notes", type: "textarea", rows: 2, full: true })}
      </div>
      <div class="form-actions">
        <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
        <button class="btn btn--primary" type="submit">Programar partido</button>
      </div>
    </form>`,
    onMount(root, close) {
      const form = root.querySelector("[data-match-form]");
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = formValues(form);
        store.createMatch(values);
        toast("Partido programado.", "success");
        close();
        onDone?.();
      });
    }
  });
}

export function openPlayerForm(playerId, { limited = false, teamId = "", onSaved = null } = {}) {
  const player = playerId ? store.player(playerId) : null;
  const teams = store.state.teams;
  const teamOptions = teams.map((team) => ({ value: team.id, label: team.name }));
  const positionOptions = [
    { value: "POR", label: "Portero" },
    { value: "DEF", label: "Defensa" },
    { value: "MED", label: "Mediocampista" },
    { value: "DEL", label: "Delantero" }
  ];
  const footOptions = [
    { value: "right", label: "Derecha" },
    { value: "left", label: "Izquierda" },
    { value: "both", label: "Ambas" }
  ];
  const weakOptions = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} / 5` }));
  const editing = Boolean(player);
  const statsFields = limited
    ? ""
    : `${field({ label: "Club", name: "teamId", type: "select", value: player?.teamId || teamId || teams[0]?.id, options: teamOptions })}
       ${field({ label: "Posición", name: "position", type: "select", value: player?.position || "MED", options: positionOptions })}
       ${field({ label: "Dorsal", name: "number", type: "number", value: player?.number ?? 0, min: 0, max: 99 })}
       ${field({ label: "Estatura (cm)", name: "height", type: "number", value: player?.height ?? 175, min: 0, max: 250 })}
       ${field({ label: "Peso (kg)", name: "weight", type: "number", value: player?.weight ?? 70, min: 0, max: 200 })}
       ${field({ label: "Pierna buena", name: "strongFoot", type: "select", value: player?.strongFoot || "right", options: footOptions })}
       ${field({ label: "Media (valoración ficticia 1-5)", name: "weakFoot", type: "select", value: String(player?.weakFoot || 3), options: weakOptions, hint: "Valoración de la pierna no dominante. Es independiente del valor de mercado." })}
       ${field({ label: "Valor de mercado (M)", name: "value", type: "number", value: player?.value ?? 15, min: 0, max: 999 })}
       ${field({ label: "Goles", name: "goals", type: "number", value: player?.goals ?? 0, min: 0, max: 999 })}
       ${field({ label: "Asistencias", name: "assists", type: "number", value: player?.assists ?? 0, min: 0, max: 999 })}
       ${field({ label: "Partidos jugados", name: "played", type: "number", value: player?.played ?? 0, min: 0, max: 99 })}
       ${field({ label: "Amarillas", name: "yellow", type: "number", value: player?.yellow ?? 0, min: 0, max: 99 })}
       ${field({ label: "Rojas", name: "red", type: "number", value: player?.red ?? 0, min: 0, max: 99 })}
       ${field({ label: "Jugador insignia (blindado)", name: "insignia", type: "checkbox", value: Boolean(player?.insignia), full: true })}`;
  openModal({
    title: editing ? "Editar ficha" : "Nuevo jugador",
    eyebrow: limited ? "Foto y presentación" : "Registro de jugadores",
    size: "lg",
    body: `<form data-player-form>
      <div class="form-grid">
        ${imageField({ value: player?.photoUrl || "", label: "Fotografía del jugador", hint: "Se recorta en la tarjeta y en la ficha. Usa una imagen vertical si es posible." })}
        ${field({ label: "Nombre completo", name: "name", value: player?.name || "", required: true, full: true })}
        ${field({ label: "Apodo", name: "nickname", value: player?.nickname || "", placeholder: "El Cuervo, Cometa…" })}
        ${statsFields || field({ label: "Club", name: "teamId", type: "hidden", value: player?.teamId || teamId })}
      </div>
      ${limited ? `<p class="notice" style="margin-top:14px">${icon("info", 16)}<span>Los datos deportivos y el valor de mercado los administra la organización.</span></p>` : ""}
      <div class="form-actions">
        <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
        <button class="btn btn--primary" type="submit">${editing ? "Guardar ficha" : "Crear jugador"}</button>
      </div>
    </form>`,
    onMount(root, close) {
      bindImageFields(root);
      const form = root.querySelector("[data-player-form]");
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = formValues(form);
        if (limited) {
          const result = store.updatePlayer(player.id, {
            name: values.name,
            nickname: values.nickname,
            photoUrl: values.photoUrl || ""
          });
          if (!result.ok) return toast(result.message, "danger");
          toast("Ficha actualizada.", "success");
          close();
          return;
        }
        const payload = {
          name: values.name,
          nickname: values.nickname,
          teamId: values.teamId,
          position: values.position,
          number: Number(values.number),
          value: Number(values.value),
          goals: Number(values.goals),
          assists: Number(values.assists),
          played: Number(values.played),
          yellow: Number(values.yellow),
          red: Number(values.red),
          height: Number(values.height),
          weight: Number(values.weight),
          strongFoot: values.strongFoot,
          weakFoot: Number(values.weakFoot),
          photoUrl: values.photoUrl || "",
          insignia: Boolean(form.querySelector('[name="insignia"]')?.checked),
          status: form.querySelector('[name="insignia"]')?.checked ? "insignia" : "available"
        };
        let saved = null;
        if (editing) {
          const result = store.updatePlayer(player.id, payload);
          if (!result.ok) return toast(result.message, "danger");
          toast("Ficha actualizada.", "success");
          saved = player;
        } else {
          const result = store.createPlayer(payload);
          if (!result.ok) return toast(result.message, "danger");
          toast("Jugador registrado.", "success");
          saved = result.player;
        }
        close();
        onSaved?.(saved);
      });
    }
  });
}

export function openTeamForm(teamId, { onSaved = null } = {}) {
  const team = teamId ? store.team(teamId) : null;
  const markOptions = [
    { value: "wing", label: "Ala" },
    { value: "bolt", label: "Rayo" },
    { value: "ray", label: "Franjas" },
    { value: "flame", label: "Llama" },
    { value: "star", label: "Estrella" },
    { value: "shield", label: "Escudo" },
    { value: "diamond", label: "Diamante" },
    { value: "talon", label: "Garra" }
  ];
  openModal({
    title: team ? "Editar club" : "Nuevo club",
    eyebrow: "Identidad y finanzas",
    size: "lg",
    body: `<form data-team-form>
      <div class="form-grid">
        ${imageField({ name: "crestUrl", label: "Escudo del club", value: team?.crestUrl || "", hint: "Si no subes escudo se usa el emblema generado con tus colores." })}
        ${field({ label: "Nombre del club", name: "name", value: team?.name || "", required: true, full: true })}
        ${field({ label: "Siglas", name: "short", value: team?.short || "", placeholder: "CUE" })}
        ${field({ label: "Presidente", name: "president", value: team?.president || "" })}
        ${field({ label: "Grupo", name: "group", type: "select", value: team?.group || "A", options: [
          { value: "A", label: "Grupo A" },
          { value: "B", label: "Grupo B" }
        ] })}
        ${field({ label: "Saldo (M)", name: "balance", type: "number", value: team?.balance ?? 200, min: 0, max: 9999 })}
        ${field({ label: "Color principal", name: "primary", type: "color", value: team?.primary || "#171717" })}
        ${field({ label: "Color secundario", name: "secondary", type: "color", value: team?.secondary || "#f3f1eb" })}
        ${field({ label: "Emblema", name: "mark", type: "select", value: team?.mark || "shield", options: markOptions })}
      </div>
      <div class="form-actions">
        <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
        <button class="btn btn--primary" type="submit">${team ? "Guardar club" : "Crear club"}</button>
      </div>
    </form>`,
    onMount(root, close) {
      bindImageFields(root);
      const form = root.querySelector("[data-team-form]");
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = formValues(form);
        const payload = {
          name: values.name,
          short: (values.short || values.name.slice(0, 3)).toUpperCase().slice(0, 4),
          president: values.president,
          group: values.group,
          balance: Number(values.balance),
          primary: values.primary,
          secondary: values.secondary,
          mark: values.mark,
          crestUrl: values.crestUrl || ""
        };
        let saved = team;
        if (team) {
          const result = store.updateTeam(team.id, payload);
          if (!result.ok) return toast(result.message, "danger");
          toast("Club actualizado.", "success");
        } else {
          saved = store.createTeam(payload);
          toast("Club creado.", "success");
        }
        close();
        onSaved?.(saved);
      });
    }
  });
}

export function openNewsForm(newsId) {
  const article = newsId ? store.state.news.find((item) => item.id === newsId) : null;
  openModal({
    title: article ? "Editar publicación" : "Nueva publicación",
    eyebrow: "Sala de prensa",
    size: "lg",
    body: `<form data-news-form>
      <div class="form-grid">
        ${field({ label: "Título", name: "title", value: article?.title || "", required: true, full: true })}
        ${field({ label: "Categoría", name: "category", type: "select", value: article?.category || "Torneo", options: ["Torneo", "Mercado", "Fichajes", "Fantasy", "Comunicado"].map((item) => ({ value: item, label: item })) })}
        ${field({ label: "Autor", name: "author", value: article?.author || "IMEX League" })}
        ${field({ label: "Fecha", name: "date", type: "date", value: article?.date || new Date().toISOString().slice(0, 10) })}
        ${field({ label: "Hora", name: "time", type: "time", value: article?.time || "12:00" })}
        ${field({ label: "Entradilla", name: "excerpt", type: "textarea", value: article?.excerpt || "", full: true, rows: 2 })}
        ${field({ label: "Cuerpo de la nota", name: "body", type: "textarea", value: article?.body || "", full: true, rows: 8 })}
        ${field({ label: "Destacar en portada", name: "important", type: "checkbox", value: Boolean(article?.important), full: true })}
      </div>
      <div class="form-actions">
        <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
        <button class="btn btn--primary" type="submit">${article ? "Guardar cambios" : "Publicar"}</button>
      </div>
    </form>`,
    onMount(root, close) {
      const form = root.querySelector("[data-news-form]");
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = formValues(form);
        store.publishNews({
          id: article?.id,
          ...values,
          important: Boolean(form.querySelector('[name="important"]')?.checked)
        });
        toast(article ? "Publicación actualizada." : "Nota publicada.", "success");
        close();
      });
    }
  });
}

export function openNewsArticle(article) {
  const paragraphs = String(article.body || article.excerpt || "").split(/\n+/).filter(Boolean);
  openModal({
    title: article.title,
    eyebrow: `${article.category} · ${fmtDateLong(article.date)}`,
    size: "lg",
    body: `<div class="article-meta"><span>${esc(article.author || "IMEX League")}</span><span>${esc(article.time || "")}</span>${article.important ? statusPill("Destacado", "accent") : ""}</div>
      <div class="article-body">${paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}</div>`,
    footer: `<button class="btn btn--ghost" type="button" data-modal-close>Cerrar</button>`
  });
}

export function playerSummaryRow(player) {
  const team = store.team(player.teamId);
  return `<div class="scorer-row">
    <span class="scorer-row__rank">${esc(initials(player.name))}</span>
    <div class="scorer-row__player"><strong>${esc(player.name)}</strong><span>${esc(team?.name || "")} · ${esc(positionLabel(player.position))}</span></div>
    <span class="scorer-row__value">${number(player.goals)}</span>
    <span class="scorer-row__sub">${number(player.assists)}A</span>
  </div>`;
}

export { store, toast, closeModal, confirmDialog, openModal, formValues, setBusy };
