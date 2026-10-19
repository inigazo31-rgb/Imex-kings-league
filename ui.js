import { esc, icon } from "./utils.js";

let activeModal = null;
let lastFocus = null;

export function toast(message, tone = "ink", title = "") {
  const root = document.getElementById("toastRoot");
  if (!root) return;
  const node = document.createElement("div");
  node.className = `toast toast--${tone}`;
  node.innerHTML = `<span class="toast__dot" aria-hidden="true"></span><div><strong>${esc(title || (tone === "danger" ? "No se pudo completar" : "Listo"))}</strong><p>${esc(message)}</p></div><button class="toast__close" type="button" aria-label="Cerrar aviso">${icon("close", 14)}</button>`;
  const remove = () => {
    node.classList.add("is-out");
    setTimeout(() => node.remove(), 220);
  };
  node.querySelector(".toast__close").addEventListener("click", remove);
  root.appendChild(node);
  setTimeout(remove, 4600);
}

export function closeModal() {
  if (!activeModal) return;
  const { backdrop, onClose } = activeModal;
  backdrop.classList.add("is-out");
  document.body.classList.remove("modal-open");
  setTimeout(() => backdrop.remove(), 180);
  if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  activeModal = null;
  if (typeof onClose === "function") onClose();
}

export function openModal({ title, eyebrow = "", body = "", footer = "", size = "md", onMount, onClose }) {
  closeModal();
  lastFocus = document.activeElement;
  const root = document.getElementById("modalRoot");
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal modal--${size}" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <header class="modal__head">
        <div>
          ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
          <h2 id="modalTitle">${esc(title)}</h2>
        </div>
        <button class="icon-btn" type="button" data-modal-close aria-label="Cerrar">${icon("close", 18)}</button>
      </header>
      <div class="modal__body">${body}</div>
      ${footer ? `<footer class="modal__foot">${footer}</footer>` : ""}
    </div>`;
  root.appendChild(backdrop);
  document.body.classList.add("modal-open");
  activeModal = { backdrop, onClose };
  backdrop.querySelectorAll("[data-modal-close]").forEach((button) => button.addEventListener("click", closeModal));
  backdrop.addEventListener("mousedown", (event) => {
    if (event.target === backdrop) closeModal();
  });
  const onKey = (event) => {
    if (!activeModal || activeModal.backdrop !== backdrop) {
      document.removeEventListener("keydown", onKey);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    }
    if (event.key === "Tab") {
      const focusable = backdrop.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };
  document.addEventListener("keydown", onKey);
  requestAnimationFrame(() => {
    const target = backdrop.querySelector("[autofocus]") || backdrop.querySelector("input,select,textarea,button");
    if (target) target.focus({ preventScroll: true });
  });
  if (typeof onMount === "function") onMount(backdrop, closeModal);
  return closeModal;
}

export function confirmDialog({ title, message, confirmLabel = "Confirmar", tone = "ink", onConfirm }) {
  openModal({
    title,
    eyebrow: "Confirmación",
    size: "sm",
    body: `<p class="modal-copy">${esc(message)}</p>`,
    footer: `<button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button><button class="btn btn--${tone}" type="button" data-confirm>${esc(confirmLabel)}</button>`,
    onMount(root, close) {
      const button = root.querySelector("[data-confirm]");
      button.addEventListener("click", async () => {
        button.disabled = true;
        button.classList.add("is-loading");
        try {
          await onConfirm?.();
          close();
        } catch (error) {
          toast(error.message || "No se pudo completar la acción.", "danger");
          button.disabled = false;
          button.classList.remove("is-loading");
        }
      });
    }
  });
}

export function openSheet({ title, body }) {
  const root = document.getElementById("sheetRoot");
  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="sheet__head"><p class="eyebrow">${esc(title)}</p><button class="icon-btn" type="button" data-sheet-close aria-label="Cerrar">${icon("close", 18)}</button></div>
    <div class="sheet__body">${body}</div>
  </div>`;
  root.appendChild(backdrop);
  document.body.classList.add("modal-open");
  const close = () => {
    backdrop.classList.add("is-out");
    document.body.classList.remove("modal-open");
    setTimeout(() => backdrop.remove(), 180);
  };
  backdrop.querySelectorAll("[data-sheet-close]").forEach((button) => button.addEventListener("click", close));
  backdrop.addEventListener("mousedown", (event) => {
    if (event.target === backdrop) close();
  });
  return close;
}

export function formValues(form) {
  const values = {};
  for (const [key, value] of new FormData(form).entries()) {
    values[key] = typeof value === "string" ? value.trim() : value;
  }
  return values;
}

export function setBusy(button, busy, label = "Guardando…") {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.textContent;
    button.textContent = label;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.label || button.textContent;
    button.disabled = false;
  }
}

export function pageHead({ eyebrow, title, copy, action = "" }) {
  return `<header class="page-head" data-od-id="page-head">
    <div>
      ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
      <h1>${esc(title)}</h1>
      ${copy ? `<p class="page-head__copy">${esc(copy)}</p>` : ""}
    </div>
    ${action ? `<div class="page-head__action">${action}</div>` : ""}
  </header>`;
}

export function sectionHead({ eyebrow, title, copy = "", action = "" }) {
  return `<div class="section-head">
    <div>
      ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
      <h2>${esc(title)}</h2>
      ${copy ? `<p>${esc(copy)}</p>` : ""}
    </div>
    ${action ? `<div class="section-head__action">${action}</div>` : ""}
  </div>`;
}
