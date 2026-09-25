(() => {
  const menuButton = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  const bookingUrl = window.SAAS_CONFIG?.bookingUrl;

  if (bookingUrl) {
    document.querySelectorAll(".booking-link").forEach((link) => {
      link.href = bookingUrl;
      if (bookingUrl.startsWith("http")) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    });
  }

  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    nav?.classList.toggle("open", !open);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !nav?.classList.contains("open")) return;
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.focus();
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
    select.addEventListener("change", render);
  };

  const contactReason = document.querySelector("[data-contact-reason-select]");
  const contactParams = new URLSearchParams(window.location.search);
  const requestedReason = contactParams.get("objet");
  if (contactReason && requestedReason && [...contactReason.options].some((option) => option.value === requestedReason)) {
    contactReason.value = requestedReason;
  }
  const contactPlan = document.querySelector("[data-contact-plan]");
  const contactPlanSummary = document.querySelector("[data-contact-plan-summary]");
  const contactPlanLabel = document.querySelector("[data-contact-plan-label]");
  const requestedPlan = contactParams.get("formule");
  if (requestedPlan) {
    if (contactPlan) contactPlan.value = requestedPlan;
    if (contactPlanSummary && contactPlanLabel) {
      contactPlanLabel.textContent = requestedPlan;
      contactPlanSummary.hidden = false;
    }
  }

  const contactForm = document.querySelector("[data-contact-form]");
  if (contactForm && window.location.hash === "#formulaire") {
    window.addEventListener("load", async () => {
      await document.fonts?.ready;
      window.requestAnimationFrame(() => contactForm.scrollIntoView({ block: "start" }));
    }, { once: true });
  }

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
  const loyaltyDiscounts = [0, 0.025, 0.05, 0.075, 0.1, 0.125, 0.15, 0.175, 0.2];
  const priceFormatter = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const renderPricingTrend = (target, period) => {
    const basePrice = Number(target.dataset[`${period}Base`]);
    if (!Number.isFinite(basePrice)) return;

    const unit = period === "annual" ? "€/an" : "€/mois";
    const prices = loyaltyDiscounts.map((discount) => Math.round(((basePrice * (1 - discount)) + 1e-9) * 100) / 100);
    const plottedYears = period === "monthly" ? prices.map((_, index) => index).slice(1) : prices.map((_, index) => index);
    const pointX = (position) => 18 + (position * (324 / (plottedYears.length - 1)));
    const points = plottedYears.map((yearIndex, position) => `${pointX(position)},${4 + (position * (16 / (plottedYears.length - 1)))}`).join(" ");
    const description = plottedYears.map((yearIndex) => `année ${yearIndex + 1} : ${priceFormatter.format(prices[yearIndex])} ${unit}`).join(", ");
    const circles = plottedYears.map((yearIndex, position) => `<circle cx="${pointX(position)}" cy="${4 + (position * (16 / (plottedYears.length - 1)))}" r="${position === 0 || position === plottedYears.length - 1 ? 2.6 : 1.8}" fill="${position === 0 || position === plottedYears.length - 1 ? "#16855f" : "#ffffff"}" stroke="#16855f" stroke-width="1.25"><title>Année ${yearIndex + 1} : ${priceFormatter.format(prices[yearIndex])} ${unit}</title></circle>`).join("");
    const visibleYears = [1, 4, 8];
    const values = visibleYears.map((index) => {
      const plottedPosition = plottedYears.indexOf(index);
      const left = (pointX(plottedPosition) / 360) * 100;
      return `<span style="left:${left}%"><small>A${index + 1}</small><strong>${priceFormatter.format(prices[index])}</strong></span>`;
    }).join("");

    target.innerHTML = `<span class="price-trend" role="img" aria-label="Évolution du tarif fidélité ${target.dataset.planLabel} : ${description}"><svg viewBox="0 0 360 24" aria-hidden="true" focusable="false"><polyline points="${points}" fill="none" stroke="#32b47d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />${circles}</svg><span class="price-trend-values">${values}</span></span>`;
  };

  document.querySelectorAll("[data-saving]").forEach((saving) => renderPricingTrend(saving, "annual"));
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
        renderPricingTrend(saving, period);
      });
      document.querySelectorAll("[data-annual-loyalty]").forEach((loyalty) => {
        loyalty.hidden = period === "monthly";
      });
      const advantageHeader = document.querySelector("[data-advantage-header]");
      if (advantageHeader) advantageHeader.textContent = period === "monthly" ? "Votre tarif fidélité (€ HT/mois)" : "Votre tarif fidélité (€ HT/an)";
      pricingTable?.setAttribute("aria-label", period === "monthly" ? "Tarifs mensuels SAAS disponibles dès la deuxième année" : "Tarifs annuels SAAS");
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

  document.querySelectorAll("[data-contact-reason]").forEach((link) => {
    link.addEventListener("click", () => {
      if (contactReason) {
        contactReason.value = link.dataset.contactReason;
        contactReason.dispatchEvent(new Event("change", { bubbles: true }));
      }
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
