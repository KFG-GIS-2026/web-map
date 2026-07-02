// ============================================================
// help.js - Intro/help modal
// ============================================================

function initHelpModal() {
  const modal = document.getElementById("help-modal");
  const dialog = modal?.querySelector(".help-dialog");
  const openBtn = document.getElementById("help-open");
  const closeBtn = document.getElementById("help-close");
  const startBtn = document.getElementById("help-start");
  const backdrop = modal?.querySelector("[data-help-close]");
  let lastFocusedElement = null;

  if (!modal || !dialog || !openBtn || !closeBtn || !startBtn || !backdrop) return;

  function openHelpModal() {
    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("is-open");
    dialog.scrollTop = 0;
    const body = dialog.querySelector(".help-body");
    if (body) body.scrollTop = 0;
    requestAnimationFrame(() => {
      dialog.scrollTop = 0;
      if (body) body.scrollTop = 0;
    });
    dialog.focus();
  }

  function closeHelpModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modal.hidden = true;
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  openBtn.addEventListener("click", openHelpModal);
  closeBtn.addEventListener("click", closeHelpModal);
  startBtn.addEventListener("click", closeHelpModal);
  backdrop.addEventListener("click", closeHelpModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeHelpModal();
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("skipIntro") !== "1") {
    window.setTimeout(openHelpModal, 200);
  }
}

document.addEventListener("DOMContentLoaded", initHelpModal);
