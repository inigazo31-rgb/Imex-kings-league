const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function initials(name = "") {
  const parts = String(name).replaceAll("'", "").replaceAll("’", "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "IL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function money(value) {
  const n = Number(value) || 0;
  return `$${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(n)} M`;
}

export function number(value) {
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function fmtDate(value) {
  const date = parseDate(value);
  if (!date) return "Por confirmar";
  return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function fmtDateLong(value) {
  const date = parseDate(value);
  if (!date) return "Por confirmar";
  return `${DAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

export function fmtDateShort(value) {
  const date = parseDate(value);
  if (!date) return "TBD";
  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS[date.getMonth()].toUpperCase()}`;
}

export function fmtTime(value) {
  return value || "—";
}

export function relativeTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `Hace ${days} d`;
  return fmtDate(iso.slice(0, 10));
}

export function countdown(target) {
  const end = new Date(target).getTime();
  if (Number.isNaN(end)) return "—";
  const diff = end - Date.now();
  if (diff <= 0) return "Cerrado";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  if (days > 0) return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function positionLabel(position) {
  return { POR: "Portero", DEF: "Defensa", MED: "Mediocampista", DEL: "Delantero" }[position] || position;
}

export function positionShort(position) {
  return { POR: "POR", DEF: "DEF", MED: "MED", DEL: "DEL" }[position] || position;
}

export function roleLabel(role) {
  return { ADMIN: "Organizador", PRESIDENT: "Presidente", PLAYER: "Jugador", FAN: "Aficionado" }[role] || "Aficionado";
}

export function roleTone(role) {
  return { ADMIN: "ink", PRESIDENT: "accent", PLAYER: "success", FAN: "muted" }[role] || "muted";
}

export function safeImage(url) {
  if (!url) return "";
  const value = String(url).trim();
  if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value)) return value;
  if (/^assets\/[a-z0-9._/-]+$/i.test(value)) return value;
  return "";
}

export function imageFromFile(file, maxSize = 640, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!file || !allowed.includes(file.type)) {
      reject(new Error("Usa una imagen PNG, JPG o WebP."));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error("La imagen supera los 12 MB. Elige una más ligera."));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * ratio));
        const height = Math.max(1, Math.round(image.height * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        if (file.type === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(image, 0, 0, width, height);
        const data = canvas.toDataURL("image/webp", quality);
        URL.revokeObjectURL(objectUrl);
        if (!data.startsWith("data:image/webp")) {
          resolve(canvas.toDataURL("image/jpeg", quality));
          return;
        }
        resolve(data);
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen."));
    };
    image.src = objectUrl;
  });
}

export function download(filename, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function debounce(fn, wait = 180) {
  let timer = 0;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function byPoints(a, b) {
  return b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name, "es");
}

export const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 9v11M15 9v11"/>',
  shield: '<path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"/><path d="M9 12l2 2 4-4"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="7" r="2.5"/><path d="M17 13c2.2 0 4 1.8 4 4"/>',
  transfer: '<path d="M4 7h13l-3-3M20 17H7l3 3"/><path d="M4 7l4 4M20 17l-4-4"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"/>',
  news: '<path d="M4 5h12v15H5a1 1 0 0 1-1-1V5Z"/><path d="M16 8h4v10a2 2 0 0 1-2 2h-2V8Z"/><path d="M7 9h6M7 13h6M7 17h4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z"/><path d="M8 3v18M12 8h4M12 12h4"/>',
  bracket: '<path d="M4 5h5v5H4zM15 3h5v5h-5zM15 16h5v5h-5z"/><path d="M9 7h3v11h3M12 12h3"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 8l-4 4 4 4M6 12h9"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v5M8 21h8"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  sync: '<path d="M20 7h-6V1"/><path d="M20 7a8 8 0 0 0-14-3L3 7"/><path d="M4 17h6v6"/><path d="M4 17a8 8 0 0 0 14 3l3-3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 6.3A9.8 9.8 0 0 1 12 6c6.5 0 10 6 10 6a15 15 0 0 1-2.2 2.7M6.6 6.7A16 16 0 0 0 2 12s3.5 6 10 6a9.7 9.7 0 0 0 4.2-.9"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
  camera: '<path d="M4 7h3l2-3h6l2 3h3v13H4V7Z"/><circle cx="12" cy="13" r="4"/>',
  bolt: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-4-7 0 3-2 4-3 4 0-3-2-6-4-8 0 4-3 6-3 11 0 4 3 7 7 7Z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  activity: '<path d="M3 12h4l2-7 4 14 2-7h6"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h4M7 13h8"/>',
  whistle: '<path d="M4 12a6 6 0 0 1 12 0h3l2 4h-5"/><path d="M4 12v3a3 3 0 0 0 3 3h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  alert: '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 18h.01"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
};

export function icon(name, size = 18, className = "") {
  const path = ICONS[name] || ICONS.info;
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

const TEAM_MARKS = {
  wing: '<path d="M19 15c-4.5-.3-8.5-2.4-11-6 4 .3 8 2.4 11 6Z" fill="currentColor"/><path d="M22 20c-5.5-.4-10.4-2.9-14-7.3 5 .3 10.2 2.8 14 7.3Z" fill="currentColor" opacity=".55"/>',
  bolt: '<path d="M26 9 14 25h6l-2 10 12-16h-6l2-10Z" fill="currentColor"/>',
  ray: '<path d="M12 36 24 8h7L19 36h-7Z" fill="currentColor"/><path d="M25 36 37 8h6L31 36h-6Z" fill="currentColor" opacity=".5"/>',
  flame: '<path d="M24 38c-7 0-12-4.8-12-11.5 0-5 3.4-8.8 7-12.5-.2 4.7 2.2 6.5 4.2 6.5-.3-5.5 1.8-10.5 6.8-14.5-.5 7 6 9.8 6 20.5C36 33.2 31 38 24 38Z" fill="currentColor"/>',
  star: '<path d="m24 7 4.8 10.2 11.2 1.6-8.1 7.9 1.9 11.1L24 32.5l-10 5.3 2-11.1-8.2-7.9 11.3-1.6L24 7Z" fill="currentColor"/>',
  shield: '<path d="M24 6 38 11v10c0 7-5.7 11.8-14 15-8.3-3.2-14-8-14-15V11l14-5Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M24 14v14M17 21h14" stroke="currentColor" stroke-width="3"/>',
  diamond: '<path d="m24 6 12 12-12 12L12 18 24 6Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="m24 13 6 5-6 6-6-6 6-5Z" fill="currentColor"/>',
  talon: '<path d="M24 9 38 17l-5 3 5 3-14 8-14-8 5-3-5-3 14-8Z" fill="currentColor"/>'
};

export function leagueMark(size = 34, tone = "ink") {
  const colors = tone === "lime" ? ["#c9f24a", "#0c0f0d"] : tone === "bone" ? ["#f3f1eb", "#0c0f0d"] : ["#0c0f0d", "#f3f1eb"];
  return `<svg class="league-mark" width="${size}" height="${size}" viewBox="0 0 48 48" role="img" aria-label="IMEX League"><path d="M24 3 43 10v14c0 10-8 17-19 21C13 41 5 34 5 24V10L24 3Z" fill="${colors[0]}"/><path d="M15 31V17h4.4L24 25l4.6-8H33v14h-4.2v-7.4L24 31l-4.8-7.4V31H15Z" fill="${colors[1]}"/></svg>`;
}

export function teamCrest(team, size = 52, opts = {}) {
  if (!team) return "";
  const uploaded = safeImage(team.crestUrl);
  if (uploaded) {
    return `<span class="crest crest--uploaded" style="--crest-size:${size}px"><img src="${esc(uploaded)}" alt="Escudo de ${esc(team.name)}" width="${size}" height="${size}" loading="lazy" /></span>`;
  }
  const primary = team.primary || "#171717";
  const secondary = team.secondary || "#f3f1eb";
  const inverse = opts.onDark ? "#0c0f0d" : secondary;
  return `<svg class="crest" width="${size}" height="${size}" viewBox="0 0 48 56" role="img" aria-label="Escudo de ${esc(team.name)}">
    <path d="M24 2 44 8v16c0 12-8.5 21-20 30C12 45 4 36 4 24V8L24 2Z" fill="${primary}" stroke="rgba(243,241,235,.24)" stroke-width="1"/>
    <path d="M24 7 39 11.2v12.6c0 9.6-6.4 17.4-15 25C15.4 41.2 9 33.4 9 23.8V11.2L24 7Z" fill="none" stroke="${secondary}" stroke-width=".8" opacity=".45"/>
    <g transform="translate(0 2)" color="${inverse}">${TEAM_MARKS[team.mark] || TEAM_MARKS.shield}</g>
    <text x="24" y="50" text-anchor="middle" fill="${secondary}" font-family="Archivo, sans-serif" font-size="6.4" font-weight="800" letter-spacing=".7">${esc(team.short)}</text>
  </svg>`;
}

export function playerPortrait(player, team, size = "md") {
  const photo = safeImage(player?.photoUrl);
  if (photo) {
    return `<img class="portrait portrait--${size}" src="${esc(photo)}" alt="Retrato de ${esc(player.name)}" loading="lazy" />`;
  }
  return `<div class="portrait portrait--${size} portrait--empty" style="--team:${esc(team?.primary || "#171717")};--team-2:${esc(team?.secondary || "#f3f1eb")}" aria-label="Foto pendiente de ${esc(player?.name || "jugador")}">
    <span>${esc(initials(player?.name || ""))}</span>
  </div>`;
}

export function statusPill(label, tone = "muted") {
  return `<span class="pill pill--${tone}">${esc(label)}</span>`;
}

export function emptyState(title, copy, action = "") {
  return `<div class="empty-state">${leagueMark(30, "ink")}<h3>${esc(title)}</h3><p>${esc(copy)}</p>${action}</div>`;
}
