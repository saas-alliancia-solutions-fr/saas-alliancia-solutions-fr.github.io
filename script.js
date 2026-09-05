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

  const billingButtons = document.querySelectorAll("[data-billing]");
  const pricingTable = document.querySelector(".pricing-table");
  billingButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const period = button.dataset.billing;
      billingButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      document.querySelectorAll("[data-annual][data-monthly]").forEach((price) => {
        price.textContent = price.dataset[period];
      });
      pricingTable?.classList.toggle("monthly", period === "monthly");
      document.querySelectorAll("[data-saving]").forEach((saving) => {
        if (!saving.dataset.annualLabel) saving.dataset.annualLabel = saving.textContent;
        saving.textContent = period === "monthly" ? "Sans engagement annuel" : saving.dataset.annualLabel;
      });
      pricingTable?.setAttribute("aria-label", period === "monthly" ? "Tarifs mensuels SAAS" : "Tarifs annuels SAAS");
    });
  });

  const platformTabs = [...document.querySelectorAll("[data-platform-tab]")];
  const platformPanels = [...document.querySelectorAll("[data-platform-panel]")];
  const activatePlatform = (platform) => {
    platformTabs.forEach((tab) => {
      const active = tab.dataset.platformTab === platform;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    platformPanels.forEach((panel) => {
      panel.hidden = panel.dataset.platformPanel !== platform;
    });
  };
  platformTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activatePlatform(tab.dataset.platformTab));
    tab.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const offset = event.key === 'ArrowRight' ? 1 : -1;
      const next = platformTabs[(index + offset + platformTabs.length) % platformTabs.length];
      activatePlatform(next.dataset.platformTab);
      next.focus();
    });
  });

  document.querySelectorAll("[data-copy-command]").forEach((button) => {
    button.addEventListener("click", async () => {
      const command = button.closest("div")?.querySelector("code")?.textContent;
      if (!command) return;
      try {
        await navigator.clipboard.writeText(command);
        button.textContent = "Copié ✓";
        window.setTimeout(() => { button.textContent = "Copier"; }, 1600);
      } catch {
        button.textContent = "Sélectionnez la commande";
      }
    });
  });

  const contactReason = document.querySelector("[data-contact-reason-select]");
  document.querySelectorAll("[data-contact-reason]").forEach((link) => {
    link.addEventListener("click", () => {
      if (contactReason) contactReason.value = link.dataset.contactReason;
    });
  });

  const quoteDialog = document.querySelector("[data-quote-dialog]");
  let quoteOpener;
  document.querySelectorAll("[data-quote-open]").forEach((button) => {
    button.addEventListener("click", () => {
      quoteOpener = button;
      if (quoteDialog?.showModal) quoteDialog.showModal();
    });
  });
  document.querySelector("[data-quote-close]")?.addEventListener("click", () => quoteDialog?.close());
  quoteDialog?.addEventListener("click", (event) => {
    if (event.target === quoteDialog) quoteDialog.close();
  });
  quoteDialog?.addEventListener("close", () => quoteOpener?.focus());
})();
