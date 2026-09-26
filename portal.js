(() => {
  const config = window.SAAS_CONFIG || {};
  const configured = Boolean(config.supabaseUrl && config.supabasePublishableKey && window.supabase?.createClient);
  const client = configured ? window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey) : null;
  const isLocalDemo = location.hostname === "127.0.0.1" && new URLSearchParams(location.search).get("demo") === "1";
  const requestedPortalView = new URLSearchParams(location.search).get("next");
  const authLinkType = new URLSearchParams(location.hash.slice(1)).get("type");
  const needsPasswordSetup = ["invite", "recovery"].includes(authLinkType) || new URLSearchParams(location.search).get("reset") === "1";

  const openAuthorizedSpace = async (session) => {
    if (!session?.user || !client) return;
    const { data: administrator } = await client.from("app_admins").select("role").eq("user_id", session.user.id).eq("active", true).maybeSingle();
    location.replace(administrator ? "/administration.html" : requestedPortalView === "downloads" ? "/portail.html#downloads" : "/portail.html");
  };

  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[character]));
  const formatDate = (value, withTime = false) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("fr-FR", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
  };
  const formatBytes = (value) => {
    const bytes = Number(value || 0);
    if (!bytes) return "0 Go";
    const units = ["o", "Ko", "Mo", "Go", "To"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(bytes / (1024 ** index))} ${units[index]}`;
  };
  const relativeBackup = (value) => {
    if (!value) return "Non renseignée";
    const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (minutes < 1440) return `Il y a ${Math.round(minutes / 60)} h`;
    return formatDate(value, true);
  };

  const loginForm = document.querySelector("[data-login-form]");
  if (loginForm) {
    const setupNotice = document.querySelector("[data-auth-setup]");
    const submit = loginForm.querySelector("[type='submit']");
    const feedback = document.querySelector("[data-auth-feedback]");
    const resetForm = document.querySelector("[data-reset-form]");
    const resetFeedback = document.querySelector("[data-reset-feedback]");
    const updatePasswordForm = document.querySelector("[data-update-password-form]");
    const updatePasswordFeedback = document.querySelector("[data-update-password-feedback]");

    const showPasswordSetup = () => {
      loginForm.hidden = true;
      resetForm.hidden = true;
      updatePasswordForm.hidden = false;
      updatePasswordForm.elements.password.focus();
    };

    if (!configured) {
      setupNotice.hidden = false;
      submit.disabled = true;
    } else {
      client.auth.getSession().then(({ data }) => {
        if (data.session && needsPasswordSetup) showPasswordSetup();
        else if (data.session) openAuthorizedSpace(data.session);
      });
      client.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && needsPasswordSetup)) showPasswordSetup();
      });
    }

    document.querySelector("[data-password-toggle]")?.addEventListener("click", (event) => {
      const input = loginForm.elements.password;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      event.currentTarget.textContent = show ? "Masquer" : "Afficher";
      event.currentTarget.setAttribute("aria-label", show ? "Masquer le mot de passe" : "Afficher le mot de passe");
    });
    document.querySelector("[data-forgot-password]")?.addEventListener("click", () => {
      loginForm.hidden = true;
      resetForm.hidden = false;
      resetForm.elements.email.value = loginForm.elements.email.value;
      resetForm.elements.email.focus();
    });
    document.querySelector("[data-back-login]")?.addEventListener("click", () => {
      resetForm.hidden = true;
      loginForm.hidden = false;
      loginForm.elements.email.focus();
    });
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!client) return;
      submit.disabled = true;
      feedback.classList.remove("success");
      feedback.textContent = "Vérification de vos accès…";
      const { data, error } = await client.auth.signInWithPassword({
        email: loginForm.elements.email.value.trim(),
        password: loginForm.elements.password.value
      });
      if (error) {
        feedback.textContent = "Adresse e-mail ou mot de passe incorrect.";
        submit.disabled = false;
        return;
      }
      feedback.classList.add("success");
      feedback.textContent = "Connexion réussie. Ouverture de votre espace…";
      openAuthorizedSpace(data.session);
    });
    resetForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!client) return;
      const resetSubmit = resetForm.querySelector("[type='submit']");
      resetSubmit.disabled = true;
      const { error } = await client.auth.resetPasswordForEmail(resetForm.elements.email.value.trim(), {
        redirectTo: `${location.origin}/connexion.html?reset=1`
      });
      resetFeedback.textContent = error ? "Le lien n’a pas pu être envoyé. Réessayez dans quelques instants." : "Si cette adresse correspond à un compte, un lien sécurisé vient d’être envoyé.";
      resetFeedback.classList.toggle("success", !error);
      resetSubmit.disabled = false;
    });
    updatePasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const password = updatePasswordForm.elements.password.value;
      const confirmation = updatePasswordForm.elements.confirmation.value;
      if (password !== confirmation) {
        updatePasswordFeedback.textContent = "Les deux mots de passe ne correspondent pas.";
        return;
      }
      const updateSubmit = updatePasswordForm.querySelector("[type='submit']");
      updateSubmit.disabled = true;
      updatePasswordFeedback.textContent = "Sécurisation de votre accès…";
      const { error } = await client.auth.updateUser({ password });
      if (error) {
        updatePasswordFeedback.textContent = "Le mot de passe n’a pas pu être enregistré. Demandez un nouveau lien.";
        updateSubmit.disabled = false;
        return;
      }
      updatePasswordFeedback.classList.add("success");
      updatePasswordFeedback.textContent = "Mot de passe enregistré. Ouverture de votre espace…";
      const { data: refreshedSession } = await client.auth.getSession();
      openAuthorizedSpace(refreshedSession.session);
    });
  }

  const portalPage = document.querySelector("[data-portal-page]");
  if (!portalPage) return;

  const demoData = {
    user: { id: "demo", email: "client@entreprise.fr", user_metadata: { full_name: "Claire Martin" } },
    organization: { id: 1, name: "Entreprise Démo" },
    subscription: { plan_name: "500 Go", storage_limit_bytes: 500 * 1024 ** 3, storage_used_bytes: 248 * 1024 ** 3, retention_days: 365, status: "active", last_backup_at: new Date(Date.now() - 18 * 60000).toISOString() },
    usage: Array.from({ length: 730 }, (_, index) => ({ measured_on: new Date(Date.now() - (729 - index) * 86400000).toISOString(), storage_bytes: (105 + index * .196 + Math.sin(index / 24) * 3) * 1024 ** 3, protected_devices: 12 })),
    devices: [
      { name: "Poste direction", device_type: "Windows", source_bytes: 128 * 1024 ** 3, stored_bytes: 76 * 1024 ** 3, source_count: 4, last_backup_at: new Date(Date.now() - 18 * 60000).toISOString(), backup_alert: false, missing_backup_alert: false, backup_running: false, active: true },
      { name: "NAS comptabilité", device_type: "NAS", source_bytes: 320 * 1024 ** 3, stored_bytes: 172 * 1024 ** 3, source_count: 6, last_backup_at: new Date(Date.now() - 31 * 60000).toISOString(), backup_alert: false, missing_backup_alert: false, backup_running: false, active: true }
    ],
    alerts: [
      { severity: "info", title: "Sauvegarde effectuée avec succès", occurred_at: new Date(Date.now() - 18 * 60000).toISOString(), status: "open" },
      { severity: "warning", title: "Espace de stockage utilisé à 80 %", occurred_at: new Date(Date.now() - 86400000).toISOString(), status: "open" },
      { severity: "critical", title: "Échec de sauvegarde sur Serveur-01", occurred_at: new Date(Date.now() - 2 * 86400000).toISOString(), status: "open" }
    ],
    invoices: [
      { invoice_number: "F-2026-0045", issued_at: "2026-08-15", amount_cents: 66000, status: "paid", file_path: null },
      { invoice_number: "F-2026-0032", issued_at: "2026-07-15", amount_cents: 66000, status: "paid", file_path: null }
    ],
    requests: [
      { id: 56, subject: "Accès à une sauvegarde", category: "Restauration", status: "in_progress", priority: "normal", message: "Je souhaite récupérer un dossier supprimé sur le poste de direction.", updated_at: new Date().toISOString() },
      { id: 51, subject: "Ajout d’un utilisateur", category: "Contrat", status: "in_progress", priority: "normal", message: "Pouvez-vous ajouter un accès pour notre nouvelle collaboratrice ?", updated_at: new Date(Date.now() - 86400000).toISOString() }
    ]
  };

  let portalState = null;
  const loading = document.querySelector("[data-portal-loading]");
  const shell = document.querySelector("[data-portal-shell]");
  const setText = (selector, value) => { const node = document.querySelector(selector); if (node) node.textContent = value; };
  const statusLabel = { open: "Ouverte", acknowledged: "Prise en compte", resolved: "Résolue", draft: "Brouillon", sent: "Envoyée", paid: "Payée", overdue: "En retard", in_progress: "En cours", closed: "Clôturée" };

  const renderTable = (type, rows, limit) => {
    const items = limit ? rows.slice(0, limit) : rows;
    if (!items.length) return '<div class="portal-empty">Aucune donnée disponible pour le moment.</div>';
    if (type === "alerts") return `<table class="portal-table"><thead><tr><th>Niveau</th><th>Message</th><th>Date</th></tr></thead><tbody>${items.map((item) => `<tr><td><span class="portal-severity ${escapeHtml(item.severity)}"></span>${item.severity === "critical" ? "Critique" : item.severity === "warning" ? "Attention" : "Information"}</td><td>${escapeHtml(item.title)}</td><td>${formatDate(item.occurred_at, true)}</td></tr>`).join("")}</tbody></table>`;
    if (type === "invoices") return `<table class="portal-table"><thead><tr><th>N° de facture</th><th>Date</th><th>Montant</th><th>Statut</th><th></th></tr></thead><tbody>${items.map((item) => `<tr><td>${escapeHtml(item.invoice_number)}</td><td>${formatDate(item.issued_at)}</td><td>${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format((item.amount_cents || 0) / 100)} HT</td><td><span class="portal-status ${escapeHtml(item.status)}">${statusLabel[item.status] || escapeHtml(item.status)}</span></td><td>${item.file_path ? `<button class="portal-download" type="button" data-invoice-path="${escapeHtml(item.file_path)}">Télécharger</button>` : "—"}</td></tr>`).join("")}</tbody></table>`;
    const editable = !limit;
    return `<table class="portal-table portal-requests-table"><thead><tr><th>Référence</th><th>Objet</th><th>Statut</th><th>Mise à jour</th>${editable ? '<th><span class="visually-hidden">Actions</span></th>' : ""}</tr></thead><tbody>${items.map((item) => `<tr><td>#D-${String(item.id).padStart(5, "0")}</td><td><strong>${escapeHtml(item.subject)}</strong><small>${escapeHtml(item.category || "Autre")}</small></td><td><span class="portal-status ${escapeHtml(item.status)}">${statusLabel[item.status] || escapeHtml(item.status)}</span></td><td>${formatDate(item.updated_at, true)}</td>${editable ? `<td><button class="portal-row-action" type="button" data-request-edit="${Number(item.id)}" ${["resolved", "closed"].includes(item.status) ? "disabled title=\"Une demande clôturée ne peut plus être modifiée\"" : ""}>Modifier</button></td>` : ""}</tr>`).join("")}</tbody></table>`;
  };

  const renderOverviewChart = (state, period = 30) => {
    const host = document.querySelector("[data-usage-chart]");
    const usage = (state.usage || []).slice(-period);
    if (!host || !usage.length) return;
    const width = 900, height = 180, top = 16, bottom = 14;
    const values = usage.map((item) => Number(item.storage_bytes || 0));
    const liveStorage = Number(state.subscription?.storage_used_bytes || 0);
    if (liveStorage) values[values.length - 1] = liveStorage;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = Math.max(maxValue - minValue, maxValue * .035, 1);
    const chartMin = Math.max(0, minValue - range * .35);
    const chartMax = maxValue + range * .3;
    const x = (index) => index * (width / Math.max(values.length - 1, 1));
    const y = (value) => top + (chartMax - value) / (chartMax - chartMin) * (height - top - bottom);
    const points = values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
    const area = `0,${height - bottom} ${points} ${width},${height - bottom}`;
    const firstValue = values[0];
    const currentValue = values.at(-1);
    const delta = currentValue - firstValue;
    const deltaPercent = firstValue ? delta / firstValue * 100 : 0;
    const limit = Number(state.subscription?.storage_limit_bytes || 0);
    const available = limit ? Math.max(0, limit - currentValue) : 0;
    const capacity = limit ? currentValue / limit * 100 : 0;
    const labelDate = (value) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(value));
    const changeLabel = firstValue ? `${delta >= 0 ? "↗" : "↘"} ${delta >= 0 ? "+" : "−"}${formatBytes(Math.abs(delta))} (${Math.abs(deltaPercent).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %)` : "Évolution indisponible";

    setText("[data-overview-period-label]", `Évolution sur les ${period} derniers jours`);
    setText("[data-overview-change]", `${changeLabel} sur la période`);
    setText("[data-overview-capacity]", limit ? `${capacity.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % utilisé · ${formatBytes(available)} disponibles` : "Capacité non renseignée");
    setText("[data-overview-range]", `${formatBytes(minValue)} à ${formatBytes(maxValue)}`);
    document.querySelector("[data-overview-change]")?.classList.toggle("down", delta < 0);
    document.querySelectorAll("[data-usage-period]").forEach((button) => {
      const active = Number(button.dataset.usagePeriod) === period;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const hits = usage.map((item, index) => {
      const pointX = x(index), pointY = y(values[index]);
      const date = labelDate(item.measured_on);
      return `<circle class="portal-overview-hit" cx="${pointX}" cy="${pointY}" r="13" tabindex="0" role="button" aria-label="${escapeHtml(date)} : ${escapeHtml(formatBytes(values[index]))}" data-chart-date="${escapeHtml(date)}" data-chart-value="${escapeHtml(formatBytes(values[index]))}" data-chart-x="${(pointX / width * 100).toFixed(2)}" data-chart-y="${(pointY / height * 100).toFixed(2)}"/>`;
    }).join("");
    const dates = [usage[0], usage[Math.floor((usage.length - 1) / 2)], usage.at(-1)];
    host.innerHTML = `<div class="portal-overview-plot"><svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="${escapeHtml(changeLabel)} sur les ${period} derniers jours"><defs><linearGradient id="overview-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#356bff" stop-opacity=".28"/><stop offset="1" stop-color="#356bff" stop-opacity=".025"/></linearGradient></defs><g class="portal-overview-grid"><line x1="0" y1="${top}" x2="${width}" y2="${top}"/><line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}"/><line x1="0" y1="${height - bottom}" x2="${width}" y2="${height - bottom}"/></g><polygon points="${area}" fill="url(#overview-fill)"/><polyline points="${points}" fill="none" stroke="#356bff" stroke-width="3" vector-effect="non-scaling-stroke"/><g>${hits}</g><circle cx="${x(values.length - 1)}" cy="${y(currentValue)}" r="5" fill="#fff" stroke="#356bff" stroke-width="3" vector-effect="non-scaling-stroke"/></svg><div class="portal-overview-tooltip" hidden><strong></strong><span></span></div></div><div class="portal-overview-axis"><span>${escapeHtml(labelDate(dates[0].measured_on))}</span><span>${escapeHtml(labelDate(dates[1].measured_on))}</span><span>${escapeHtml(labelDate(dates[2].measured_on))}</span></div>`;

    const tooltip = host.querySelector(".portal-overview-tooltip");
    const showPoint = (point) => {
      tooltip.hidden = false;
      tooltip.querySelector("strong").textContent = point.dataset.chartValue;
      tooltip.querySelector("span").textContent = point.dataset.chartDate;
      tooltip.style.left = `${Math.min(92, Math.max(8, Number(point.dataset.chartX)))}%`;
      tooltip.style.top = `${Math.max(6, Number(point.dataset.chartY) - 8)}%`;
      host.querySelectorAll(".portal-overview-hit").forEach((item) => item.classList.toggle("active", item === point));
    };
    const hidePoint = () => {
      tooltip.hidden = true;
      host.querySelectorAll(".portal-overview-hit").forEach((item) => item.classList.remove("active"));
    };
    host.querySelectorAll(".portal-overview-hit").forEach((point) => {
      point.addEventListener("mouseenter", () => showPoint(point));
      point.addEventListener("focus", () => showPoint(point));
      point.addEventListener("mouseleave", hidePoint);
      point.addEventListener("blur", hidePoint);
    });
  };

  const statisticPeriods = new Map([
    [30, { label: "30 jours", range: "les 30 derniers jours" }],
    [90, { label: "3 mois", range: "les 3 derniers mois" }],
    [180, { label: "6 mois", range: "les 6 derniers mois" }],
    [365, { label: "1 an", range: "la dernière année" }],
    [730, { label: "2 ans", range: "les 2 dernières années" }]
  ]);

  const renderStatistics = (state, period = 30) => {
    const periodConfig = statisticPeriods.get(period) || statisticPeriods.get(30);
    const periodLabel = periodConfig.label;
    const allUsage = state.usage || [];
    const usage = allUsage.slice(-period);
    const devices = state.devices || [];
    const subscription = state.subscription || {};
    const currentBytes = Number(subscription.storage_used_bytes || usage.at(-1)?.storage_bytes || 0);
    const limitBytes = Number(subscription.storage_limit_bytes || 0);
    const firstBytes = Number(usage[0]?.storage_bytes || 0);
    const deltaBytes = currentBytes - firstBytes;
    const deltaPercent = firstBytes ? (deltaBytes / firstBytes) * 100 : 0;
    const capacityPercent = limitBytes ? Math.min(100, (currentBytes / limitBytes) * 100) : 0;
    const activeDevices = devices.filter((device) => device.active !== false).length;
    const totalSources = devices.reduce((total, device) => total + Number(device.source_count || 0), 0);
    const latestBackup = devices.reduce((latest, device) => {
      const timestamp = new Date(device.last_backup_at || 0).getTime();
      return timestamp > latest ? timestamp : latest;
    }, 0);
    const trendTone = deltaBytes >= 0 ? "up" : "down";
    const trendLabel = firstBytes ? `${deltaBytes >= 0 ? "+" : "−"}${formatBytes(Math.abs(deltaBytes))} (${Math.abs(deltaPercent).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %)` : "Pas encore de comparaison";

    document.querySelectorAll("[data-stat-period]").forEach((button) => {
      const active = Number(button.dataset.statPeriod) === period;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    setText("[data-stat-period-description]", `Mesures quotidiennes sur ${periodConfig.range}`);
    setText("[data-stat-current-volume]", formatBytes(currentBytes));
    setText("[data-stat-volume-change]", firstBytes ? `${trendLabel} sur la période` : "Évolution indisponible");

    const kpis = document.querySelector("[data-stat-kpis]");
    if (kpis) kpis.innerHTML = `
      <article><span>Volume protégé</span><strong>${escapeHtml(formatBytes(currentBytes))}</strong><small class="${trendTone}">${firstBytes ? `${escapeHtml(trendLabel)} sur ${escapeHtml(periodLabel)}` : "Première mesure en attente"}</small></article>
      <article><span>Capacité utilisée</span><strong>${limitBytes ? `${capacityPercent.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : "—"}</strong><small>${limitBytes ? `${escapeHtml(formatBytes(Math.max(0, limitBytes - currentBytes)))} disponibles` : "Capacité non renseignée"}</small></article>
      <article><span>Équipements actifs</span><strong>${activeDevices}</strong><small>${devices.length ? `${activeDevices} sur ${devices.length} opérationnels` : "Aucun équipement renseigné"}</small></article>
      <article><span>Sources protégées</span><strong>${totalSources}</strong><small>${latestBackup ? `Dernière activité ${escapeHtml(relativeBackup(new Date(latestBackup).toISOString()).toLowerCase())}` : "Aucune activité récente"}</small></article>`;

    const capacity = document.querySelector("[data-stat-capacity]");
    if (capacity) capacity.innerHTML = `<div class="portal-panel-heading"><div><h2>Capacité de stockage</h2><p>Consommation de votre formule ${escapeHtml(subscription.plan_name || "SAAS")}</p></div></div><div class="portal-capacity-content"><div class="portal-capacity-ring" style="--capacity:${capacityPercent.toFixed(1)}"><span><strong>${limitBytes ? Math.round(capacityPercent) : "—"}<small>${limitBytes ? "%" : ""}</small></strong><em>utilisé</em></span></div><dl><div><dt>Volume protégé</dt><dd>${escapeHtml(formatBytes(currentBytes))}</dd></div><div><dt>Capacité totale</dt><dd>${limitBytes ? escapeHtml(formatBytes(limitBytes)) : "Non renseignée"}</dd></div><div><dt>Disponible</dt><dd>${limitBytes ? escapeHtml(formatBytes(Math.max(0, limitBytes - currentBytes))) : "—"}</dd></div></dl></div>`;

    const devicePanel = document.querySelector("[data-stat-devices]");
    if (devicePanel) {
      const storedTotal = devices.reduce((total, device) => total + Number(device.stored_bytes || 0), 0);
      const deviceRows = [...devices].sort((a, b) => Number(b.stored_bytes || 0) - Number(a.stored_bytes || 0)).slice(0, 4).map((device) => {
        const share = storedTotal ? Math.max(2, Number(device.stored_bytes || 0) / storedTotal * 100) : 0;
        return `<li><div><strong>${escapeHtml(device.name)}</strong><span>${escapeHtml(device.device_type || "Équipement")}</span></div><b>${escapeHtml(formatBytes(device.stored_bytes))}</b><i><span style="width:${share.toFixed(1)}%"></span></i></li>`;
      }).join("");
      devicePanel.innerHTML = `<div class="portal-panel-heading"><div><h2>Répartition par équipement</h2><p>Principaux volumes actuellement stockés</p></div></div>${deviceRows ? `<ul class="portal-device-share">${deviceRows}</ul>` : '<div class="portal-empty">Aucun équipement sauvegardé.</div>'}`;
    }

    const summary = document.querySelector("[data-stat-summary]");
    if (summary) {
      summary.innerHTML = `<div class="portal-panel-heading"><div><h2>À retenir</h2><p>Lecture rapide de votre situation</p></div></div><ul class="portal-stat-insights"><li><span class="good">✓</span><div><strong>${activeDevices === devices.length && devices.length ? "Tous les équipements sont actifs" : `${activeDevices} équipement${activeDevices > 1 ? "s" : ""} actif${activeDevices > 1 ? "s" : ""}`}</strong><small>${devices.length ? `${devices.length} équipement${devices.length > 1 ? "s" : ""} suivi${devices.length > 1 ? "s" : ""} dans votre espace` : "Ajoutez un équipement pour commencer le suivi"}</small></div></li><li><span>↗</span><div><strong>${firstBytes ? `${trendLabel} en ${periodLabel}` : "Tendance en cours de calcul"}</strong><small>Évolution du volume réellement protégé</small></div></li><li><span class="${capacityPercent >= 80 ? "attention" : "good"}">${capacityPercent >= 80 ? "!" : "✓"}</span><div><strong>${limitBytes ? capacityPercent >= 80 ? "Capacité à surveiller" : "Capacité suffisante" : "Capacité non renseignée"}</strong><small>${limitBytes ? `${escapeHtml(formatBytes(Math.max(0, limitBytes - currentBytes)))} restent disponibles` : "Contactez Alliancia pour connaître votre quota"}</small></div></li></ul><button type="button" class="portal-inline-action" data-portal-view="backups">Voir le détail des sauvegardes →</button>`;
      summary.querySelector("[data-portal-view]")?.addEventListener("click", () => activatePortalView("backups"));
    }

    const chart = document.querySelector("[data-usage-chart-full]");
    if (!chart || !usage.length) return;
    const width = 1000, height = 330, left = 70, right = 22, top = 24, bottom = 48;
    const values = usage.map((item) => Number(item.storage_bytes || 0));
    if (currentBytes) values[values.length - 1] = currentBytes;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = Math.max(maxValue - minValue, maxValue * .08, 1);
    const chartMin = Math.max(0, minValue - range * .35);
    const chartMax = maxValue + range * .35;
    const x = (index) => left + index * ((width - left - right) / Math.max(values.length - 1, 1));
    const y = (value) => top + (chartMax - value) / (chartMax - chartMin) * (height - top - bottom);
    const points = values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
    const area = `${left},${height - bottom} ${points} ${width - right},${height - bottom}`;
    const grid = Array.from({ length: 4 }, (_, index) => {
      const value = chartMin + (chartMax - chartMin) * (3 - index) / 3;
      const lineY = top + index * ((height - top - bottom) / 3);
      return `<line x1="${left}" y1="${lineY}" x2="${width - right}" y2="${lineY}"/><text x="${left - 12}" y="${lineY + 4}" text-anchor="end">${escapeHtml(formatBytes(value))}</text>`;
    }).join("");
    const labelIndexes = [...new Set([0, Math.floor((usage.length - 1) / 2), usage.length - 1])];
    const labels = labelIndexes.map((index) => `<text x="${x(index)}" y="${height - 15}" text-anchor="${index === 0 ? "start" : index === usage.length - 1 ? "end" : "middle"}">${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(usage[index].measured_on))}</text>`).join("");
    const lastX = x(values.length - 1), lastY = y(values.at(-1));
    chart.innerHTML = `<svg class="portal-stat-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Le volume protégé est de ${escapeHtml(formatBytes(currentBytes))}, ${escapeHtml(trendLabel)} sur ${escapeHtml(periodLabel)}"><defs><linearGradient id="stat-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#356bff" stop-opacity=".22"/><stop offset="1" stop-color="#356bff" stop-opacity=".02"/></linearGradient></defs><g class="portal-stat-grid">${grid}</g><polygon points="${area}" fill="url(#stat-fill)"/><polyline points="${points}" fill="none" stroke="#356bff" stroke-width="3" vector-effect="non-scaling-stroke"/><circle cx="${lastX}" cy="${lastY}" r="6" fill="#fff" stroke="#356bff" stroke-width="4" vector-effect="non-scaling-stroke"/><g class="portal-stat-axis">${labels}</g></svg>`;
  };

  const renderDevices = (devices) => {
    if (!devices.length) return '<div class="portal-empty">Aucun équipement sauvegardé pour le moment.</div>';
    return `<table class="portal-table portal-devices-table"><thead><tr><th>Équipement</th><th>Type</th><th>Sources</th><th>Volume source</th><th>Volume stocké</th><th>Dernière sauvegarde</th><th>État</th></tr></thead><tbody>${devices.map((device) => {
      const needsAttention = device.backup_alert || device.missing_backup_alert || !device.active;
      const status = device.backup_running ? "Sauvegarde en cours" : needsAttention ? "À vérifier" : "Opérationnel";
      const tone = device.backup_running ? "in_progress" : needsAttention ? "attention" : "active";
      return `<tr><td><strong>${escapeHtml(device.name)}</strong></td><td>${escapeHtml(device.device_type || "—")}</td><td>${Number(device.source_count || 0)}</td><td>${escapeHtml(formatBytes(device.source_bytes))}</td><td>${escapeHtml(formatBytes(device.stored_bytes))}</td><td>${escapeHtml(formatDate(device.last_backup_at, true))}</td><td><span class="portal-status ${tone}">${status}</span></td></tr>`;
    }).join("")}</tbody></table>`;
  };

  const bindInvoiceDownloads = () => document.querySelectorAll("[data-invoice-path]").forEach((button) => button.addEventListener("click", async () => {
    if (!client) return;
    button.disabled = true;
    button.textContent = "Préparation…";
    const { data, error } = await client.storage.from("invoices").createSignedUrl(button.dataset.invoicePath, 60);
    if (!error && data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    button.textContent = error ? "Indisponible" : "Télécharger";
    button.disabled = false;
  }));

  const activatePortalView = (view, { updateHash = true, smooth = true } = {}) => {
    const panel = document.querySelector(`[data-view-panel="${view}"]`);
    if (!panel) return;
    document.querySelectorAll(".portal-sidebar [data-portal-view]").forEach((button) => button.classList.toggle("active", button.dataset.portalView === view));
    document.querySelectorAll("[data-view-panel]").forEach((item) => {
      const active = item.dataset.viewPanel === view;
      item.hidden = !active;
      item.classList.toggle("active", active);
    });
    document.querySelector(".portal-sidebar")?.classList.remove("open");
    if (updateHash) history.replaceState(null, "", `#${view}`);
    window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
  };

  const renderPortal = (state) => {
    portalState = state;
    const name = state.user.user_metadata?.full_name || state.user.email.split("@")[0];
    const displayEmail = state.user.user_metadata?.display_email || state.user.email;
    setText("[data-organization-name]", state.organization.name);
    setText("[data-user-name]", name);
    setText("[data-user-email]", displayEmail);
    setText("[data-user-initials]", name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase());
    setText("[data-backup-status]", state.subscription?.status === "active" ? "Sauvegardes opérationnelles" : "Situation à vérifier");
    setText("[data-storage-used]", formatBytes(state.subscription?.storage_used_bytes));
    setText("[data-last-backup]", relativeBackup(state.subscription?.last_backup_at));
    setText("[data-retention]", `${state.subscription?.retention_days || 365} jours`);
    setText("[data-storage-summary]", formatBytes(state.subscription?.storage_used_bytes));
    setText("[data-storage-limit]", state.subscription?.storage_limit_bytes ? `sur ${formatBytes(state.subscription.storage_limit_bytes)}` : "Capacité non renseignée");
    document.querySelector("[data-alerts-preview]").innerHTML = renderTable("alerts", state.alerts, 4);
    document.querySelector("[data-invoices-preview]").innerHTML = renderTable("invoices", state.invoices, 4);
    document.querySelector("[data-requests-preview]").innerHTML = renderTable("requests", state.requests, 4);
    document.querySelector("[data-alerts-list]").innerHTML = renderTable("alerts", state.alerts);
    document.querySelector("[data-invoices-list]").innerHTML = renderTable("invoices", state.invoices);
    document.querySelector("[data-requests-list]").innerHTML = renderTable("requests", state.requests);
    document.querySelector("[data-backups-list]").innerHTML = renderDevices(state.devices || []);
    renderOverviewChart(state);
    renderStatistics(state);
    document.querySelectorAll("[data-usage-period]").forEach((button) => button.addEventListener("click", () => renderOverviewChart(state, Number(button.dataset.usagePeriod))));
    document.querySelectorAll("[data-stat-period]").forEach((button) => button.addEventListener("click", () => renderStatistics(state, Number(button.dataset.statPeriod))));
    bindInvoiceDownloads();
    loading.hidden = true;
    shell.hidden = false;
    activatePortalView(location.hash.slice(1) || "overview", { updateHash: false, smooth: false });
  };

  const loadPortal = async () => {
    if (isLocalDemo) { renderPortal(demoData); return; }
    if (!client) { location.replace(`/connexion.html${location.hash === "#downloads" ? "?next=downloads" : ""}`); return; }
    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) { location.replace(`/connexion.html${location.hash === "#downloads" ? "?next=downloads" : ""}`); return; }
    const { data: membership, error: membershipError } = await client.from("organization_members").select("organization_id, role, organizations(id,name)").eq("user_id", user.id).limit(1).maybeSingle();
    if (membershipError || !membership?.organizations) {
      loading.innerHTML = "<strong>Votre compte n’est associé à aucune entreprise.</strong><p>Contactez Alliancia Solutions pour finaliser votre accès.</p>";
      return;
    }
    const organizationId = membership.organization_id;
    const [subscription, usage, alerts, invoices, requests, devices] = await Promise.all([
      client.from("subscriptions").select("*").eq("organization_id", organizationId).maybeSingle(),
      client.from("usage_daily").select("*").eq("organization_id", organizationId).order("measured_on", { ascending: false }).limit(730),
      client.from("alerts").select("*").eq("organization_id", organizationId).order("occurred_at", { ascending: false }).limit(100),
      client.from("invoices").select("*").eq("organization_id", organizationId).order("issued_at", { ascending: false }).limit(100),
      client.from("support_requests").select("*").eq("organization_id", organizationId).order("updated_at", { ascending: false }).limit(100),
      client.from("backup_devices").select("*").eq("organization_id", organizationId).order("last_backup_at", { ascending: false }).limit(200)
    ]);
    const firstError = [subscription, usage, alerts, invoices, requests, devices].find((result) => result.error)?.error;
    if (firstError) {
      loading.innerHTML = "<strong>Impossible de charger votre espace.</strong><p>Réessayez dans quelques instants ou contactez l’assistance.</p>";
      return;
    }
    renderPortal({ user, organization: membership.organizations, subscription: subscription.data, usage: [...(usage.data || [])].reverse(), alerts: alerts.data || [], invoices: invoices.data || [], requests: requests.data || [], devices: devices.data || [] });
  };

  document.querySelectorAll("[data-portal-view]").forEach((control) => control.addEventListener("click", () => activatePortalView(control.dataset.portalView)));
  window.addEventListener("hashchange", () => activatePortalView(location.hash.slice(1) || "overview", { updateHash: false, smooth: false }));

  const activateDownloadPlatform = (platform) => {
    document.querySelectorAll("[data-download-tab]").forEach((tab) => {
      const active = tab.dataset.downloadTab === platform;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll("[data-download-panel]").forEach((panel) => { panel.hidden = panel.dataset.downloadPanel !== platform; });
  };
  const downloadTabs = [...document.querySelectorAll("[data-download-tab]")];
  downloadTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateDownloadPlatform(tab.dataset.downloadTab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let targetIndex = event.key === "Home" ? 0 : event.key === "End" ? downloadTabs.length - 1 : index + (event.key === "ArrowRight" ? 1 : -1);
      targetIndex = (targetIndex + downloadTabs.length) % downloadTabs.length;
      downloadTabs[targetIndex].click();
      downloadTabs[targetIndex].focus();
    });
  });
  document.querySelectorAll("[data-portal-copy]").forEach((button) => button.addEventListener("click", async () => {
    const value = button.parentElement?.querySelector("code")?.textContent.trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement("textarea");
      input.value = value;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    const label = button.textContent;
    button.textContent = "Copié";
    window.setTimeout(() => { button.textContent = label; }, 1200);
  }));
  document.querySelector("[data-portal-menu]")?.addEventListener("click", () => document.querySelector(".portal-sidebar")?.classList.toggle("open"));
  document.querySelector("[data-logout]")?.addEventListener("click", async () => { if (client) await client.auth.signOut(); location.replace("/connexion.html"); });

  const requestDialog = document.querySelector("[data-request-dialog]");
  const requestForm = document.querySelector("[data-request-form]");
  const requestTitle = document.querySelector("[data-request-title]");
  const requestContext = document.querySelector("[data-request-context]");
  const requestSubmit = document.querySelector("[data-request-submit]");
  const prepareNewRequest = () => {
    requestForm?.reset();
    requestForm.elements.id.value = "";
    requestTitle.textContent = "Nouvelle demande";
    requestContext.textContent = "Décrivez votre besoin : votre demande sera transmise à l’équipe Alliancia.";
    requestSubmit.textContent = "Envoyer la demande";
    document.querySelector("[data-request-feedback]").classList.remove("success");
    document.querySelector("[data-request-feedback]").textContent = "";
    requestDialog?.showModal();
  };
  const prepareRequestEdit = (request) => {
    requestForm.reset();
    requestForm.elements.id.value = request.id;
    requestForm.elements.subject.value = request.subject || "";
    requestForm.elements.category.value = request.category || "Autre";
    requestForm.elements.priority.value = request.priority || "normal";
    requestForm.elements.message.value = request.message || "";
    requestTitle.textContent = `Modifier la demande #D-${String(request.id).padStart(5, "0")}`;
    requestContext.textContent = "Le statut reste géré par l’équipe Alliancia. Vos modifications seront horodatées dans le suivi.";
    requestSubmit.textContent = "Enregistrer les modifications";
    document.querySelector("[data-request-feedback]").classList.remove("success");
    document.querySelector("[data-request-feedback]").textContent = "";
    requestDialog?.showModal();
  };
  const bindRequestEdits = () => document.querySelectorAll("[data-request-edit]").forEach((button) => button.addEventListener("click", () => {
    const request = portalState?.requests.find((item) => Number(item.id) === Number(button.dataset.requestEdit));
    if (request) prepareRequestEdit(request);
  }));
  const renderRequestViews = () => {
    document.querySelector("[data-requests-preview]").innerHTML = renderTable("requests", portalState.requests, 4);
    document.querySelector("[data-requests-list]").innerHTML = renderTable("requests", portalState.requests);
    bindRequestEdits();
  };
  document.querySelectorAll("[data-new-request]").forEach((button) => button.addEventListener("click", prepareNewRequest));
  document.querySelector("[data-request-close]")?.addEventListener("click", () => requestDialog?.close());
  requestForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = document.querySelector("[data-request-feedback]");
    const submit = form.querySelector("[type='submit']");
    const payload = Object.fromEntries(new FormData(form));
    const requestId = Number(payload.id || 0);
    submit.disabled = true;
    if (isLocalDemo) {
      if (requestId) {
        const request = portalState.requests.find((item) => Number(item.id) === requestId);
        Object.assign(request, { subject: payload.subject, category: payload.category, priority: payload.priority, message: payload.message, updated_at: new Date().toISOString() });
        renderRequestViews();
        feedback.classList.add("success");
        feedback.textContent = "Modifications enregistrées en mode démonstration.";
      } else {
        feedback.textContent = "Mode démonstration : la demande serait transmise ici.";
      }
      window.setTimeout(() => requestDialog.close(), 700);
      submit.disabled = false;
      return;
    }
    const values = { subject: payload.subject.trim(), category: payload.category, priority: payload.priority, message: payload.message.trim() };
    const result = requestId
      ? await client.from("support_requests").update(values).eq("id", requestId).eq("organization_id", portalState.organization.id).select().single()
      : await client.from("support_requests").insert({ organization_id: portalState.organization.id, created_by: portalState.user.id, ...values }).select().single();
    feedback.classList.toggle("success", !result.error);
    feedback.textContent = result.error ? "La demande n’a pas pu être enregistrée." : requestId ? "Les modifications ont bien été enregistrées." : "Votre demande a bien été transmise.";
    if (!result.error) {
      if (requestId) portalState.requests = portalState.requests.map((item) => Number(item.id) === requestId ? result.data : item);
      else portalState.requests.unshift(result.data);
      renderRequestViews();
      window.setTimeout(() => requestDialog.close(), 700);
    }
    submit.disabled = false;
  });

  loadPortal().then(() => bindRequestEdits());
})();
