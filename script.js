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

  const enhanceSelect = (select) => {
    const options = [...select.options];
    const required = select.required;
    const fieldLabel = select.parentElement?.querySelector(".field-label");
    const wrapper = document.createElement("div");
    const button = document.createElement("button");
    const list = document.createElement("ul");
    const listId = `${select.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-options`;
    let activeIndex = Math.max(select.selectedIndex, 0);

    wrapper.className = "custom-select";
    button.type = "button";
    button.className = "custom-select-button";
    button.setAttribute("role", "combobox");
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", listId);
    if (fieldLabel) {
      fieldLabel.id ||= `${listId}-label`;
      button.setAttribute("aria-labelledby", fieldLabel.id);
    }
    if (required) button.setAttribute("aria-required", "true");
    list.id = listId;
    list.className = "custom-select-list";
    list.setAttribute("role", "listbox");
    list.hidden = true;

    const optionNodes = options.map((option, index) => {
      const item = document.createElement("li");
      item.className = "custom-select-option";
      item.textContent = option.textContent;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(option.selected));
      item.dataset.value = option.value;
      item.addEventListener("mousedown", (event) => event.preventDefault());
      item.addEventListener("click", () => choose(index));
      list.append(item);
      return item;
    });

    const render = () => {
      const selected = options[select.selectedIndex] || options[0];
      button.textContent = selected.textContent;
      button.classList.toggle("is-placeholder", !selected.value);
      button.classList.toggle("is-invalid", required && !selected.value && select.dataset.touched === "true");
      optionNodes.forEach((item, index) => {
        item.setAttribute("aria-selected", String(index === select.selectedIndex));
        item.classList.toggle("is-active", index === activeIndex);
      });
    };
    const close = () => {
      wrapper.classList.remove("open");
      button.setAttribute("aria-expanded", "false");
      list.hidden = true;
    };
    const open = () => {
      wrapper.classList.add("open");
      button.setAttribute("aria-expanded", "true");
      list.hidden = false;
      activeIndex = Math.max(select.selectedIndex, 0);
      render();
    };
    const choose = (index) => {
      select.selectedIndex = index;
      select.dataset.touched = "true";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      activeIndex = index;
      render();
      close();
      button.focus();
    };

    select.classList.add("custom-select-native");
    select.required = false;
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    select.after(wrapper);
    wrapper.append(select, button, list);
    render();

    button.addEventListener("click", () => list.hidden ? open() : close());
    button.addEventListener("keydown", (event) => {
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        if (list.hidden) open();
        if (event.key === "ArrowDown") activeIndex = Math.min(activeIndex + 1, options.length - 1);
        if (event.key === "ArrowUp") activeIndex = Math.max(activeIndex - 1, 0);
        if (event.key === "Home") activeIndex = 0;
        if (event.key === "End") activeIndex = options.length - 1;
        render();
        optionNodes[activeIndex]?.scrollIntoView({ block: "nearest" });
      } else if (["Enter", " "].includes(event.key)) {
        event.preventDefault();
        if (list.hidden) open(); else choose(activeIndex);
      } else if (event.key === "Escape") {
        close();
      } else if (event.key === "Tab") {
        close();
      }
    });
    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) close();
    });
    select.form?.addEventListener("submit", (event) => {
      if (required && !select.value) {
        event.preventDefault();
        select.dataset.touched = "true";
        render();
        button.focus();
      }
    });
  };

  document.querySelectorAll("[data-custom-select]").forEach(enhanceSelect);

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
        saving.textContent = period === "monthly" ? "Disponible après un an de service" : saving.dataset.annualLabel;
      });
      pricingTable?.setAttribute("aria-label", period === "monthly" ? "Tarifs mensuels SAAS disponibles après douze mois de service" : "Tarifs annuels SAAS");
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
  const requestedReason = new URLSearchParams(window.location.search).get("objet");
  if (contactReason && requestedReason && [...contactReason.options].some((option) => option.value === requestedReason)) {
    contactReason.value = requestedReason;
  }
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
