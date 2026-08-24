
(() => {
  const loader = document.getElementById("loader");
  const viewport = document.getElementById("viewport");
  const scene = document.getElementById("scene");
  const toast = document.getElementById("toast");
  const modal = document.getElementById("modal");
  const modalContent = document.getElementById("modalContent");
  const closeModal = document.getElementById("closeModal");
  const zoomIn = document.getElementById("zoomIn");
  const zoomOut = document.getElementById("zoomOut");
  const resetView = document.getElementById("resetView");

  const state = {
    x: 0,
    y: 0,
    scale: 1,
    dragging: false,
    startX: 0,
    startY: 0,
    startSceneX: 0,
    startSceneY: 0,
  };

  function render() {
    scene.style.transform =
      `translate(-50%, -50%) translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
  }

  function clampScale(value) {
    return Math.max(0.85, Math.min(2.2, value));
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1600);
  }

  function openModal(title, html) {
    modalContent.innerHTML = `<h2>${title}</h2>${html}`;
    modal.showModal();
  }

  window.addEventListener("load", () => {
    setTimeout(() => loader.classList.add("hidden"), 1700);
    render();
  });

  viewport.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".hotspot")) return;
    state.dragging = true;
    viewport.classList.add("dragging");
    viewport.setPointerCapture(e.pointerId);
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.startSceneX = state.x;
    state.startSceneY = state.y;
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!state.dragging) return;
    state.x = state.startSceneX + (e.clientX - state.startX);
    state.y = state.startSceneY + (e.clientY - state.startY);
    render();
  });

  viewport.addEventListener("pointerup", () => {
    state.dragging = false;
    viewport.classList.remove("dragging");
  });

  viewport.addEventListener("pointercancel", () => {
    state.dragging = false;
    viewport.classList.remove("dragging");
  });

  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    state.scale = clampScale(state.scale + delta);
    render();
  }, { passive: false });

  zoomIn.addEventListener("click", () => {
    state.scale = clampScale(state.scale + 0.12);
    render();
  });

  zoomOut.addEventListener("click", () => {
    state.scale = clampScale(state.scale - 0.12);
    render();
  });

  resetView.addEventListener("click", () => {
    state.x = 0;
    state.y = 0;
    state.scale = 1;
    render();
  });

  closeModal.addEventListener("click", () => modal.close());

  document.querySelectorAll(".hotspot").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;

      if (action === "message") {
        openModal("Message Board", `
          <p>Visitors can pin notes here, and you can reply with another little paper beneath the original note.</p>
          <div class="note-wall">
            <div class="note">I love your island 🌼</div>
            <div class="note">The perfume garden is beautiful!</div>
            <div class="note">Your research is so interesting ✨</div>
          </div>
        `);
      }

      if (action === "gacha") {
        const prizes = [
          "🌷 Botanical card: Jasmine",
          "🫧 A visitor artwork bubble",
          "📄 Tiny research doodle",
          "🍋 Perfume note: Bergamot",
          "🎟️ Secret Game Island token"
        ];
        const prize = prizes[Math.floor(Math.random() * prizes.length)];
        showToast(`You got: ${prize}`);
      }

      if (action === "horse") {
        showToast("The rocking horse goes creak… creak… 🎠");
      }

      if (action === "academic") {
        openModal("Academic Island", "<p>Research Cottage · Today's Papers · Curriculum Vitae · Research desk.</p>");
      }

      if (action === "perfume") {
        openModal("Perfume Garden", "<p>Explore flowers, taxonomy, habitat, flower meanings, scent profiles, and perfumery uses.</p>");
      }

      if (action === "art") {
        openModal("Art Island", "<p>Color, draw, hang your artwork on the wall, or send it into the world inside a bubble.</p>");
      }

      if (action === "game") {
        openModal("Game Island", "<p>A playful island for mini games, toys, strange buttons, small puzzles, and unexpected interactions.</p>");
      }
    });
  });
})();
