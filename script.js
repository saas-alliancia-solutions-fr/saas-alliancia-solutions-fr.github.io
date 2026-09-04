(() => {
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  const bookingUrl = window.SAAS_CONFIG?.bookingUrl;

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  if (bookingUrl) {
    document.querySelectorAll(".booking-link").forEach((link) => {
      link.href = bookingUrl;
      if (bookingUrl.startsWith("http")) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    });
  }

  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 12);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    nav?.classList.toggle("open", !open);
  });

  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  }));

  document.querySelectorAll("[data-accordion] button").forEach((button) => {
    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      const panel = button.closest("article")?.querySelector("div");
      button.setAttribute("aria-expanded", String(!expanded));
      if (panel) panel.hidden = expanded;
    });
  });

  const restoreButton = document.querySelector("[data-demo-restore]");
  const feedback = document.querySelector("[data-demo-feedback]");
  restoreButton?.addEventListener("click", () => {
    restoreButton.disabled = true;
    restoreButton.textContent = "Restauration lancée…";
    window.setTimeout(() => {
      restoreButton.textContent = "Fichiers prêts à être récupérés ✓";
      restoreButton.classList.add("success");
      if (feedback) feedback.textContent = "Simulation réussie — vos restaurations réelles restent disponibles 24h/24.";
    }, 700);
  });

  const selectedPlan = document.querySelector("[data-selected-plan]");
  document.querySelectorAll("[data-plan]").forEach((link) => {
    link.addEventListener("click", () => {
      const plan = link.dataset.plan;
      if (selectedPlan) selectedPlan.textContent = `Formule envisagée : ${plan}`;
    });
  });
})();
